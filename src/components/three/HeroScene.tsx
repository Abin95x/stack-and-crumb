"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { damp, easeInOutCubic, easeOutCubic, lerp, segment } from "@/lib/anim";
import { HERO_LAYERS, heroLayerWindow } from "@/lib/hero";
import { Ingredient, LAYER_HEIGHT, stackOffsets } from "./Ingredients";
import { SoftShadow } from "./SoftShadow";
import { Stage, useWake } from "./Stage";

/*
 * Scattered ingredients → assembled burger.
 *
 * Before scrolling, every layer floats around the burger, tumbling gently.
 * Scrolling flies them in one at a time, bottom first. Each flight has three
 * legs so nothing ever passes through anything:
 *   1. swing out toward the camera, in front of every piece still waiting,
 *      then rise or sink to just above the current top of the stack;
 *   2. glide in over the stack at that height;
 *   3. drop straight down onto the layer below.
 */

/** Waiting spots in burger units: [x, y, z, tiltX, tiltY, tiltZ]. */
const SCATTER: [number, number, number, number, number, number][] = [
  [-1.7, -0.9, 0.3, 0.6, 0.2, -0.45], // bottom bun
  [2.1, 3.1, -0.6, 0.9, 0, 0.5], // lettuce
  [-2.0, 2.5, -0.4, -0.8, 0.5, 0.6], // tomato
  [2.3, 0.5, 0.2, 0.5, 0, -0.9], // patty
  [-0.5, 3.8, -1.0, 1.1, 0.3, 0.2], // cheese
  [1.3, -1.1, 0.8, -0.7, 0.4, 0.5], // patty
  [2.5, 1.9, -1.6, -0.6, 0.2, -0.9], // cheese
  [-2.3, 0.9, 0.5, 1.2, 0, 0.3], // pickles
  [-0.4, -1.5, 1.0, 0.8, 0.2, -0.4], // onion
  [0.3, 1.6, -2.0, -0.35, 0, 0.25], // top bun — behind the column, where no flight path goes
];

/** How far in front of everything a piece swings while flying. */
const FRONT_Z = 2.8;
/** Clearance above the stack while gliding in. */
const HOVER = 0.6;

const tmp = {
  from: SCATTER.map(([, , , x, y, z]) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z))),
  q: new THREE.Quaternion(),
  spinQ: new THREE.Quaternion(),
  flat: new THREE.Quaternion(),
  yawQ: new THREE.Quaternion(),
  up: new THREE.Vector3(0, 1, 0),
  axis: new THREE.Vector3(0.3, 1, 0.2).normalize(),
};

function Burger({ progress }: { progress: RefObject<number> }) {
  const root = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Group>(null);
  const layers = useRef<(THREE.Group | null)[]>([]);
  const smooth = useRef(0);
  const born = useRef<number | null>(null);
  const viewport = useThree((s) => s.viewport);
  const wake = useWake();

  // Full frame rate for the opening fly-in.
  useEffect(() => wake(2400), [wake]);

  const offsets = useMemo(() => stackOffsets(HERO_LAYERS), []);
  const height = offsets[offsets.length - 1] + LAYER_HEIGHT.bunTop;

  // Smooth the raw scroll value before anything reads it.
  useFrame((_, dt) => {
    smooth.current = damp(smooth.current, progress.current ?? 0, 5, Math.min(dt, 0.05));
  }, -1);

  useFrame((state, dt) => {
    const { camera, pointer } = state;
    const P = smooth.current;
    const time = state.clock.elapsedTime;
    if (born.current === null) born.current = time;
    const intro = easeOutCubic(segment(time - born.current, 0.1, 1.6));

    // Frame the burger: to the right on wide screens. On portrait screens it sits
    // between the headline and the caption card.
    const wide = viewport.aspect > 1.1;
    const scale = wide
      ? Math.min((viewport.height * 0.5) / height, (viewport.width * 0.3) / 2.6)
      : Math.min((viewport.height * 0.27) / height, (viewport.width * 0.58) / 2.6);
    const r = root.current!;
    r.scale.setScalar(scale);
    r.position.set(wide ? viewport.width * 0.19 : 0, wide ? -0.1 : -viewport.height * 0.03, 0);

    camera.position.x = damp(camera.position.x, pointer.x * 0.35, 3, dt);
    camera.position.y = damp(camera.position.y, 1.4 + pointer.y * 0.2, 3, dt);
    camera.lookAt(0, 0.1, 0);

    const yaw = time * 0.18 + P * 1.4;
    spin.current!.rotation.x = lerp(0, 0.16, easeInOutCubic(segment(P, 0.8, 0.2)));

    const spread = 1 + (1 - intro) * 2.2;
    // Phones have less room, so the scatter is tighter and the pieces smaller.
    const floatSize = wide ? 0.52 : 0.36;
    HERO_LAYERS.forEach((_, i) => {
      const g = layers.current[i];
      if (!g) return;
      const [start, length] = heroLayerWindow(i);
      const t = segment(P, start, length);
      const [sx, sy, sz] = SCATTER[i];
      const target = offsets[i];
      const hover = target + HOVER;

      // Where it waits (with a gentle bob), flying in from afar on load.
      const wx = sx * spread * (wide ? 1 : 0.62) + Math.sin(time * 0.9 + i * 1.7) * 0.1 * (1 - t);
      const wy = (wide ? sy : sy * 0.6 - 0.3) * spread + Math.sin(time * 1.2 + i * 2.3) * 0.14 * (1 - t);

      // Leg 1: out to the front first, then up/down to hover height.
      const out = easeOutCubic(segment(t, 0, 0.25));
      const rise = easeInOutCubic(segment(t, 0.1, 0.25));
      // Leg 2: glide in over the stack.
      const glide = easeInOutCubic(segment(t, 0.35, 0.35));
      // Leg 3: drop onto the stack.
      const c = segment(t, 0.7, 0.3);
      const drop = c * c;

      const x = lerp(wx, 0, glide);
      const y = drop > 0 ? lerp(hover, target, drop) : lerp(wy, hover, rise);
      const z = lerp(lerp(sz, FRONT_Z, out), 0, glide);
      g.position.set(x, y, z);

      // Tumble while waiting, flatten on the way in, turn with the burger once down.
      const flat = easeOutCubic(segment(t, 0, 0.7));
      tmp.spinQ.setFromAxisAngle(tmp.axis, time * 0.35 * (1 - flat) + i);
      tmp.q.copy(tmp.from[i]).multiply(tmp.spinQ);
      g.quaternion.slerpQuaternions(tmp.q, tmp.flat, flat);
      g.quaternion.premultiply(tmp.yawQ.setFromAxisAngle(tmp.up, yaw * c));

      const size = lerp(floatSize, 1, flat);
      const squash = Math.sin(Math.PI * segment(c, 0.75, 0.25));
      g.scale.set(size * (1 + squash * 0.06), size * (1 - squash * 0.14), size * (1 + squash * 0.06));
    });

    shadow.current!.scale.setScalar(Math.max(1e-4, easeOutCubic(segment(P, 0.04, 0.2))));
  });

  return (
    <group ref={root}>
      <group position-y={-height / 2}>
        <group ref={spin}>
          {HERO_LAYERS.map((k, i) => (
            <group key={i} ref={(el) => void (layers.current[i] = el)}>
              <Ingredient kind={k} />
            </group>
          ))}
        </group>
        <group ref={shadow} position-y={-0.02}>
          <SoftShadow width={3.6} opacity={0.6} color="#050805" />
        </group>
      </group>
    </group>
  );
}

export default function HeroScene({ progress }: { progress: RefObject<number> }) {
  return (
    <Stage className="absolute inset-0" priority>
      <Burger progress={progress} />
    </Stage>
  );
}
