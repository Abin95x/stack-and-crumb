"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { ROLL_TIMELINE } from "@/lib/roll";
import { useScrollProgress } from "@/lib/useScrollProgress";

const RollScene = dynamic(() => import("@/components/three/RollScene"), { ssr: false });

const STEPS: { key: keyof typeof ROLL_TIMELINE; title: string; body: string }[] = [
  { key: "open", title: "Split the roll", body: "Rice-flour dough, baked till the crust shatters. Opened down one side only." },
  { key: "mayo", title: "Chili-lime mayo", body: "Spread edge to edge. No dry bites, ever." },
  { key: "cucumber", title: "Cucumber spears", body: "Cut long so every mouthful gets one." },
  { key: "meat", title: "Lemongrass chicken", body: "Thigh meat, marinated overnight, charred hard over the grill." },
  { key: "pickles", title: "Carrot & daikon", body: "Quick-pickled every morning in rice vinegar and a little sugar." },
  { key: "chili", title: "Bird's-eye chili", body: "Sliced thin. Ask for more, we won't judge." },
  { key: "cilantro", title: "A fistful of cilantro", body: "Stems and all — that's where the flavour lives." },
  { key: "drizzle", title: "Sriracha zig-zag", body: "One pass, end to end. Heat you can see coming." },
  { key: "close", title: "Close & wrap", body: "Pressed shut, wrapped in paper, handed over warm." },
];

export default function RollSection() {
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(-1);
  const progress = useScrollProgress(section, (p) => {
    let a = -1;
    STEPS.forEach((s, i) => {
      if (p >= ROLL_TIMELINE[s.key][0]) a = i;
    });
    setActive(a);
  });
  const current = STEPS[Math.max(active, 0)];

  return (
    <section id="roll" ref={section} className="relative h-[420vh] bg-paper" aria-label="How a long roll is built">
      <div className="sticky top-0 h-svh overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 h-[60vmin] w-[130vmin] -translate-x-1/2 -translate-y-1/3 bg-[radial-gradient(closest-side,rgb(226_70_44/0.14),transparent)]"
        />
        <RollScene progress={progress} />

        <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-7xl flex-col px-5 pt-28 pb-8 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow mb-4 text-tomato">The other thing we&apos;re known for</p>
              <h2 className="display text-[clamp(3rem,8vw,7rem)]">
                The long
                <br />
                way <span className="accent text-tomato">round.</span>
              </h2>
            </div>
            <p className="max-w-xs text-ink/70 max-sm:hidden">
              A crackly rice-flour roll, split down one side and loaded end to end. Scroll and watch it come together.
            </p>
          </div>

          <div className="mt-auto">
            <div className="mx-auto max-w-md text-center" aria-live="polite">
              <p className="eyebrow text-tomato">
                Step {String(Math.max(active, 0) + 1).padStart(2, "0")}
              </p>
              <p key={current.key} className="display mt-1 animate-[fade-up_.5s_ease] text-4xl sm:text-5xl">
                {current.title}
              </p>
              <p className="mt-2 text-sm text-ink/70 sm:text-base">{current.body}</p>
            </div>
            <ol className="mt-6 flex justify-center gap-1.5 sm:gap-2" aria-label="Build steps">
              {STEPS.map((s, i) => (
                <li
                  key={s.key}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    i === active ? "w-10 bg-tomato" : i < active ? "w-4 bg-ink" : "w-4 bg-ink/15"
                  }`}
                >
                  <span className="sr-only">{s.title}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
