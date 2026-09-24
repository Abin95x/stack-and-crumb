import type { LayerKind } from "@/components/three/Ingredients";

/** The Foreman, bottom to top. */
export const HERO_LAYERS: LayerKind[] = [
  "bunBottom",
  "lettuce",
  "tomato",
  "patty",
  "cheese",
  "patty",
  "cheese",
  "pickles",
  "onion",
  "bunTop",
];

const FIRST = 0.06;
const GAP = 0.072;
const LENGTH = 0.12;

/** [start, length] of a layer's flight inside the hero's 0..1 scroll. */
export const heroLayerWindow = (i: number): [number, number] => [FIRST + i * GAP, LENGTH];

export const HERO_DONE = FIRST + (HERO_LAYERS.length - 1) * GAP + LENGTH;

export const HERO_STEPS = [
  { title: "Potato bun, toasted", body: "Brushed with brown butter and pressed on the flat-top until it crackles." },
  { title: "Butter lettuce", body: "Cold, crisp and ruffled. A cushion, not a garnish." },
  { title: "Heirloom tomato", body: "Cut thick and salted the second before it lands." },
  { title: "Two smashed patties", body: "Chuck, smashed thin for all crust, with aged cheddar melted over each." },
  { title: "Half-sour pickles", body: "Brined here for eighteen hours. Loud crunch, gentle sour." },
  { title: "Shaved red onion", body: "Paper-thin and iced so it snaps." },
  { title: "The crown", body: "Sesame-studded, pillow-soft, toasted where it counts." },
];

/** Which caption belongs to each layer. */
export const LAYER_STEP = [0, 1, 2, 3, 3, 3, 3, 4, 5, 6];

/** Caption index for a scroll progress value; -1 before anything lands. */
export function heroStepAt(p: number) {
  let step = -1;
  HERO_LAYERS.forEach((_, i) => {
    if (p >= heroLayerWindow(i)[0] + LENGTH * 0.3) step = LAYER_STEP[i];
  });
  return step;
}
