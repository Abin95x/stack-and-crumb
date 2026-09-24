"use client";

import Image from "next/image";
import { useState } from "react";

export default function Footer() {
  const [joined, setJoined] = useState(false);

  return (
    <footer className="relative overflow-hidden bg-ink pt-24 text-paper">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="display text-5xl sm:text-6xl">
              The Crumb <span className="accent text-mustard">Letter</span>
            </h2>
            <p className="mt-3 max-w-md text-paper/65">
              One email a month. New stacks first, secret menu items, and the odd free pickle.
            </p>
            {joined ? (
              <p className="display mt-6 text-2xl text-mustard" role="status">
                You&apos;re on the list. Welcome to the crumb.
              </p>
            ) : (
              <form
                className="mt-6 flex max-w-md flex-wrap gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setJoined(true);
                }}
              >
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="min-w-0 flex-1 rounded-full border-2 border-paper/25 bg-transparent px-5 py-3 text-paper placeholder:text-paper/40 focus:border-mustard focus:outline-none"
                />
                <button className="btn bg-mustard text-ink shadow-[4px_4px_0_var(--color-tomato)]!">Sign me up</button>
              </form>
            )}
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="eyebrow mb-4 text-mustard">Eat</p>
              <ul className="space-y-2 text-paper/70">
                <li><a className="hover:text-paper" href="#menu">Menu</a></li>
                <li><a className="hover:text-paper" href="#build">Build your own</a></li>
                <li><a className="hover:text-paper" href="#faq">Catering</a></li>
              </ul>
            </div>
            <div>
              <p className="eyebrow mb-4 text-mustard">Say hi</p>
              <ul className="space-y-2 text-paper/70">
                <li><a className="hover:text-paper" href="#visit">Visit us</a></li>
                <li><a className="hover:text-paper" href="#top">Instagram</a></li>
                <li><a className="hover:text-paper" href="#top">TikTok</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-20 flex items-end gap-4 border-t border-paper/15 pt-8">
          <Image src="/art/mascot.svg" alt="" width={90} height={99} className="shrink-0 max-sm:w-14" />
          <p className="display text-[clamp(3rem,13vw,12rem)] leading-[0.8] whitespace-nowrap">
            Stack <span className="accent text-mustard">&amp;</span> Crumb
          </p>
        </div>
        <div className="flex flex-wrap justify-between gap-4 py-8 text-xs text-paper/45">
          <p>© {new Date().getFullYear()} Stack &amp; Crumb. Built layer by layer.</p>
          <p>Concept site — names, prices, address and phone number are fictional.</p>
        </div>
      </div>
    </footer>
  );
}
