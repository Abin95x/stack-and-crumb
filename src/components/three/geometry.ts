import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/* ------------------------------------------------------------------ */
/* Utilities                                                           */
/* ------------------------------------------------------------------ */

const cache = new Map<string, unknown>();

/** Build once per page; geometry & textures are shared across every scene. */
export function cached<T>(key: string, make: () => T): T {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key) as T;
}

/** Deterministic PRNG so every burger looks the same on every visit. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cheap smooth pseudo-noise in roughly [-1, 1]. Good enough for food. */
export function noise3(x: number, y: number, z: number) {
  return (
    (Math.sin(x * 1.7 + y * 3.1) * Math.cos(z * 2.3 - x * 0.7) +
      Math.sin(x * 4.3 - z * 3.7 + y * 1.3) * 0.5 +
      Math.sin(z * 7.9 + x * 6.1 - y * 2.2) * 0.25) /
    1.75
  );
}

type Stop = [number, string];

function ramp(stops: Stop[], t: number, out = new THREE.Color()) {
  if (t <= stops[0][0]) return out.set(stops[0][1]);
  for (let i = 1; i < stops.length; i++) {
    const [t1, c1] = stops[i];
    if (t <= t1) {
      const [t0, c0] = stops[i - 1];
      return out.set(c0).lerp(new THREE.Color(c1), (t - t0) / (t1 - t0));
    }
  }
  return out.set(stops[stops.length - 1][1]);
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

type LatheOpts = {
  segments?: number;
  displace?: (v: THREE.Vector3) => void;
  tint?: (v: THREE.Vector3, c: THREE.Color) => void;
};

/**
 * Revolve a profile into a closed, vertex-coloured solid with welded seams so
 * noise displacement doesn't tear it open.
 */
type ProfilePoint = [x: number, y: number, color: string, crumb?: number];

function coloredLathe(profile: ProfilePoint[], opts: LatheOpts = {}) {
  const points = profile.map(([x, y]) => new THREE.Vector2(x, y));
  const colors = profile.map(([, , c]) => new THREE.Color(c));
  const g = new THREE.LatheGeometry(points, opts.segments ?? 72);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  const mask = new Float32Array(pos.count);
  const v = new THREE.Vector3();
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    c.copy(colors[i % points.length]);
    opts.tint?.(v, c);
    opts.displace?.(v);
    pos.setXYZ(i, v.x, v.y, v.z);
    col.set([c.r, c.g, c.b], i * 3);
    mask[i] = profile[i % points.length][3] ?? 0;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.setAttribute("detailMask", new THREE.BufferAttribute(mask, 1));
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  const welded = mergeVertices(g, 1e-4);
  welded.computeVertexNormals();
  return welded;
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number, steps: number, color: string) {
  const out: ProfilePoint[] = [];
  for (let i = 1; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, color]);
  }
  return out;
}

/** Evenly spaced points along a flat face so noise has rings to work with. */
function rings(from: number, to: number, y: number, steps: number, color: string): ProfilePoint[] {
  return Array.from({ length: steps + 1 }, (_, i) => [from + ((to - from) * i) / steps, y, color] as ProfilePoint);
}

/* ------------------------------------------------------------------ */
/* Burger parts                                                        */
/* ------------------------------------------------------------------ */

export const BUN_R = 1.25;
export const BUN_TOP_H = 0.95;

export const bunTop = () =>
  cached("bunTop", () => {
    const R = BUN_R;
    const H = BUN_TOP_H;
    const profile: ProfilePoint[] = [
      ...rings(0, R * 0.86, 0, 10, "#e8c78c").map(([x, y, c]) => [x, y, c, 1] as ProfilePoint),
      [R * 0.9, 0, "#d9a55e", 0.4],
      [R * 0.95, 0.012, "#c98d45"],
      [R * 0.985, 0.04, "#e2b271"],
    ];
    const N = 34;
    const c = new THREE.Color();
    for (let k = 0; k <= N; k++) {
      const a = (k / N) * (Math.PI / 2);
      const x = k === N ? 0 : R * Math.cos(a);
      const y = 0.07 + (H - 0.07) * Math.pow(Math.sin(a), 0.8);
      ramp(
        [
          [0, "#ecc98a"],
          [0.1, "#dca45a"],
          [0.3, "#b86a26"],
          [0.65, "#9c4e17"],
          [1, "#8a4313"],
        ],
        k / N,
        c,
      );
      profile.push([x, y, `#${c.getHexString()}`]);
    }
    return coloredLathe(profile, {
      segments: 96,
      displace: (v) => {
        if (v.y > 0.1) {
          v.y += noise3(v.x * 2, v.y, v.z * 2) * 0.03;
          const k = 1 + noise3(v.x * 1.3, 0, v.z * 1.3) * 0.02;
          v.x *= k;
          v.z *= k;
        }
      },
      tint: (v, col) => {
        if (v.y > 0.12) col.offsetHSL(0, 0, noise3(v.x * 5, v.y * 5, v.z * 5) * 0.04);
      },
    });
  });

/** Transforms for sesame seeds sitting on the bun dome. */
export const sesameMatrices = (count = 120, seed = 3) =>
  cached(`sesame:${count}:${seed}`, () => {
    const R = BUN_R;
    const H = BUN_TOP_H;
    const r = rng(seed);
    const up = new THREE.Vector3(0, 1, 0);
    const out: THREE.Matrix4[] = [];
    for (let i = 0; i < count; i++) {
      const a = 0.35 + r() * 1.15;
      const phi = r() * Math.PI * 2;
      const x = R * Math.cos(a);
      const y = 0.07 + (H - 0.07) * Math.pow(Math.sin(a), 0.8);
      const dy = (H - 0.07) * 0.8 * Math.pow(Math.sin(a), -0.2) * Math.cos(a);
      const n2 = new THREE.Vector2(dy, R * Math.sin(a)).normalize();
      const normal = new THREE.Vector3(n2.x * Math.sin(phi), n2.y, n2.x * Math.cos(phi)).normalize();
      const pos = new THREE.Vector3(x * Math.sin(phi), y, x * Math.cos(phi)).addScaledVector(normal, 0.012);
      const q = new THREE.Quaternion()
        .setFromUnitVectors(up, normal)
        .multiply(new THREE.Quaternion().setFromAxisAngle(up, r() * Math.PI));
      const k = 0.8 + r() * 0.4;
      out.push(new THREE.Matrix4().compose(pos, q, new THREE.Vector3(0.05 * k, 0.017 * k, 0.026 * k)));
    }
    return out;
  });

export const BUN_BOTTOM_H = 0.42;

export const bunBottom = () =>
  cached("bunBottom", () => {
    const R = BUN_R;
    const h = BUN_BOTTOM_H;
    return coloredLathe(
      [
        ...rings(0, R * 0.9, 0, 6, "#b9793a"),
        [R * 0.97, 0.03, "#c98a45"],
        [R, 0.1, "#d69a52"],
        [R * 1.005, h - 0.1, "#e2ad66"],
        [R * 0.99, h - 0.03, "#dcaa68"],
        [R * 0.955, h, "#c98f4f", 0.5],
        ...rings(R * 0.9, 0, h + 0.005, 10, "#e6c083").map((p, i) => {
          // Toasted: darker, drier ring near the edge of the cut face.
          const t = i / 10;
          const col = new THREE.Color("#c99555").lerp(new THREE.Color("#ecd09a"), Math.min(1, t * 2.2));
          return [p[0], p[1], `#${col.getHexString()}`, 1] as ProfilePoint;
        }),
      ],
      {
        segments: 96,
        displace: (v) => {
          v.y += noise3(v.x * 3, 1, v.z * 3) * 0.015;
        },
      },
    );
  });

function pattyProfile(R: number, h: number, b: number, color: string): ProfilePoint[] {
  // Domed in the middle, thinner at the smashed edge.
  const edge = h * 0.72;
  const top = Array.from({ length: 17 }, (_, i) => {
    const x = (R - b) * (1 - i / 16);
    const t = x / (R - b);
    return [x, edge + (h - edge) * (1 - t * t), color] as ProfilePoint;
  });
  return [
    ...rings(0, R - b, 0, 14, color),
    ...arc(R - b, b, b, -Math.PI / 2, 0, 4, color),
    [R, edge - b, color],
    ...arc(R - b, edge - b, b, 0, Math.PI / 2, 4, color).map(([x, y]) => [x, y, color] as ProfilePoint),
    ...top.slice(1),
  ];
}

export const PATTY_H = 0.3;

export const patty = (variant: "beef" | "veg" = "beef") =>
  cached(`patty:${variant}`, () => {
    const beef = variant === "beef";
    const light = new THREE.Color(beef ? "#7a4526" : "#7c2f3a");
    const dark = new THREE.Color(beef ? "#2e170a" : "#3a1820");
    const seared = new THREE.Color(beef ? "#3d200e" : "#4d1e28");
    return coloredLathe(pattyProfile(1.3, PATTY_H, 0.08, "#000"), {
      segments: 160,
      tint: (v, c) => {
        const n = noise3(v.x * 4.1, v.y * 6, v.z * 4.1) * 0.6 + noise3(v.x * 13, v.y * 13, v.z * 13) * 0.4;
        c.copy(light).lerp(dark, smooth(-0.2, 0.8, n));
        const face = smooth(0.1, 0.02, Math.min(v.y, PATTY_H * 0.9 - v.y));
        c.lerp(seared, face * 0.5);
      },
      displace: (v) => {
        // Irregular, craggy smash-burger edge.
        const a = Math.atan2(v.z, v.x);
        const rr = Math.hypot(v.x, v.z);
        const edge = smooth(0.7, 1.3, rr);
        const k =
          1 +
          noise3(v.x * 2.2, v.y * 3, v.z * 2.2) * 0.05 +
          (Math.sin(a * 13 + noise3(v.x * 3, 0, v.z * 3) * 4) * 0.02 + noise3(v.x * 9, v.y * 9, v.z * 9) * 0.035) * edge;
        v.x *= k;
        v.z *= k;
        v.y += noise3(v.x * 5, v.y * 2, v.z * 5) * 0.018 + noise3(v.x * 14, 0, v.z * 14) * 0.008;
      },
    });
  });

export const cheese = () =>
  cached("cheese", () => {
    const g = new THREE.PlaneGeometry(2.4, 2.4, 72, 72).rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const d = Math.hypot(x, z);
      // Melted: past the patty's shoulder the slice slumps down and hugs the side.
      const start = 1.12 + noise3(x * 2, 0, z * 2) * 0.06;
      const droop = Math.max(0, d - start);
      const r = d > start ? (start + droop * 0.45) / d : 1;
      const y = -0.3 * (1 - Math.exp(-droop * 6)) - droop * 0.08 + noise3(x * 4, 0, z * 4) * 0.008;
      pos.setXYZ(i, x * r, y, z * r);
    }
    g.computeVertexNormals();
    return g;
  });

export const lettuce = () =>
  cached("lettuce", () => {
    const R = 1.5;
    const g = new THREE.RingGeometry(0.02, R, 360, 20).rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const col = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const r = Math.hypot(x, z);
      const th = Math.atan2(z, x);
      const t = r / R;
      const s = 1 + 0.08 * Math.sin(th * 5 + 1) + 0.045 * Math.sin(th * 13);
      const y =
        t * t * (0.1 * Math.sin(th * 11 + r * 2) + 0.045 * Math.sin(th * 29) + 0.018 * Math.sin(th * 71 + r * 9)) -
        t * t * 0.08 +
        noise3(x * 6, 0, z * 6) * 0.015 * t;
      pos.setXYZ(i, x * s, y, z * s);
      ramp(
        [
          [0, "#d7eaa0"],
          [0.55, "#9cc956"],
          [1, "#4f8f2a"],
        ],
        t,
        c,
      );
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  });

export const bacon = () =>
  cached("bacon", () => {
    const W = 0.4;
    const g = new THREE.PlaneGeometry(2.3, W, 80, 16).rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const col = new Float32Array(pos.count * 3);
    const meat = new THREE.Color("#9c2f22");
    const fat = new THREE.Color("#f0c7a0");
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, Math.sin(x * 4.2) * 0.06 + Math.sin(x * 11 + z * 4) * 0.012);
      const w = z / W + 0.5 + Math.sin(x * 3) * 0.05;
      const stripe = Math.max(smooth(0.18, 0.24, w) * smooth(0.38, 0.32, w), smooth(0.64, 0.7, w) * smooth(0.84, 0.78, w));
      c.copy(meat).lerp(fat, stripe).offsetHSL(0, 0, noise3(x * 6, 0, z * 20) * 0.04);
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  });

export const eggWhite = () =>
  cached("eggWhite", () => {
    const R = 1.05;
    const g = new THREE.RingGeometry(0.001, R, 96, 10).rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const th = Math.atan2(z, x);
      const t = Math.hypot(x, z) / R;
      const s = 1 + 0.1 * Math.sin(th * 3 + 0.5) + 0.05 * Math.sin(th * 7);
      pos.setXYZ(i, x * s, 0.07 * (1 - t * t) + 0.01, z * s);
    }
    g.computeVertexNormals();
    return g;
  });

/* ------------------------------------------------------------------ */
/* Long roll parts                                                     */
/* ------------------------------------------------------------------ */

export const ROLL_L = 4.4;
export const ROLL_R = 0.62;

/** Radius of the roll at normalised length s in [-1, 1]. */
export const rollRadius = (s: number) => ROLL_R * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(s), 5)), 0.5);

/** Half a roll shell. Length runs along world X; the cut face sits at y = 0. */
export const rollShell = (half: "top" | "bottom") =>
  cached(`rollShell:${half}`, () => {
    const pts: THREE.Vector2[] = [];
    const N = 80;
    for (let i = 0; i <= N; i++) {
      const s = -1 + (2 * i) / N;
      const r = rollRadius(s) * (1 + 0.035 * Math.sin(s * 19) * (1 - Math.abs(s)));
      pts.push(new THREE.Vector2(r, (s * ROLL_L) / 2));
    }
    const g = new THREE.LatheGeometry(pts, 48, half === "top" ? 0 : Math.PI, Math.PI);
    g.rotateZ(Math.PI / 2);
    return g;
  });

/**
 * The exposed crumb face of a half roll: a subdivided, slightly domed and
 * lumpy surface with a toasted crust ring around the edge.
 */
export const rollFace = (inset = 0.97, faceUp = true) =>
  cached(`rollFace:${inset}:${faceUp}`, () => {
    const g = new THREE.PlaneGeometry(2, 2, 140, 28).rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const col = new Float32Array(pos.count * 3);
    const mask = new Float32Array(pos.count);
    const crumb = new THREE.Color("#f1dcae");
    const crust = new THREE.Color("#b3702f");
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const s = pos.getX(i);
      const v = pos.getZ(i);
      const w = rollRadius(s) * inset;
      const x = ((s * ROLL_L) / 2) * inset;
      const z = v * w;
      const edge = Math.max(Math.abs(v), Math.pow(Math.abs(s), 6));
      const y = (1 - v * v) * 0.035 * (1 - Math.pow(Math.abs(s), 4)) + noise3(x * 4, 0, z * 4) * 0.012;
      pos.setXYZ(i, x, y, z);
      const ring = smooth(0.86, 0.98, edge);
      c.copy(crumb).offsetHSL(0, 0, noise3(x * 3, 1, z * 3) * 0.03).lerp(crust, ring);
      col.set([c.r, c.g, c.b], i * 3);
      mask[i] = 1 - ring;
    }
    if (!faceUp) g.rotateX(Math.PI);
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setAttribute("detailMask", new THREE.BufferAttribute(mask, 1));
    g.computeVertexNormals();
    return g;
  });

/** A long wedge of cucumber: dark skin on the curved side, pale flesh and seeds inside. */
export const cucumberSpear = () =>
  cached("cucumber", () => {
    const R = 0.14;
    const inner = 0.1;
    const a = Math.PI / 3;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(Math.cos(-a / 2 - Math.PI / 2) * inner, Math.sin(-a / 2 - Math.PI / 2) * inner);
    shape.lineTo(Math.cos(-a / 2 - Math.PI / 2) * R, Math.sin(-a / 2 - Math.PI / 2) * R);
    shape.absarc(0, 0, R, -a / 2 - Math.PI / 2, a / 2 - Math.PI / 2, false);
    shape.lineTo(Math.cos(a / 2 - Math.PI / 2) * inner, Math.sin(a / 2 - Math.PI / 2) * inner);
    shape.lineTo(0, 0);
    const g = new THREE.ExtrudeGeometry(shape, { depth: 3, bevelEnabled: false, curveSegments: 10, steps: 30 });
    g.translate(0, 0, -1.5);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const col = new Float32Array(pos.count * 3);
    const skin = new THREE.Color("#2d4f16");
    const flesh = new THREE.Color("#c6dc93");
    const seeds = new THREE.Color("#e6efc4");
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const d = Math.hypot(x, y);
      c.copy(d > inner + 0.012 ? skin : flesh);
      if (d < 0.05) c.copy(seeds);
      col.set([c.r, c.g, c.b], i * 3);
      // Taper the ends and add a gentle bend.
      const t = Math.abs(z) / 1.5;
      const k = 1 - Math.pow(t, 8) * 0.6;
      pos.setXYZ(i, x * k, y * k + Math.sin(z * 0.8) * 0.02, z);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    // Flat side up, length along X.
    g.rotateX(Math.PI).rotateY(Math.PI / 2);
    return g;
  });

/** A glazed, grilled slab of thigh meat: squarish, uneven and a bit curled. */
export const meatSlice = (seed = 1) =>
  cached(`meat:${seed}`, () => {
    const g = new THREE.SphereGeometry(1, 40, 20);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const col = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    const inside = new THREE.Color("#c98a4e");
    const glaze = new THREE.Color("#9a4f1c");
    const sq = (n: number) => Math.sign(n) * Math.pow(Math.abs(n), 0.55);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const n = noise3(x * 2.5 + seed, y * 2, z * 2.5);
      const k = 1 + n * 0.12;
      const px = sq(x) * 0.36 * k;
      const pz = sq(z) * 0.26 * k;
      const py = y * 0.06 * (1 + noise3(x * 4, 0, z * 4) * 0.35) + (px * px) * 0.35;
      pos.setXYZ(i, px, py, pz);
      c.copy(inside).lerp(glaze, smooth(-0.02, 0.04, Math.abs(y * 0.06)) * 0.9);
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  });

export const cilantroSprig = () =>
  cached("cilantro", () => {
    const leaf = new THREE.Shape();
    // A soft three-lobed leaf.
    leaf.moveTo(0, 0);
    leaf.bezierCurveTo(-0.06, 0.02, -0.11, 0.08, -0.08, 0.13);
    leaf.bezierCurveTo(-0.1, 0.17, -0.05, 0.2, -0.02, 0.18);
    leaf.bezierCurveTo(-0.01, 0.23, 0.04, 0.23, 0.04, 0.18);
    leaf.bezierCurveTo(0.08, 0.19, 0.11, 0.14, 0.08, 0.11);
    leaf.bezierCurveTo(0.11, 0.06, 0.06, 0.01, 0, 0);
    const parts: THREE.BufferGeometry[] = [];
    const stem = new THREE.CylinderGeometry(0.008, 0.012, 0.42, 5).translate(0, 0.21, 0);
    parts.push(stem);
    const spots: [number, number, number, number][] = [
      [0, 0.42, 0, 0],
      [0.02, 0.3, 0.9, 0.6],
      [-0.02, 0.24, -0.9, -0.5],
      [0.01, 0.36, 2.2, -0.3],
    ];
    for (const [x, y, rotY, tilt] of spots) {
      const g = new THREE.ShapeGeometry(leaf, 6);
      g.scale(1.4, 1.4, 1.4);
      g.rotateX(-0.6 + tilt * 0.3);
      g.rotateY(rotY);
      g.translate(x, y, 0);
      parts.push(g);
    }
    return mergeGeometries(parts.map((p) => p.toNonIndexed()));
  });

/* ------------------------------------------------------------------ */
/* Extra detail: sauces, drips, drizzles                               */
/* ------------------------------------------------------------------ */

/** A drip that runs over an edge at radius `r` and hangs down `length`, ending in a bead. */
function drip(angle: number, r: number, length: number, thickness: number) {
  const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
  const at = (radial: number, y: number) => dir.clone().multiplyScalar(radial).setY(y);
  const path = new THREE.CatmullRomCurve3([
    at(r - 0.25, 0.005),
    at(r - 0.02, 0),
    at(r + 0.03, -0.04),
    at(r + 0.035, -length * 0.6),
    at(r + 0.03, -length),
  ]);
  const tube = new THREE.TubeGeometry(path, 24, thickness, 8, false);
  // Taper the neck and swell into a bead at the bottom.
  const pos = tube.attributes.position as THREE.BufferAttribute;
  const center = new THREE.Vector3();
  const v = new THREE.Vector3();
  const rings = 25;
  for (let i = 0; i < pos.count; i++) {
    const ring = Math.floor(i / 9);
    const t = ring / (rings - 1);
    path.getPointAt(Math.min(1, t), center);
    v.fromBufferAttribute(pos, i).sub(center);
    const k = t < 0.3 ? 1.3 - t : 0.75 + 0.5 * Math.pow(t, 3);
    // Flatten against the surface it runs down, spread sideways like a real run of sauce.
    const radial = dir.dot(v);
    v.addScaledVector(dir, -radial * 0.55);
    const tangent = new THREE.Vector3(-dir.z, 0, dir.x);
    v.addScaledVector(tangent, tangent.dot(v) * 0.5);
    v.multiplyScalar(k).add(center);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  const bead = new THREE.SphereGeometry(thickness * 1.3, 12, 8).scale(0.6, 1.2, 1.2).translate(...at(r + 0.03, -length).toArray());
  tube.deleteAttribute("uv");
  bead.deleteAttribute("uv");
  const merged = mergeGeometries([tube.toNonIndexed(), bead.toNonIndexed()]);
  return merged;
}

/** House sauce smeared on the bottom bun, with a few runs over the edge. */
export const sauce = () =>
  cached("sauce", () => {
    const disc = new THREE.CircleGeometry(1.05, 96, 0, Math.PI * 2).rotateX(-Math.PI / 2);
    const pos = disc.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const th = Math.atan2(z, x);
      const k = 1 + 0.12 * Math.sin(th * 5 + 1) + 0.06 * Math.sin(th * 11);
      const d = Math.hypot(x, z) / 1.05;
      pos.setXYZ(i, x * k, 0.012 * (1 - d * d) + noise3(x * 5, 0, z * 5) * 0.004, z * k);
    }
    disc.deleteAttribute("uv");
    const parts = [disc.toNonIndexed()];
    const r = rng(12);
    for (let i = 0; i < 5; i++) {
      parts.push(drip((i / 5) * Math.PI * 2 + r() * 0.6, 1.26, 0.1 + r() * 0.12, 0.045));
    }
    const g = mergeGeometries(parts);
    g.computeVertexNormals();
    return g;
  });

/** Sriracha drizzle looping loosely along the length of the roll. */
export const drizzle = () =>
  cached("drizzle", () => {
    const pts: THREE.Vector3[] = [];
    const N = 90;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const x = -1.6 + t * 3.2 + Math.sin(t * Math.PI * 14) * 0.06;
      const s = x / (ROLL_L / 2);
      const z = Math.sin(t * Math.PI * 7 + Math.sin(t * 9) * 0.6) * rollRadius(s) * 0.45;
      pts.push(new THREE.Vector3(x, noise3(x * 3, 0, z * 3) * 0.03, z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const g = new THREE.TubeGeometry(curve, 500, 0.03, 10, false);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const c = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      // Squash into a flat ribbon and vary the thickness like a hand-squeezed line.
      const t = Math.floor(i / 11) / 500;
      curve.getPointAt(t, c);
      const w = 0.75 + 0.35 * Math.sin(t * 57) * Math.sin(t * 23);
      pos.setXYZ(i, c.x + (pos.getX(i) - c.x) * w, c.y + (pos.getY(i) - c.y) * 0.45 * w, c.z + (pos.getZ(i) - c.z) * w);
    }
    g.computeVertexNormals();
    return g;
  });

/** Crinkle-cut pickle chip. */
export const pickleChip = () =>
  cached("pickleChip", () => {
    const g = new THREE.CylinderGeometry(0.28, 0.28, 0.045, 96, 1);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const r = Math.hypot(x, z);
      if (r < 0.2) continue;
      const th = Math.atan2(z, x);
      const k = 1 + 0.045 * Math.sin(th * 18);
      pos.setX(i, x * k);
      pos.setZ(i, z * k);
      pos.setY(i, pos.getY(i) + Math.sin(th * 18) * 0.006);
    }
    g.computeVertexNormals();
    return g;
  });
