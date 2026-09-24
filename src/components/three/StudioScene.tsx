"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Render } from "@/lib/menu";
import { StaticBurger, stackOffsets } from "./Ingredients";
import { Roll } from "./Roll";
import { SoftShadow } from "./SoftShadow";
import { Stage } from "./Stage";

/** Signals the page once enough frames have rendered for a clean screenshot. */
function Ready() {
  const frames = useRef(0);
  useFrame(({ camera }) => {
    camera.lookAt(0, 0, 0);
    if (++frames.current === 30) document.body.dataset.ready = "true";
  });
  return null;
}

export default function StudioScene({ render }: { render: Render }) {
  const done = useRef(1);
  const height =
    render.type === "burger" ? stackOffsets(render.layers).at(-1)! + 0.95 : 0;

  return (
    <Stage className="h-full w-full" camera={{ position: [0, render.type === "burger" ? 1.5 : 3.2, 7.4], fov: 30 }} still>
      <Ready />
      {render.type === "burger" ? (
        <group position-y={-height / 2} rotation-y={0.5} scale={Math.min(1, 2.9 / height)}>
          <StaticBurger layers={render.layers} />
          <SoftShadow width={3.6} opacity={0.45} color="#2b1a0c" />
        </group>
      ) : (
        <group rotation={[0.3, -0.3, 0]} scale={0.74} position-y={-0.15}>
          <Roll progress={done} variant={render.variant} restAngle={0.75} />
          <SoftShadow width={5.4} depth={1.9} opacity={0.4} color="#2b1a0c" y={-0.46} />
        </group>
      )}
    </Stage>
  );
}
