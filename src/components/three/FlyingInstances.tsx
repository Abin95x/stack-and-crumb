import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { clamp01, easeOutBack, easeOutCubic } from "@/lib/anim";

// Scratch objects shared by every instance update (render loop is single-threaded).
const m = new THREE.Matrix4();
const v = new THREE.Vector3();
const q = new THREE.Quaternion();
const s = new THREE.Vector3();

export type Piece = {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
  /** Where the piece starts its flight, in the same space as `position`. */
  from: THREE.Vector3;
  fromQuaternion: THREE.Quaternion;
  /** Timeline start and duration, both in 0..1 of the parent progress. */
  start: number;
  duration: number;
  color?: THREE.Color;
};

/**
 * Many copies of one geometry, each flying from `from` to its resting place as
 * `progress` passes through its window. Runs entirely in the render loop.
 */
export function FlyingInstances({
  geometry,
  material,
  pieces,
  progress,
  castShadow = true,
}: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  pieces: Piece[];
  progress: RefObject<number>;
  castShadow?: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const last = useRef(-1);

  useLayoutEffect(() => {
    const mesh = ref.current!;
    pieces.forEach((p, i) => p.color && mesh.setColorAt(i, p.color));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [pieces]);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const P = progress.current ?? 0;
    // Nothing moves unless the timeline does; skip re-uploading every matrix.
    if (Math.abs(P - last.current) < 1e-5) return;
    last.current = P;
    for (let i = 0; i < pieces.length; i++) {
      const p = pieces[i];
      const t = clamp01((P - p.start) / p.duration);
      const e = easeOutCubic(t);
      v.lerpVectors(p.from, p.position, e);
      // A little landing bounce on the vertical axis only.
      v.y = p.from.y + (p.position.y - p.from.y) * easeOutBack(t, 1.1);
      q.slerpQuaternions(p.fromQuaternion, p.quaternion, e);
      s.copy(p.scale).multiplyScalar(t <= 0 ? 0 : Math.min(1, t * 4));
      m.compose(v, q, s);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, pieces.length]}
      castShadow={castShadow}
      receiveShadow
      frustumCulled={false}
    />
  );
}
