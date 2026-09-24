"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import type { BuiltLayer } from "@/components/three/BuilderScene";
import type { LayerKind } from "@/components/three/Ingredients";
import { money } from "@/lib/menu";

const BuilderScene = dynamic(() => import("@/components/three/BuilderScene"), { ssr: false });

type Option = { kind: LayerKind; label: string; price: number; kcal: number; swatch: string };

const OPTIONS: Option[] = [
  { kind: "patty", label: "Smashed patty", price: 119, kcal: 290, swatch: "#5b3219" },
  { kind: "vegPatty", label: "Beet patty", price: 109, kcal: 210, swatch: "#7c2f3a" },
  { kind: "cheese", label: "Cheddar", price: 39, kcal: 110, swatch: "#f5ae1c" },
  { kind: "bacon", label: "Maple bacon", price: 79, kcal: 90, swatch: "#b8453a" },
  { kind: "egg", label: "Fried egg", price: 49, kcal: 90, swatch: "#fbf3de" },
  { kind: "lettuce", label: "Lettuce", price: 15, kcal: 5, swatch: "#7fb843" },
  { kind: "tomato", label: "Tomato", price: 20, kcal: 10, swatch: "#d8361f" },
  { kind: "pickles", label: "Pickles", price: 15, kcal: 5, swatch: "#6b8a2e" },
  { kind: "onion", label: "Red onion", price: 15, kcal: 10, swatch: "#a2477d" },
];

const BUN = { price: 129, kcal: 220 };
const MAX_LAYERS = 12;
const byKind = Object.fromEntries(OPTIONS.map((o) => [o.kind, o])) as Record<LayerKind, Option>;

function nameFor(layers: BuiltLayer[]) {
  const count = (k: LayerKind) => layers.filter((l) => l.kind === k).length;
  const meat = count("patty");
  if (layers.length === 0) return "Just bread. Bold.";
  if (meat >= 4) return "The Skyscraper";
  if (count("egg") && count("bacon")) return "The Breakfast Club";
  if (count("vegPatty") && !meat && !count("bacon")) return "The Green Room";
  if (meat === 0 && !count("vegPatty")) return "The Salad Situation";
  if (count("cheese") >= 3) return "Cheese Louise";
  if (meat === 3) return "The Triple Threat";
  if (layers.length >= 9) return "The Kitchen Sink";
  if (meat === 2) return "The Double Down";
  return "The House Special";
}

export default function Builder() {
  const [layers, setLayers] = useState<BuiltLayer[]>([
    { id: 1, kind: "lettuce" },
    { id: 2, kind: "patty" },
    { id: 3, kind: "cheese" },
  ]);
  const [closed, setClosed] = useState(false);
  const [added, setAdded] = useState(false);
  const nextId = useRef(10);

  const add = (kind: LayerKind) => {
    if (closed || layers.length >= MAX_LAYERS) return;
    setLayers((l) => [...l, { id: nextId.current++, kind }]);
    setAdded(false);
  };
  const undo = () => {
    setAdded(false);
    if (closed) setClosed(false);
    else setLayers((l) => l.slice(0, -1));
  };
  const reset = () => {
    setAdded(false);
    setClosed(false);
    setLayers([]);
  };

  const total = BUN.price + layers.reduce((s, l) => s + byKind[l.kind].price, 0);
  const kcal = BUN.kcal + layers.reduce((s, l) => s + byKind[l.kind].kcal, 0);
  const full = layers.length >= MAX_LAYERS;

  return (
    <section id="build" className="relative overflow-hidden bg-ink py-28 text-paper sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "url(/art/tile.svg)", backgroundSize: "80px" }}
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div data-reveal className="max-w-2xl">
          <p className="eyebrow mb-4 text-mustard">Your turn</p>
          <h2 className="display text-[clamp(3rem,8vw,7rem)]">
            Stack your <span className="accent text-mustard">own.</span>
          </h2>
          <p className="mt-5 max-w-md text-lg text-paper/70">
            Tap ingredients to drop them on the bun. Crown it when you&apos;re happy. We&apos;ll build it exactly like
            that — no judgement, some admiration.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <div className="relative min-h-[26rem] overflow-hidden rounded-[2.5rem] border-2 border-paper/15 bg-gradient-to-b from-ink-2 to-ink sm:min-h-[34rem]">
            <div aria-hidden className="absolute bottom-[-25%] left-1/2 size-[90%] -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(240_180_41/0.2),transparent)]" />
            <BuilderScene layers={layers} closed={closed} />
            <p className="eyebrow absolute top-5 left-6 text-paper/50">
              {layers.length}/{MAX_LAYERS} layers
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <p className="eyebrow mb-3 text-paper/50">Add a layer</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {OPTIONS.map((o) => (
                  <button
                    key={o.kind}
                    type="button"
                    onClick={() => add(o.kind)}
                    disabled={closed || full}
                    className="group flex items-center gap-3 rounded-2xl border-2 border-paper/15 bg-ink-2 px-3 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-mustard disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0 disabled:hover:border-paper/15"
                  >
                    <span
                      className="size-7 shrink-0 rounded-full border-2 border-ink shadow-[inset_-3px_-3px_0_rgba(0,0,0,.2)]"
                      style={{ background: o.swatch }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{o.label}</span>
                      <span className="block text-xs text-paper/50">+{money(o.price)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setClosed(true)} disabled={closed} className="btn bg-mustard text-ink disabled:opacity-40">
                {closed ? "Crowned ✓" : "Crown it"}
              </button>
              <button
                type="button"
                onClick={undo}
                disabled={!closed && layers.length === 0}
                className="btn border-paper bg-transparent text-paper shadow-[4px_4px_0_var(--color-paper)]! disabled:opacity-40"
              >
                Undo
              </button>
              <button type="button" onClick={reset} className="px-3 text-sm font-semibold text-paper/60 underline underline-offset-4 hover:text-paper">
                Start over
              </button>
            </div>

            <div className="mt-auto rounded-[2rem] border-2 border-ink bg-paper p-6 text-ink shadow-[6px_6px_0_var(--color-tomato)]" aria-live="polite">
              <p className="eyebrow text-tomato">Your order</p>
              <p className="display mt-1 text-4xl leading-none">{nameFor(layers)}</p>
              <ol className="mt-4 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto" data-lenis-prevent>
                <li className="rounded-full bg-paper-2 px-2.5 py-1 text-xs font-semibold">Potato bun</li>
                {layers.map((l) => (
                  <li key={l.id} className="rounded-full bg-paper-2 px-2.5 py-1 text-xs font-semibold">
                    {byKind[l.kind].label}
                  </li>
                ))}
              </ol>
              <div className="mt-5 flex items-end justify-between border-t-2 border-dashed border-ink/20 pt-4">
                <div>
                  <p className="display text-4xl">{money(total)}</p>
                  <p className="text-xs text-ink/50">
                    ~{kcal} kcal · roughly {(6 + layers.length * 1.1).toFixed(1)} cm tall
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAdded(true)}
                  disabled={!closed}
                  className="btn bg-tomato text-paper disabled:opacity-40"
                  title={closed ? undefined : "Crown it first"}
                >
                  {added ? "In the bag ✓" : "Add to bag"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
