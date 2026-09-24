"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import * as THREE from "three";
import { damp, easeInOutCubic, lerp, segment } from "@/lib/anim";
import { Roll } from "./Roll";
import { SoftShadow } from "./SoftShadow";
import { Stage } from "./Stage";

function Rig({ progress }: { progress: RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const smooth = useRef(0);
  const viewport = useThree((s) => s.viewport);

  useFrame((_, dt) => {
    smooth.current = damp(smooth.current, progress.current ?? 0, 5, Math.min(dt, 0.05));
  }, -1);

  useFrame((state, dt) => {
    const { camera, pointer } = state;
    const P = smooth.current;
    const t = state.clock.elapsedTime;
    const g = group.current!;
    const wide = viewport.aspect > 1.1;
    g.scale.setScalar(Math.min((viewport.height * 0.55) / 1.6, (viewport.width * (wide ? 0.5 : 0.92)) / ROLL_SPAN));
    g.position.y = wide ? -0.25 : -0.1;

    // Swing from a lazy 3/4 view to face-on for the build, then a proud turn at the end.
    const intro = easeInOutCubic(segment(P, 0, 0.12));
    const outro = easeInOutCubic(segment(P, 0.86, 0.14));
    g.rotation.y = lerp(-0.55, 0.06, intro) + outro * 0.55 + Math.sin(t * 0.5) * 0.04;
    g.rotation.x = lerp(0.1, 0.3, intro) - outro * 0.12;
    g.rotation.z = Math.sin(t * 0.7) * 0.015;

    camera.position.x = damp(camera.position.x, pointer.x * 0.3, 3, dt);
    camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={group}>
      <Roll progress={smooth} />
      <SoftShadow width={5.4} depth={1.9} opacity={0.4} color="#3b2410" y={-0.46} />
    </group>
  );
}

const ROLL_SPAN = 4.6;

export default function RollScene({ progress }: { progress: RefObject<number> }) {
  return (
    <Stage className="absolute inset-0" camera={{ position: [0, 2.6, 7.2], fov: 32 }}>
      <Rig progress={progress} />
    </Stage>
  );
}
