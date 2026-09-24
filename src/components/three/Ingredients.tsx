import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  BUN_BOTTOM_H,
  PATTY_H,
  bacon,
  bunBottom,
  bunTop,
  cached,
  cheese,
  pickleChip,
  sauce,
  eggWhite,
  lettuce,
  patty,
  sesameMatrices,
} from "./geometry";
import { withDetail } from "./detail";
import { pickleCap, tomatoCap } from "./textures";

export type LayerKind =
  | "bunBottom"
  | "bunTop"
  | "patty"
  | "vegPatty"
  | "cheese"
  | "lettuce"
  | "tomato"
  | "pickles"
  | "onion"
  | "bacon"
  | "egg";

/** How much vertical room each layer takes in a stack. */
export const LAYER_HEIGHT: Record<LayerKind, number> = {
  bunBottom: BUN_BOTTOM_H,
  lettuce: 0.07,
  tomato: 0.12,
  patty: PATTY_H - 0.02,
  vegPatty: PATTY_H - 0.02,
  cheese: 0.05,
  pickles: 0.05,
  onion: 0.06,
  bacon: 0.08,
  egg: 0.13,
  bunTop: 0.95,
};

export function stackOffsets(kinds: LayerKind[]) {
  let y = 0;
  return kinds.map((k) => {
    const at = y;
    y += LAYER_HEIGHT[k];
    return at;
  });
}

/* Materials are shared across every scene on the page. */
const mats = () =>
  cached("materials", () => ({
    // Egg-washed crust: soft sheen, fine blistering, crumb pores on cut faces.
    bread: withDetail(
      new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        roughness: 0.55,
        clearcoat: 0.35,
        clearcoatRoughness: 0.5,
        sheen: 0.4,
        sheenColor: new THREE.Color("#ffd8a0"),
        sheenRoughness: 0.6,
      }),
      {
        scale: 3.2,
        bump: 0.03,
        tint: ["#ecdcc8", "#fff6ea"],
        rough: [0.45, 0.75],
        pores: { amount: 0.7, scale: 14, depth: 1.2 },
        masked: true,
      },
    ),
    sesame: withDetail(new THREE.MeshPhysicalMaterial({ color: "#f3e3bc", roughness: 0.4, clearcoat: 0.3 }), {
      scale: 25,
      bump: 0.008,
      tint: ["#d9c79a", "#fff8e6"],
    }),
    // Ground beef: craggy, charred, with glints of rendered fat.
    patty: withDetail(
      new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.7, clearcoat: 0.35, clearcoatRoughness: 0.3 }),
      {
        scale: 4.5,
        bump: 0.06,
        tint: ["#9a8a80", "#ffe6d0"],
        rough: [0.35, 0.95],
        char: { color: "#1a0c05", amount: 0.7, threshold: 0.05 },
        pores: { amount: 0.4, scale: 13, depth: 1.4 },
      },
    ),
    cheese: withDetail(
      new THREE.MeshPhysicalMaterial({
        color: "#f4b41f",
        roughness: 0.28,
        clearcoat: 0.7,
        clearcoatRoughness: 0.25,
        sheen: 0.5,
        sheenColor: new THREE.Color("#fff0a0"),
        side: THREE.DoubleSide,
      }),
      { scale: 3, bump: 0.01, tint: ["#ffd060", "#ffffff"], rough: [0.2, 0.4] },
    ),
    lettuce: withDetail(
      new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        roughness: 0.4,
        clearcoat: 0.4,
        clearcoatRoughness: 0.3,
        sheen: 0.6,
        sheenColor: new THREE.Color("#e6ffb0"),
        emissive: new THREE.Color("#2c5210"),
        emissiveIntensity: 0.12,
        side: THREE.DoubleSide,
      }),
      { scale: 2.2, bump: 0.02, tint: ["#c4dca8", "#ffffff"], stretch: [1, 1, 2] },
    ),
    tomatoSide: withDetail(new THREE.MeshPhysicalMaterial({ color: "#d22818", roughness: 0.25, clearcoat: 0.8 }), {
      scale: 4,
      bump: 0.006,
      tint: ["#c46048", "#ffffff"],
    }),
    tomatoCap: withDetail(
      new THREE.MeshPhysicalMaterial({
        map: tomatoCap(),
        roughness: 0.2,
        clearcoat: 1,
        clearcoatRoughness: 0.15,
        emissive: new THREE.Color("#ff3a18"),
        emissiveIntensity: 0.1,
      }),
      { scale: 6, bump: 0.015, rough: [0.1, 0.4] },
    ),
    pickleSide: withDetail(new THREE.MeshPhysicalMaterial({ color: "#3f5a17", roughness: 0.35, clearcoat: 0.6 }), {
      scale: 9,
      bump: 0.04,
      tint: ["#7d8a60", "#ffffff"],
    }),
    pickleCap: withDetail(new THREE.MeshPhysicalMaterial({ map: pickleCap(), roughness: 0.2, clearcoat: 0.9 }), {
      scale: 8,
      bump: 0.012,
    }),
    onion: withDetail(
      new THREE.MeshPhysicalMaterial({
        color: "#f3ecf3",
        roughness: 0.18,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        sheen: 0.6,
        sheenColor: new THREE.Color("#e4b8e0"),
        emissive: new THREE.Color("#3a2238"),
        emissiveIntensity: 0.15,
      }),
      { scale: 4, bump: 0.01, tint: ["#e8d6e7", "#ffffff"], stretch: [1, 3, 1] },
    ),
    sauce: withDetail(
      new THREE.MeshPhysicalMaterial({
        color: "#e98a52",
        roughness: 0.15,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        emissive: new THREE.Color("#6a2208"),
        emissiveIntensity: 0.15,
      }),
      { scale: 3, bump: 0.02, tint: ["#e0a070", "#fff4e8"] },
    ),
    onionSkin: new THREE.MeshPhysicalMaterial({ color: "#8e2f68", roughness: 0.25, clearcoat: 0.8 }),
    bacon: withDetail(
      new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, clearcoat: 0.5, side: THREE.DoubleSide }),
      {
        scale: 4,
        bump: 0.045,
        tint: ["#b89a8a", "#ffffff"],
        char: { color: "#3a1208", amount: 0.55, threshold: 0.15 },
        stretch: [1, 1, 3],
      },
    ),
    eggWhite: withDetail(
      new THREE.MeshPhysicalMaterial({ color: "#fbf8f0", roughness: 0.3, clearcoat: 0.6, side: THREE.DoubleSide }),
      { scale: 2.5, bump: 0.02, char: { color: "#b8834a", amount: 0.5, threshold: 0.35 } },
    ),
    yolk: new THREE.MeshPhysicalMaterial({
      color: "#f39a0a",
      roughness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      emissive: new THREE.Color("#b85a00"),
      emissiveIntensity: 0.15,
    }),
  }));

const tomatoGeo = () => cached("tomatoGeo", () => new THREE.CylinderGeometry(0.78, 0.78, 0.11, 48));
const pickleGeo = pickleChip;
const yolkGeo = () => cached("yolkGeo", () => new THREE.SphereGeometry(0.36, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2));
const seedGeo = () => cached("seedGeo", () => new THREE.SphereGeometry(1, 8, 6));

function Sesame() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const matrices = sesameMatrices();
  useLayoutEffect(() => {
    matrices.forEach((m, i) => ref.current!.setMatrixAt(i, m));
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [matrices]);
  return <instancedMesh ref={ref} args={[seedGeo(), mats().sesame, matrices.length]} castShadow />;
}

function Pickles({ seed = 0 }: { seed?: number }) {
  const m = mats();
  const spots = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2 + seed;
        return { x: Math.cos(a) * 0.62, z: Math.sin(a) * 0.62, rx: Math.sin(a * 3) * 0.08, rz: Math.cos(a * 2) * 0.08, y: i * 0.004 };
      }),
    [seed],
  );
  return (
    <>
      {spots.map((s, i) => (
        <mesh
          key={i}
          geometry={pickleGeo()}
          material={[m.pickleSide, m.pickleCap, m.pickleCap]}
          position={[s.x, 0.025 + s.y, s.z]}
          rotation={[s.rx, 0, s.rz]}
          castShadow
          receiveShadow
        />
      ))}
    </>
  );
}

function Onions() {
  const m = mats();
  const rings: [number, number, number, number][] = [
    [0.62, 0.035, -0.15, 0.1],
    [0.46, 0.03, 0.25, -0.1],
    [0.3, 0.028, -0.1, -0.35],
  ];
  return (
    <>
      {rings.map(([r, t, x, z], i) => (
        <group key={i} position={[x, 0.03 + i * 0.012, z]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh material={m.onion} castShadow>
            <torusGeometry args={[r, t, 10, 64]} />
          </mesh>
          <mesh material={m.onionSkin}>
            <torusGeometry args={[r + t * 0.9, t * 0.35, 6, 64]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** A single burger layer with its base sitting on y = 0. */
export function Ingredient({ kind }: { kind: LayerKind }) {
  const m = mats();
  switch (kind) {
    case "bunBottom":
      return (
        <group>
          <mesh geometry={bunBottom()} material={m.bread} castShadow receiveShadow />
          <mesh geometry={sauce()} material={m.sauce} position-y={BUN_BOTTOM_H + 0.008} rotation-y={0.7} castShadow />
        </group>
      );
    case "bunTop":
      return (
        <group>
          <mesh geometry={bunTop()} material={m.bread} castShadow receiveShadow />
          <Sesame />
        </group>
      );
    case "patty":
    case "vegPatty":
      return (
        <mesh
          geometry={patty(kind === "patty" ? "beef" : "veg")}
          material={m.patty}
          position-y={-0.01}
          castShadow
          receiveShadow
        />
      );
    case "cheese":
      return (
        <group position-y={0.035} rotation-y={0.5}>
          <mesh geometry={cheese()} material={m.cheese} castShadow receiveShadow />
        </group>
      );
    case "lettuce":
      return (
        <group position-y={0.05}>
          <mesh geometry={lettuce()} material={m.lettuce} castShadow receiveShadow />
          <mesh
            geometry={lettuce()}
            material={m.lettuce}
            position={[0.08, 0.025, -0.05]}
            rotation={[0.04, 2.1, -0.03]}
            scale={[0.88, 0.9, 0.82]}
            castShadow
            receiveShadow
          />
        </group>
      );
    case "tomato":
      return (
        <>
          {[
            [-0.38, 0.055, 0.12, 0.04],
            [0.42, 0.065, -0.1, -0.05],
          ].map(([x, y, z, r], i) => (
            <mesh
              key={i}
              geometry={tomatoGeo()}
              material={[m.tomatoSide, m.tomatoCap, m.tomatoCap]}
              position={[x, y, z]}
              rotation={[r, i * 1.3, -r]}
              castShadow
              receiveShadow
            />
          ))}
        </>
      );
    case "pickles":
      return <Pickles />;
    case "onion":
      return <Onions />;
    case "bacon":
      return (
        <>
          <mesh geometry={bacon()} material={m.bacon} position={[0, 0.05, -0.2]} rotation-y={0.25} castShadow receiveShadow />
          <mesh geometry={bacon()} material={m.bacon} position={[0, 0.07, 0.22]} rotation-y={-0.2} castShadow receiveShadow />
        </>
      );
    case "egg":
      return (
        <group>
          <mesh geometry={eggWhite()} material={m.eggWhite} castShadow receiveShadow />
          <mesh geometry={yolkGeo()} material={m.yolk} position={[0.15, 0.03, -0.05]} scale={[1, 0.6, 1]} castShadow />
        </group>
      );
  }
}

/** A fully assembled, static burger — used for studio renders. */
export function StaticBurger({ layers }: { layers: LayerKind[] }) {
  const offsets = stackOffsets(layers);
  return (
    <group>
      {layers.map((k, i) => (
        <group key={i} position-y={offsets[i]}>
          <Ingredient kind={k} />
        </group>
      ))}
    </group>
  );
}
