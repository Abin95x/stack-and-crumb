import type { LayerKind } from "@/components/three/Ingredients";
import type { RollVariant } from "@/components/three/Roll";

export type Render = { type: "burger"; layers: LayerKind[] } | { type: "roll"; variant: RollVariant };

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  blurb: string;
  tags?: ("veg" | "spicy" | "new" | "fan fave")[];
  image: string;
  /** Items with a render are photographed from the 3D kitchen via /studio. */
  render?: Render;
};

export type MenuCategory = { id: string; label: string; note: string; items: MenuItem[] };

export const MENU: MenuCategory[] = [
  {
    id: "burgers",
    label: "Burgers",
    note: "Smashed to order on a 260°C flat-top. Every burger comes on a toasted potato bun.",
    items: [
      {
        id: "foreman",
        name: "The Foreman",
        price: 449,
        blurb: "Two smashed chuck patties, aged cheddar, half-sours, shaved red onion, butter lettuce, tomato, Crumb sauce.",
        tags: ["fan fave"],
        image: "/menu/foreman.webp",
        render: {
          type: "burger",
          layers: ["bunBottom", "lettuce", "tomato", "patty", "cheese", "patty", "cheese", "pickles", "onion", "bunTop"],
        },
      },
      {
        id: "sunny-side",
        name: "Sunny Side",
        price: 469,
        blurb: "One patty, cheddar, crisp maple bacon and a jammy fried egg. Brunch, but make it lunch.",
        tags: ["new"],
        image: "/menu/sunny-side.webp",
        render: { type: "burger", layers: ["bunBottom", "lettuce", "patty", "cheese", "bacon", "egg", "bunTop"] },
      },
      {
        id: "garden-variety",
        name: "Garden Variety",
        price: 379,
        blurb: "Beet & black bean patty, smoky mayo, pickles, tomato, red onion and a big leaf of lettuce.",
        tags: ["veg"],
        image: "/menu/garden-variety.webp",
        render: { type: "burger", layers: ["bunBottom", "lettuce", "tomato", "vegPatty", "pickles", "onion", "bunTop"] },
      },
      {
        id: "plain-jane",
        name: "The Plain Jane",
        price: 299,
        blurb: "One patty, one slice of cheese, a few pickles. Sometimes simple is the whole point.",
        image: "/menu/plain-jane.webp",
        render: { type: "burger", layers: ["bunBottom", "patty", "cheese", "pickles", "bunTop"] },
      },
      {
        id: "kochi-fire",
        name: "Kochi Fire",
        price: 429,
        blurb: "Smashed patty glazed in kanthari chilli, pepper cheddar, pickled onion, tomato and cooling lettuce.",
        tags: ["spicy"],
        image: "/menu/kochi-fire.webp",
        render: { type: "burger", layers: ["bunBottom", "lettuce", "tomato", "patty", "cheese", "onion", "pickles", "bunTop"] },
      },
      {
        id: "smokehouse",
        name: "Smokehouse",
        price: 489,
        blurb: "Smashed patty, aged cheddar, crisp maple bacon, charred onion and smoky chipotle mayo.",
        tags: ["new"],
        image: "/menu/smokehouse.webp",
        render: { type: "burger", layers: ["bunBottom", "lettuce", "patty", "cheese", "bacon", "onion", "bunTop"] },
      },
    ],
  },
  {
    id: "rolls",
    label: "Long Rolls",
    note: "Our crackly rice-flour roll, split down one side and loaded end to end.",
    items: [
      {
        id: "lemongrass-chicken",
        name: "Lemongrass Chicken",
        price: 349,
        blurb: "Charred lemongrass chicken thigh, chili-lime mayo, quick-pickled carrot & daikon, cucumber, cilantro.",
        tags: ["fan fave"],
        image: "/menu/lemongrass-chicken.webp",
        render: { type: "roll", variant: "chicken" },
      },
      {
        id: "five-spice-pork",
        name: "Five-Spice Pork",
        price: 379,
        blurb: "Sticky five-spice pork shoulder, extra bird's-eye chili, pickles, cucumber and a fistful of herbs.",
        tags: ["spicy"],
        image: "/menu/five-spice-pork.webp",
        render: { type: "roll", variant: "pork" },
      },
      {
        id: "crispy-tofu",
        name: "Crispy Tofu",
        price: 299,
        blurb: "Golden tofu glazed in soy-ginger, sesame mayo, pickled veg, cucumber and cilantro.",
        tags: ["veg"],
        image: "/menu/crispy-tofu.webp",
        render: { type: "roll", variant: "tofu" },
      },
    ],
  },
  {
    id: "sides",
    label: "Sides",
    note: "Built to be shared. Usually aren't.",
    items: [
      {
        id: "crinkle-fries",
        name: "Crinkle Fries",
        price: 149,
        blurb: "Twice-fried, ridged for maximum dip capacity. Seasoned with our smoked salt.",
        image: "/art/fries.svg",
      },
      {
        id: "pickle-plate",
        name: "Pickle Plate",
        price: 99,
        blurb: "A rotating jar of whatever's been brining this week. Ask what's in it.",
        tags: ["veg"],
        image: "/art/pickle-jar.svg",
      },
      {
        id: "sesame-slaw",
        name: "Sesame Slaw",
        price: 129,
        blurb: "Red cabbage, carrot and scallion in a toasted sesame dressing.",
        tags: ["veg"],
        image: "/art/slaw.svg",
      },
    ],
  },
  {
    id: "sips",
    label: "Sips",
    note: "Cold, sweet and a little bit strong.",
    items: [
      {
        id: "iced-coffee",
        name: "Condensed Milk Iced Coffee",
        price: 179,
        blurb: "Dark-roast drip over sweet condensed milk and a mountain of ice.",
        tags: ["fan fave"],
        image: "/art/iced-coffee.svg",
      },
      {
        id: "lemongrass-soda",
        name: "Lemongrass Soda",
        price: 139,
        blurb: "House lemongrass-lime syrup, sparkling water, a slap of mint.",
        image: "/art/lemongrass-soda.svg",
      },
      {
        id: "malt-shake",
        name: "Burnt Honey Malt Shake",
        price: 229,
        blurb: "Vanilla soft-serve blended with malt and honey we cook almost too far.",
        tags: ["new"],
        image: "/art/shake.svg",
      },
    ],
  },
];

export const RENDERABLE = MENU.flatMap((c) => c.items).filter((i) => i.render);

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** Prices are whole rupees, e.g. ₹449 or ₹1,249. */
export const money = (n: number) => inr.format(n);
