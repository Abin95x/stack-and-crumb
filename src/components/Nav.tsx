"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "#menu", label: "Menu" },
  { href: "#roll", label: "Long rolls" },
  { href: "#build", label: "Build yours" },
  { href: "#bread", label: "Our bread" },
  { href: "#visit", label: "Visit" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let last = false;
    const onScroll = () => {
      const now = window.scrollY > 40;
      if (now !== last) setScrolled((last = now));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <nav
        aria-label="Main"
        className={`mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full border-2 border-ink py-2 pr-2 pl-3 transition-colors duration-300 ${
          scrolled ? "bg-paper text-ink" : "border-paper/20 bg-ink/85 text-paper"
        }`}
      >
        <a href="#top" className="flex items-center gap-2.5 select-none" aria-label="Stack & Crumb home">
          <Image src="/art/mascot.svg" alt="" width={40} height={44} priority />
          <span className="display text-[1.35rem] leading-none tracking-tight">
            Stack <span className="accent font-normal text-mustard">&amp;</span> Crumb
          </span>
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-full px-4 py-2 text-sm font-semibold transition-colors hover:bg-mustard hover:text-ink"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a href="#build" className="btn hidden bg-tomato py-2.5! text-paper sm:inline-flex">
            Order pickup
          </a>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full border-2 border-current lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative block h-3 w-5">
              <span className={`absolute left-0 h-0.5 w-5 bg-current transition-all ${open ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 h-0.5 w-5 bg-current transition-all ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
            </span>
          </button>
        </div>
      </nav>

      <div
        id="mobile-menu"
        className={`mx-auto mt-2 max-w-7xl overflow-hidden rounded-[2rem] border-2 border-ink bg-paper text-ink transition-all duration-300 lg:hidden ${
          open ? "max-h-[28rem] opacity-100" : "pointer-events-none max-h-0 border-transparent opacity-0"
        }`}
      >
        <ul className="flex flex-col p-3">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={() => setOpen(false)} className="display block rounded-2xl px-4 py-3 text-3xl hover:bg-mustard">
                {l.label}
              </a>
            </li>
          ))}
          <li className="p-2">
            <a href="#build" onClick={() => setOpen(false)} className="btn w-full justify-center bg-tomato text-paper">
              Order pickup
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
