"use client";

import { Canvas, useFrame, useThree, type CanvasProps } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

/** How long (ms) a scene keeps rendering at full rate after something happens. */
const WAKE_MS = 700;

/** Lets a scene request full-rate rendering, e.g. while a spring settles. */
const WakeContext = createContext<(ms?: number) => void>(() => {});
export const useWake = () => useContext(WakeContext);

/**
 * Renders on demand: full rate while `isActive()` (scrolling, pointer moving,
 * or a scene asked for it), ~30 fps for idle motion, nothing when off-screen.
 * Shadow maps refresh every frame only while active, every 4th otherwise.
 */
function Driver({ visible, isActive }: { visible: boolean; isActive: () => boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  const frame = useRef(0);

  useEffect(() => {
    if (!visible) return;
    let raf = 0;
    let tick = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (isActive() || ++tick % 2 === 0) invalidate();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [visible, invalidate, isActive]);

  useFrame(({ gl }) => {
    if (isActive() || ++frame.current % 4 === 0) gl.shadowMap.needsUpdate = true;
  });

  return null;
}

/**
 * Compiles every shader in the scene in the background (KHR_parallel_shader_compile)
 * and uploads buffers with one draw, so a scene mounted during idle time is
 * ready before it scrolls into view instead of stuttering on its first frame.
 */
function Warmup() {
  const get = useThree((s) => s.get);
  useEffect(() => {
    let cancelled = false;
    const { gl, scene, camera } = get();
    gl.compileAsync(scene, camera).then(() => {
      if (!cancelled) get().gl.render(get().scene, get().camera);
    });
    return () => {
      cancelled = true;
    };
  }, [get]);
  return null;
}

/**
 * Canvas with warm studio lighting. Mounts lazily (hero first, the rest when
 * the browser is idle or they approach the viewport) and pauses off-screen.
 */
export function Stage({
  children,
  camera = { position: [0, 1.4, 8.5], fov: 35 },
  className,
  priority = false,
  still = false,
}: {
  children: ReactNode;
  camera?: CanvasProps["camera"];
  className?: string;
  /** Mount immediately instead of waiting for idle time. */
  priority?: boolean;
  /** Render continuously with a preserved buffer, for screenshots. */
  still?: boolean;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const activeUntil = useRef(0);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(priority || still);

  useEffect(() => {
    const el = wrap.current!;
    const near = new IntersectionObserver(([e]) => e.isIntersecting && setMounted(true), { rootMargin: "150% 0px" });
    const onScreen = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "80px 0px" });
    near.observe(el);
    onScreen.observe(el);
    // Warm up below-the-fold scenes when the main thread is free, so their
    // shader compile doesn't land mid-scroll.
    const idle = window.requestIdleCallback?.(() => setMounted(true), { timeout: 5000 });
    return () => {
      near.disconnect();
      onScreen.disconnect();
      if (idle) window.cancelIdleCallback(idle);
    };
  }, []);

  const wake = useCallback((ms = WAKE_MS) => {
    activeUntil.current = Math.max(activeUntil.current, performance.now() + ms);
  }, []);
  const isActive = useCallback(() => performance.now() < activeUntil.current, []);

  useEffect(() => {
    if (!visible) return;
    const onInput = () => wake();
    onInput();
    window.addEventListener("scroll", onInput, { passive: true });
    window.addEventListener("pointermove", onInput, { passive: true });
    window.addEventListener("resize", onInput, { passive: true });
    return () => {
      window.removeEventListener("scroll", onInput);
      window.removeEventListener("pointermove", onInput);
      window.removeEventListener("resize", onInput);
    };
  }, [visible, wake]);

  return (
    <div ref={wrap} className={className}>
      {mounted && (
        <Canvas
          frameloop={still ? "always" : visible ? "demand" : "never"}
          shadows="percentage"
          dpr={[1, 1.5]}
          camera={camera}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: still }}
          onCreated={({ gl }) => {
            // Shadow maps are refreshed by <Driver> instead of on every frame.
            if (!still) gl.shadowMap.autoUpdate = false;
            // Neutral tone mapping keeps food hues true; ACES/AgX push crust and cheese toward beige.
            gl.toneMapping = THREE.NeutralToneMapping;
            gl.toneMappingExposure = 1;
          }}
        >
          {!still && <Driver visible={visible} isActive={isActive} />}
          <ambientLight intensity={0.15} />
          {/* Key: warm, high and to the side, like a window. */}
          <directionalLight
            position={[4, 7, 5]}
            intensity={2.6}
            color="#fff0dc"
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0004}
            shadow-normalBias={0.02}
            shadow-radius={4}
            shadow-camera-left={-4}
            shadow-camera-right={4}
            shadow-camera-top={4}
            shadow-camera-bottom={-4}
          />
          {/* Rim: light from behind that outlines crust, cheese and leaves. */}
          <directionalLight position={[-3, 3.5, -6]} intensity={3.2} color="#fff6ea" />
          <directionalLight position={[-6, 1, 3]} intensity={0.5} color="#ffc98a" />
          {/* Food-photo softboxes, baked once into the environment map. */}
          <Environment resolution={128} frames={1}>
            <Lightformer form="rect" intensity={2.4} position={[0, 6, 1]} rotation-x={Math.PI / 2} scale={[8, 5, 1]} />
            <Lightformer form="rect" intensity={3} color="#ffd7a8" position={[-5, 2.5, 3]} rotation-y={Math.PI / 3} scale={[4, 3, 1]} />
            <Lightformer form="rect" intensity={1} color="#d8e8ff" position={[5, 1.5, 3]} rotation-y={-Math.PI / 3} scale={[4, 3, 1]} />
            <Lightformer form="rect" intensity={4} position={[0, 2, -6]} scale={[10, 0.6, 1]} />
            <Lightformer form="circle" intensity={1.2} color="#ffe9cc" position={[0, 1, 7]} scale={3} />
          </Environment>
          <WakeContext.Provider value={wake}>{children}</WakeContext.Provider>
          {!still && <Warmup />}
        </Canvas>
      )}
    </div>
  );
}
