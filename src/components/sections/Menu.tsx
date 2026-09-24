"use client";

import Image from "next/image";
import { useState } from "react";
import { BagIcon } from "@/components/Bag";
import { useCart } from "@/lib/cart";
import { MENU, money, type MenuItem } from "@/lib/menu";

const CARD_TINTS = ["bg-mustard", "bg-tomato/80", "bg-pickle/70", "bg-crust/60"];

const TAG_STYLE: Record<string, string> = {
  veg: "bg-pickle text-paper",
  spicy: "bg-tomato text-paper",
  new: "bg-ink text-mustard",
  "fan fave": "bg-mustard text-ink",
};

function Card({ item, index }: { item: MenuItem; index: number }) {
  const photo = !!item.render;
  const { add } = useCart();
  return (
    <article className="group flex flex-col overflow-hidden rounded-[2rem] border-2 border-ink bg-paper shadow-[6px_6px_0_var(--color-ink)] transition-transform duration-300 hover:-translate-y-1 hover:-rotate-[0.6deg]">
      <div className={`relative aspect-[5/4] overflow-hidden border-b-2 border-ink ${CARD_TINTS[index % CARD_TINTS.length]}`}>
        <div
          aria-hidden
          className="absolute inset-0 opacity-15"
          style={{ backgroundImage: "url(/art/tile.svg)", backgroundSize: "60px" }}
        />
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          className={`object-contain transition-transform duration-500 group-hover:scale-105 ${photo ? "scale-110 p-2" : "p-10"}`}
        />
        {item.tags && (
          <ul className="absolute top-4 left-4 flex flex-wrap gap-1.5">
            {item.tags.map((t) => (
              <li key={t} className={`eyebrow rounded-full border-2 border-ink px-2.5 py-1 text-[0.65rem] ${TAG_STYLE[t]}`}>
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="display text-3xl leading-none">{item.name}</h3>
          <span className="display shrink-0 rounded-full bg-ink px-3 py-1 text-lg text-mustard">{money(item.price)}</span>
        </div>
        <p className="mt-3 mb-5 text-[0.95rem] leading-relaxed text-ink/70">{item.blurb}</p>
        <button
          type="button"
          onClick={() => add({ id: item.id, name: item.name, price: item.price, image: item.image })}
          className="btn mt-auto self-start bg-mustard py-2! text-ink"
          aria-label={`Add ${item.name} to bag`}
        >
          <BagIcon className="size-4" /> Add to bag
        </button>
      </div>
    </article>
  );
}

export default function Menu() {
  const [tab, setTab] = useState(MENU[0].id);
  const category = MENU.find((c) => c.id === tab)!;

  return (
    <section id="menu" className="relative bg-paper-2 py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div data-reveal>
            <p className="eyebrow mb-4 text-tomato">The menu</p>
            <h2 className="display text-[clamp(3rem,8vw,7rem)]">
              Short list.
              <br />
              <span className="accent text-crust">Long</span> lunch.
            </h2>
          </div>
          <p data-reveal className="max-w-sm text-lg text-ink/70">
            Fifteen things, done properly. Every burger and roll photo here was rendered from the same kitchen you
            just scrolled through.
          </p>
        </div>

        <div role="tablist" aria-label="Menu categories" className="mt-12 flex flex-wrap gap-2">
          {MENU.map((c) => (
            <button
              key={c.id}
              role="tab"
              id={`tab-${c.id}`}
              aria-selected={tab === c.id}
              aria-controls={`panel-${c.id}`}
              onClick={() => setTab(c.id)}
              className={`display rounded-full border-2 border-ink px-5 py-2.5 text-lg transition-all ${
                tab === c.id ? "bg-ink text-paper shadow-[3px_3px_0_var(--color-tomato)]" : "bg-paper hover:bg-mustard"
              }`}
            >
              {c.label}
              <span className="ml-2 text-sm opacity-60">{c.items.length}</span>
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${category.id}`} aria-labelledby={`tab-${category.id}`} className="mt-8">
          <p className="mb-8 max-w-xl text-ink/60">{category.note}</p>
          <div key={category.id} className="grid animate-[fade-up_.5s_ease] gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {category.items.map((item, i) => (
              <Card key={item.id} item={item} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
