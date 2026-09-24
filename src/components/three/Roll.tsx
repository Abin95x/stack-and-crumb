import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { easeInOutCubic, lerp, segment } from "@/lib/anim";
import { ROLL_TIMELINE } from "@/lib/roll";
import { FlyingInstances, type Piece } from "./FlyingInstances";
import { withDetail } from "./detail";
import { ROLL_L, ROLL_R, cached, cilantroSprig, cucumberSpear, drizzle, meatSlice, rng, rollFace, rollRadius, rollShell } from "./geometry";
import { rollBottomCrust, rollTopCrust } from "./textures";

export type RollVariant = "chicken" | "pork" | "tofu";


const HINGE_Z = -ROLL_R * 0.9;
const REST_Y = 0.3;

const mats = () =>
  cached("rollMaterials", () => ({
    topCrust: withDetail(
      new THREE.MeshPhysicalMaterial({ map: rollTopCrust(), roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.5, sheen: 0.3, sheenColor: new THREE.Color("#ffd49a") }),
      { scale: 4, bump: 0.035, tint: ["#dcc8b0", "#fff5e8"], rough: [0.35, 0.7], char: { color: "#6b2f0e", amount: 0.25, threshold: 0.3 } },
    ),
    bottomCrust: withDetail(new THREE.MeshPhysicalMaterial({ map: rollBottomCrust(), roughness: 0.65 }), {
      scale: 4,
      bump: 0.03,
      tint: ["#dcc8b0", "#fff5e8"],
    }),
    crumb: withDetail(
      new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.9, sheen: 0.4, sheenColor: new THREE.Color("#fff0cc"), emissive: new THREE.Color("#e6c893"), emissiveIntensity: 0.12 }),
      { scale: 3, bump: 0.03, tint: ["#ebdcbf", "#ffffff"], pores: { amount: 0.5, scale: 11, depth: 1.4 }, masked: true },
    ),
    mayo: withDetail(new THREE.MeshPhysicalMaterial({ color: "#f2b271", roughness: 0.2, clearcoat: 0.8, transparent: true, opacity: 0.92 }), {
      scale: 5,
      bump: 0.03,
      tint: ["#e89a58", "#fff0d8"],
    }),
    cucumber: withDetail(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.25, clearcoat: 0.8 }), {
      scale: 5,
      bump: 0.012,
      tint: ["#d0dcb8", "#ffffff"],
      stretch: [0.3, 1, 1],
    }),
    meat: withDetail(
      new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.45, clearcoat: 0.8, clearcoatRoughness: 0.3 }),
      {
        scale: 3.5,
        bump: 0.045,
        tint: ["#a08070", "#fff0e0"],
        rough: [0.3, 0.7],
        char: { color: "#1e0c04", amount: 0.85, threshold: 0.0 },
        pores: { amount: 0.25, scale: 14 },
        stretch: [0.35, 1, 2.6],
      },
    ),
    tofu: withDetail(new THREE.MeshPhysicalMaterial({ color: "#e0a24c", roughness: 0.5, clearcoat: 0.6 }), {
      scale: 4,
      bump: 0.035,
      tint: ["#c77f30", "#ffe2a8"],
      char: { color: "#7a3d10", amount: 0.5, threshold: 0.2 },
      pores: { amount: 0.35, scale: 18 },
    }),
    stick: withDetail(new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.2 }), {
      scale: 8,
      bump: 0.015,
      tint: ["#e6ddd0", "#ffffff"],
      stretch: [0.2, 1, 1],
    }),
    drizzle: new THREE.MeshPhysicalMaterial({ color: "#d8321a", roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08, emissive: new THREE.Color("#5a0a00"), emissiveIntensity: 0.25 }),
    chili: new THREE.MeshPhysicalMaterial({ color: "#cf1f16", roughness: 0.15, clearcoat: 1, emissive: new THREE.Color("#5a0600"), emissiveIntensity: 0.3 }),
    herb: withDetail(
      new THREE.MeshPhysicalMaterial({ color: "#3a8a28", roughness: 0.45, sheen: 0.6, sheenColor: new THREE.Color("#c8f0a0"), emissive: new THREE.Color("#12380a"), emissiveIntensity: 0.25, side: THREE.DoubleSide }),
      { scale: 6, bump: 0.015, tint: ["#b0cc98", "#ffffff"] },
    ),
  }));

const geos = () =>
  cached("rollGeos", () => ({
    cucumber: cucumberSpear(),
    stick: new THREE.BoxGeometry(0.6, 0.03, 0.03, 8, 1, 1),
    chili: new THREE.TorusGeometry(0.065, 0.022, 10, 24).rotateX(Math.PI / 2),
    tofu: new THREE.BoxGeometry(0.26, 0.18, 0.26),
    mayo: rollFace(0.86, true),
    drizzle: drizzle(),
  }));

const Q = (x: number, y: number, z: number) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
const one = new THREE.Vector3(1, 1, 1);

function randomQ(r: () => number, amount = Math.PI) {
  return Q((r() - 0.5) * amount * 2, (r() - 0.5) * amount * 2, (r() - 0.5) * amount * 2);
}

function spread(
  count: number,
  seed: number,
  window: readonly [number, number],
  place: (i: number, r: () => number) => { p: THREE.Vector3; q: THREE.Quaternion; s?: THREE.Vector3; color?: THREE.Color },
): Piece[] {
  const r = rng(seed);
  const [start, length] = window;
  const duration = Math.min(length, 0.06);
  return Array.from({ length: count }, (_, i) => {
    const { p, q, s, color } = place(i, r);
    return {
      position: p,
      quaternion: q,
      scale: s ?? one,
      from: p.clone().add(new THREE.Vector3((r() - 0.5) * 2.4, 3.2 + r() * 1.8, (r() - 0.5) * 2)),
      fromQuaternion: randomQ(r),
      start: start + (count === 1 ? 0 : (i / (count - 1)) * (length - duration)),
      duration,
      color,
    };
  });
}

/** Random x along the roll and a z that stays inside its width at that point. */
function inside(r: () => number, span = 0.78, width = 0.62) {
  const s = (r() * 2 - 1) * span;
  const x = (s * ROLL_L) / 2;
  const z = (r() * 2 - 1) * rollRadius(s) * width;
  return { x, z };
}

function useFillings(variant: RollVariant) {
  return useMemo(() => {
    const T = ROLL_TIMELINE;
    const mayo = spread(1, 1, T.mayo, () => ({ p: new THREE.Vector3(0, 0.012, 0), q: new THREE.Quaternion() }));
    const cucumber = spread(3, 2, T.cucumber, (i) => ({
      p: new THREE.Vector3(0, 0.08, (i - 1) * 0.2),
      q: Q(0, (i - 1) * 0.03, 0),
    }));

    const meatCount = variant === "tofu" ? 14 : 8;
    const meatTint = variant === "pork" ? new THREE.Color(0.95, 0.62, 0.55) : new THREE.Color(1, 1, 1);
    const meat = spread(meatCount, 3, T.meat, (i, r) => {
      if (variant === "tofu") {
        const row = i % 2;
        const x = -1.5 + Math.floor(i / 2) * 0.5 + row * 0.2;
        return {
          p: new THREE.Vector3(x, 0.19, row ? 0.14 : -0.14),
          q: Q(0, r() * 0.6, 0),
        };
      }
      const x = -1.55 + (i / (meatCount - 1)) * 3.1;
      return {
        p: new THREE.Vector3(x, 0.16, (r() - 0.5) * 0.08),
        q: Q((r() - 0.5) * 0.15, (r() - 0.5) * 0.4, -0.38),
        color: meatTint.clone().offsetHSL(0, 0, (r() - 0.5) * 0.06),
      };
    });

    const carrot = new THREE.Color("#f07a1e");
    const daikon = new THREE.Color("#f6f0dc");
    const pickles = spread(130, 4, T.pickles, (i, r) => {
      const { x, z } = inside(r, 0.8, 0.7);
      return {
        p: new THREE.Vector3(x, 0.25 + r() * 0.1, z),
        q: Q((r() - 0.5) * 0.3, (r() - 0.5) * 0.9, (r() - 0.5) * 0.3),
        s: new THREE.Vector3(0.8 + r() * 0.5, 1, 1),
        color: i % 5 < 3 ? carrot.clone().offsetHSL(0, 0, (r() - 0.5) * 0.08) : daikon,
      };
    });

    const chiliCount = variant === "pork" ? 16 : 10;
    const chili = spread(chiliCount, 5, T.chili, (_, r) => {
      const { x, z } = inside(r, 0.75, 0.6);
      return { p: new THREE.Vector3(x, 0.36 + r() * 0.04, z), q: Q((r() - 0.5) * 0.7, 0, (r() - 0.5) * 0.7) };
    });

    const cilantro = spread(13, 6, T.cilantro, (i, r) => {
      const x = -1.6 + (i / 12) * 3.2 + (r() - 0.5) * 0.15;
      const side = i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : -1;
      return {
        p: new THREE.Vector3(x, 0.22, side * 0.25),
        q: Q(side * (0.9 + r() * 0.4) + (side === 0 ? (r() - 0.5) * 0.6 : 0), r() * Math.PI, (r() - 0.5) * 0.6),
        s: new THREE.Vector3().setScalar(1 + r() * 0.5),
      };
    });

    const sauceLine = spread(1, 7, T.drizzle, () => ({ p: new THREE.Vector3(0, 0.38, 0), q: new THREE.Quaternion() }));

    return { mayo, cucumber, meat, pickles, chili, cilantro, sauceLine };
  }, [variant]);
}

/** The long roll: a hinged baguette that opens, fills and closes as `progress` runs 0 → 1. */
export function Roll({
  progress,
  variant = "chicken",
  restAngle = 0.26,
}: {
  progress: RefObject<number>;
  variant?: RollVariant;
  /** How far the lid stays open once the roll is closed. */
  restAngle?: number;
}) {
  const m = mats();
  const g = geos();
  const fill = useFillings(variant);
  const hinge = useRef<THREE.Group>(null);

  useFrame(() => {
    const P = progress.current ?? 0;
    const open = easeInOutCubic(segment(P, ...ROLL_TIMELINE.open));
    const close = easeInOutCubic(segment(P, ...ROLL_TIMELINE.close));
    const angle = lerp(lerp(0, 1.85, open), restAngle, close);
    const h = hinge.current!;
    h.rotation.x = -angle;
    h.position.y = REST_Y * open;
  });

  return (
    <group>
      {/* Bottom half, cut face up */}
      <group scale={[1, 0.72, 1]}>
        <mesh geometry={rollShell("bottom")} material={m.bottomCrust} castShadow receiveShadow />
      </group>
      <mesh geometry={rollFace(0.985, true)} material={m.crumb} position-y={0.002} receiveShadow />

      {/* Fillings */}
      <FlyingInstances geometry={g.mayo} material={m.mayo} pieces={fill.mayo} progress={progress} castShadow={false} />
      <FlyingInstances geometry={g.cucumber} material={m.cucumber} pieces={fill.cucumber} progress={progress} />
      <FlyingInstances
        geometry={variant === "tofu" ? g.tofu : meatSlice(1)}
        material={variant === "tofu" ? m.tofu : m.meat}
        pieces={fill.meat}
        progress={progress}
      />
      <FlyingInstances geometry={g.stick} material={m.stick} pieces={fill.pickles} progress={progress} />
      <FlyingInstances geometry={g.chili} material={m.chili} pieces={fill.chili} progress={progress} />
      <FlyingInstances geometry={cilantroSprig()} material={m.herb} pieces={fill.cilantro} progress={progress} />
      <FlyingInstances geometry={g.drizzle} material={m.drizzle} pieces={fill.sauceLine} progress={progress} />

      {/* Top half, hinged along the back edge */}
      <group ref={hinge} position={[0, 0, HINGE_Z]}>
        <group position={[0, 0, -HINGE_Z]}>
          <group scale={[1, 0.92, 1]}>
            <mesh geometry={rollShell("top")} material={m.topCrust} castShadow receiveShadow />
          </group>
          <mesh geometry={rollFace(0.985, false)} material={m.crumb} position-y={-0.002} />
        </group>
      </group>
    </group>
  );
}
