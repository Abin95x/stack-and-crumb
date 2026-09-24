import * as THREE from "three";
import { cached } from "./geometry";

const shadowTexture = () =>
  cached("tex:softShadow", () => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.45, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  });

const plane = () => cached("geo:softShadow", () => new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2));

/**
 * Baked contact shadow: a blurred blob on the floor. Costs one textured quad
 * instead of an extra depth render and blur passes every frame.
 */
export function SoftShadow({
  width = 3,
  depth = width,
  opacity = 0.5,
  color = "#1a0d05",
  y = 0,
}: {
  width?: number;
  depth?: number;
  opacity?: number;
  color?: string;
  y?: number;
}) {
  return (
    <mesh geometry={plane()} position-y={y} scale={[width, 1, depth]} renderOrder={-1}>
      <meshBasicMaterial
        map={shadowTexture()}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
