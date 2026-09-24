"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { damp } from "@/lib/anim";
import { Ingredient, stackOffsets, type LayerKind } from "./Ingredients";
import { SoftShadow } from "./SoftShadow";
import { Stage, useWake } from "./Stage";

export type BuiltLayer = { id: number; kind: LayerKind };

/** One layer that drops in from above and springs onto its slot. */
function Dropping({ kind, target, index }: { kind: LayerKind; target: number; index: number }) {
  const ref = useRef<THREE.Group>(null);
  const state = useRef({ y: target + 4, v: 0, squash: 0 });

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const s = state.current;
    const before = s.v;
    // Critically-underdamped spring: falls, overshoots a touch, settles.
    s.v += ((target - s.y) * 140 - s.v * 16) * dt;
    s.y += s.v * dt;
    if (before < -1.5 && s.v >= 0) s.squash = 1;
    s.squash = damp(s.squash, 0, 9, dt);
    const g = ref.current!;
    g.position.y = s.y;
    g.scale.set(1 + s.squash * 0.08, 1 - s.squash * 0.2, 1 + s.squash * 0.08);
    g.rotation.y = index * 0.45;
  });

  return (
    <group ref={ref} position-y={target + 4}>
      <Ingredient kind={kind} />
    </group>
  );
}

function Stack({ layers, closed }: { layers: BuiltLayer[]; closed: boolean }) {
  const lift = useRef<THREE.Group>(null);
  const turn = useRef<THREE.Group>(null);
  const viewport = useThree((s) => s.viewport);
  const wake = useWake();
  // Run at full rate while the newest layer falls and springs into place.
  useEffect(() => wake(1800), [layers.length, closed, wake]);
  const kinds: LayerKind[] = ["bunBottom", ...layers.map((l) => l.kind), ...(closed ? (["bunTop"] as const) : [])];
  const offsets = stackOffsets(kinds);
  const height = offsets[offsets.length - 1] + (closed ? 0.95 : 0.2);

  useFrame((state, dt) => {
    // Keep the whole stack in frame as it grows.
    const fit = Math.min(1, 3.4 / Math.max(height, 1.6)) * Math.min(1, viewport.width / 4.2);
    const l = lift.current!;
    l.scale.setScalar(damp(l.scale.x, fit, 4, dt));
    l.position.y = damp(l.position.y, (-height / 2) * fit, 4, dt);
    turn.current!.rotation.y = state.clock.elapsedTime * 0.3;
  });

  return (
    <group ref={lift}>
      <group ref={turn}>
        <Dropping kind="bunBottom" target={0} index={0} />
        {layers.map((l, i) => (
          <Dropping key={l.id} kind={l.kind} target={offsets[i + 1]} index={i + 1} />
        ))}
        {closed && <Dropping key="top" kind="bunTop" target={offsets[offsets.length - 1]} index={0} />}
      </group>
      <SoftShadow width={3.4} opacity={0.55} color="#0a0603" y={-0.01} />
    </group>
  );
}

export default function BuilderScene({ layers, closed }: { layers: BuiltLayer[]; closed: boolean }) {
  return (
    <Stage className="absolute inset-0" camera={{ position: [0, 1.5, 7.5], fov: 33 }}>
      <LookAt />
      <Stack layers={layers} closed={closed} />
    </Stage>
  );
}

function LookAt() {
  useFrame(({ camera }) => camera.lookAt(0, 0, 0));
  return null;
}
