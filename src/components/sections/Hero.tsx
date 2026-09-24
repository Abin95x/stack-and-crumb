"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { HERO_DONE, HERO_STEPS, heroStepAt } from "@/lib/hero";
import { useScrollProgress } from "@/lib/useScrollProgress";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), { ssr: false });

export default function Hero() {
  const section = useRef<HTMLElement>(null);
  const [ui, setUi] = useState({ step: -1, done: false, started: false });
  const { step, done, started } = ui;

  // Fires on every scroll frame; only touch React state when a caption changes.
  const progress = useScrollProgress(section, (p) => {
    const next = { step: heroStepAt(p), done: p > HERO_DONE + 0.03, started: p > 0.02 };
    setUi((cur) =>
      cur.step === next.step && cur.done === next.done && cur.started === next.started ? cur : next,
    );
  });

  const current = HERO_STEPS[Math.max(step, 0)];

  return (
    <section id="top" ref={section} className="relative h-[460vh] bg-ink text-paper" aria-label="Build The Foreman">
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* Warm glow behind the burger */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-[55%] left-1/2 size-[90vmin] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,rgb(240_180_41/0.22),transparent)] min-[900px]:left-[70%]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "url(/art/tile.svg)", backgroundSize: "80px" }}
        />

        <HeroScene progress={progress} />

        <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-7xl flex-col px-5 pt-28 pb-8 sm:px-8 sm:pt-32">
          <div className="max-w-xl">
            <p className="eyebrow mb-5 flex items-center gap-3 text-mustard">
              <span className="h-px w-8 bg-mustard" /> Burgers &amp; long rolls · Riverside
            </p>
            <h1 className="display text-[clamp(3.6rem,11vw,9.5rem)]">
              <span className="block">Built</span>
              <span className="block">
                <span className="accent pr-2 text-[0.92em] tracking-normal text-mustard">layer</span>by
              </span>
              <span className="block">
                layer<span className="text-tomato">.</span>
              </span>
            </h1>
            <p
              className={`mt-6 max-w-sm text-base leading-relaxed text-paper/75 transition-opacity duration-500 sm:text-lg max-[899px]:hidden ${
                started ? "opacity-0" : "opacity-100"
              }`}
            >
              Everything between our buns earns its place. Bread baked before sunrise, patties pressed to order,
              pickles we brine ourselves.
            </p>
            <div
              className={`mt-8 flex flex-wrap gap-3 transition-opacity duration-500 max-[899px]:hidden ${
                started ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"
              }`}
            >
              <a href="#menu" className="btn bg-mustard text-ink">
                See the menu
              </a>
              <a href="#build" className="btn border-paper bg-transparent text-paper shadow-[4px_4px_0_var(--color-paper)]!">
                Build your own
              </a>
            </div>
          </div>

          {/* Step ticker */}
          <div className="absolute inset-x-5 bottom-6 grid items-end sm:inset-x-8 sm:bottom-8">
            <div
              className={`col-start-1 row-start-1 max-w-sm rounded-3xl border-2 border-paper/15 bg-ink/90 p-5 transition-all duration-500 ${
                step >= 0 && !done ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
              }`}
              aria-live="polite"
            >
              <div className="mb-3 flex gap-1.5" aria-hidden>
                {HERO_STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-mustard" : "bg-paper/15"}`}
                  />
                ))}
              </div>
              <p className="eyebrow text-mustard">
                Layer {String(Math.max(step, 0) + 1).padStart(2, "0")} / {String(HERO_STEPS.length).padStart(2, "0")}
              </p>
              <p className="display mt-1 text-3xl leading-none">{current.title}</p>
              <p className="mt-2 text-sm text-paper/70">{current.body}</p>
            </div>

            <div
              className={`col-start-1 row-start-1 max-w-xs justify-self-start rounded-3xl border-2 border-ink bg-paper p-5 text-ink shadow-[6px_6px_0_var(--color-mustard)] transition-all duration-500 ${
                done ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"
              }`}
            >
              <p className="eyebrow text-tomato">Stacked.</p>
              <p className="display mt-1 text-4xl leading-none">The Foreman</p>
              <p className="mt-2 text-sm text-ink/70">Two patties, two slices, seven layers of reasons to come back.</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="display text-3xl">$14.50</span>
                <a href="#menu" className="btn bg-tomato py-2! text-paper">
                  Get one
                </a>
              </div>
            </div>
          </div>

          <p
            className={`eyebrow absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-paper/60 transition-opacity duration-500 ${
              started ? "opacity-0" : "opacity-100"
            }`}
          >
            Scroll to stack
            <span className="block h-10 w-px animate-pulse bg-paper/50" />
          </p>
        </div>
      </div>
    </section>
  );
}
