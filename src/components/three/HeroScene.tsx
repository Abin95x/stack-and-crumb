"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { damp, easeInOutCubic, easeOutCubic, lerp, segment } from "@/lib/anim";
import { HERO_LAYERS, heroLayerWindow } from "@/lib/hero";
import { Ingredient, stackOffsets } from "./Ingredients";
import { SoftShadow } from "./SoftShadow";
import { Stage, useWake } from "./Stage";

/** Where each layer floats before the burger comes together (burger-local space). */
const SCATTER: [number, number, number, number, number, number][] = [
  [-1.7, -0.9, 0.3, 0.6, 0.2, -0.45],
  [2.1, 3.1, -0.6, 0.9, 0, 0.5],
  [-2.0, 2.5, -0.4, -0.8, 0.5, 0.6],
  [2.3, 0.5, 0.2, 0.5, 0, -0.9],
  [-0.5, 3.8, -1.0, 1.1, 0.3, 0.2],
  [1.3, -1.1, 0.8, -0.7, 0.4, 0.5],
  [2.5, 1.9, -1.2, -0.6, 0.2, -0.9],
  [-2.3, 0.9, 0.5, 1.2, 0, 0.3],
  [-0.4, -1.5, 1.0, 0.8, 0.2, -0.4],
  [0.3, 1.6, 0.4, -0.35, 0, 0.25],
];

const tmp = {
  from: SCATTER.map(([, , , rx, ry, rz]) => new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz))),
  q: new THREE.Quaternion(),
  spinQ: new THREE.Quaternion(),
  id: new THREE.Quaternion(),
  yawQ: new THREE.Quaternion(),
  up: new THREE.Vector3(0, 1, 0),
  axis: new THREE.Vector3(0.3, 1, 0.2).normalize(),
};

function Burger({ progress }: { progress: RefObject<number> }) {
  const root = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const layers = useRef<(THREE.Group | null)[]>([]);
  const shadow = useRef<THREE.Group>(null);
  const smooth = useRef(0);
  const born = useRef<number | null>(null);
  const viewport = useThree((s) => s.viewport);
  const wake = useWake();

  // Full frame rate for the opening fly-in.
  useEffect(() => wake(2200), [wake]);

  const offsets = useMemo(() => stackOffsets(HERO_LAYERS), []);
  const height = offsets[offsets.length - 1] + 0.95;

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

    // Frame the burger: to the right on wide screens, centred and smaller on phones.
    const wide = viewport.aspect > 1.1;
    const scale = wide
      ? Math.min((viewport.height * 0.5) / height, (viewport.width * 0.3) / 2.6)
      : Math.min((viewport.height * 0.36) / height, (viewport.width * 0.62) / 2.6);
    const r = root.current!;
    r.scale.setScalar(scale);
    r.position.set(wide ? viewport.width * 0.19 : 0, wide ? -0.1 : -viewport.height * 0.12, 0);

    camera.position.x = damp(camera.position.x, pointer.x * 0.35, 3, dt);
    camera.position.y = damp(camera.position.y, 1.4 + pointer.y * 0.2, 3, dt);
    camera.lookAt(0, 0.1, 0);

    // Only settled layers turn with the burger; floating ones stay put so they never swing into the lens.
    const yaw = time * 0.18 + P * 1.4;
    spin.current!.rotation.x = lerp(0, 0.16, easeInOutCubic(segment(P, 0.8, 0.2)));

    const spread = 1 + (1 - intro) * 2.2;
    HERO_LAYERS.forEach((_, i) => {
      const g = layers.current[i];
      if (!g) return;
      const [start, length] = heroLayerWindow(i);
      const t = segment(P, start, length);
      const e = easeInOutCubic(t);
      const free = 1 - e;
      const [sx, sy, sz] = SCATTER[i];

      const fx = sx * spread * (wide ? 1 : 0.62) + Math.sin(time * 0.9 + i * 1.7) * 0.12;
      const fy = sy * spread + Math.sin(time * 1.2 + i * 2.3) * 0.16;
      const fz = sz + Math.cos(time * 0.8 + i) * 0.1;
      g.position.set(lerp(fx, 0, e), lerp(fy, offsets[i], e) + Math.sin(Math.PI * t) * 0.7, lerp(fz, 0, e));

      // Tumble while floating, settle flat when stacked.
      tmp.spinQ.setFromAxisAngle(tmp.axis, time * 0.35 * free + i);
      tmp.q.copy(tmp.from[i]).multiply(tmp.spinQ);
      g.quaternion.slerpQuaternions(tmp.q, tmp.id, e).premultiply(tmp.yawQ.setFromAxisAngle(tmp.up, yaw * e));

      // Floating pieces are a little smaller so the scatter doesn't crowd the copy.
      const size = lerp(0.52, 1, e);
      const squash = Math.sin(Math.PI * segment(t, 0.8, 0.2));
      g.scale.set(size * (1 + squash * 0.07), size * (1 - squash * 0.16), size * (1 + squash * 0.07));
    });

    const s = shadow.current!;
    s.scale.setScalar(Math.max(1e-4, easeOutCubic(segment(P, 0.04, 0.2))));
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
