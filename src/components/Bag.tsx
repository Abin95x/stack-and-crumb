"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { getLenis } from "@/lib/lenis";
import { money } from "@/lib/menu";

const GST = 0.05;

export function BagIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8Z" />
      <path d="M9 10V6.5a3 3 0 0 1 6 0V10" strokeLinecap="round" />
    </svg>
  );
}

/** "Added" toast and the slide-in bag drawer. */
export default function Bag() {
  const { lines, count, subtotal, open, setOpen, setQty, clear, lastAdded } = useCart();
  const [placed, setPlaced] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(0);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);

  // "Added" toast for a moment after each add.
  const toast = lastAdded && lastAdded.at !== dismissed ? lastAdded.name : null;
  useEffect(() => {
    if (!lastAdded) return;
    const t = setTimeout(() => setDismissed(lastAdded.at), 1800);
    return () => clearTimeout(t);
  }, [lastAdded]);

  // Pause smooth scrolling, trap Escape and move focus while the drawer is open.
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    getLenis()?.stop();
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      getLenis()?.start();
      window.removeEventListener("keydown", onKey);
      (opener.current as HTMLElement | null)?.focus?.();
      setPlaced(null);
    };
  }, [open, setOpen]);

  const gst = Math.round(subtotal * GST);
  const total = subtotal + gst;

  const placeOrder = () => {
    setPlaced(`SC-${Math.floor(1000 + Math.random() * 9000)}`);
    clear();
  };

  return (
    <>
      {/* "Added" toast; sits left of the scroll buttons (size-10 + gap) so they don't cover it. */}
      <div data-overlay className="pointer-events-none fixed right-16 bottom-4 z-50 sm:right-18 sm:bottom-6">
        <p
          role="status"
          className={`rounded-full border-2 border-ink bg-mustard px-4 py-2 text-sm font-semibold text-ink shadow-[3px_3px_0_var(--color-ink)] transition-all duration-300 ${
            toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
        >
          {toast ? `Added ${toast}` : " "}
        </p>
      </div>

      {/* Drawer */}
      <div data-overlay className={`fixed inset-0 z-[80] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div
          className={`absolute inset-0 bg-ink/50 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="bag-title"
          inert={!open}
          className={`absolute top-0 right-0 flex h-full w-full max-w-md flex-col border-l-2 border-ink bg-paper text-ink shadow-[-8px_0_0_var(--color-mustard)] transition-transform duration-500 ease-[cubic-bezier(.2,.9,.2,1)] ${
            open ? "translate-x-0" : "translate-x-[110%]"
          }`}
        >
          <header className="flex items-center justify-between border-b-2 border-ink px-6 py-5">
            <h2 id="bag-title" className="display flex items-center gap-3 text-3xl">
              <BagIcon className="size-7" /> Your bag
              <span className="rounded-full bg-ink px-2.5 py-0.5 text-base text-mustard">{count}</span>
            </h2>
            <button
              ref={closeBtn}
              type="button"
              onClick={() => setOpen(false)}
              className="grid size-10 place-items-center rounded-full border-2 border-ink text-xl hover:bg-mustard"
              aria-label="Close bag"
            >
              ×
            </button>
          </header>

          {placed ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
              <Image src="/art/stamp.svg" alt="" width={140} height={140} className="animate-spin-slow" />
              <p className="eyebrow text-tomato">Order {placed}</p>
              <p className="display text-4xl">It&apos;s on the flat-top.</p>
              <p className="text-ink/70">Ready for pickup in about 15 minutes. (Demo only: no real order was placed.)</p>
              <button type="button" onClick={() => setOpen(false)} className="btn mt-2 bg-mustard text-ink">
                Back to the menu
              </button>
            </div>
          ) : lines.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
              <Image src="/art/mascot.svg" alt="" width={110} height={121} />
              <p className="display text-3xl">Your bag is empty.</p>
              <p className="text-ink/70">Something between two buns would fix that.</p>
              <a href="#menu" onClick={() => setOpen(false)} className="btn mt-2 bg-tomato text-paper">
                Browse the menu
              </a>
            </div>
          ) : (
            <>
              <ul className="flex-1 space-y-3 overflow-y-auto px-6 py-5" data-lenis-prevent>
                {lines.map((l) => (
                  <li key={l.id} className="flex gap-4 rounded-3xl border-2 border-ink bg-paper-2 p-3">
                    <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-mustard">
                      <Image src={l.image ?? "/art/icon.svg"} alt="" width={80} height={80} className="size-full object-contain p-1" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <p className="display text-xl leading-tight">{l.name}</p>
                        <p className="display shrink-0 text-lg">{money(l.price * l.qty)}</p>
                      </div>
                      {l.note && <p className="mt-0.5 line-clamp-2 text-xs text-ink/60">{l.note}</p>}
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center rounded-full border-2 border-ink bg-paper">
                          <button
                            type="button"
                            onClick={() => setQty(l.id, l.qty - 1)}
                            className="grid size-8 place-items-center rounded-full text-lg hover:bg-mustard"
                            aria-label={`One less ${l.name}`}
                          >
                            −
                          </button>
                          <span className="w-7 text-center text-sm font-bold" aria-label="Quantity">
                            {l.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQty(l.id, l.qty + 1)}
                            className="grid size-8 place-items-center rounded-full text-lg hover:bg-mustard"
                            aria-label={`One more ${l.name}`}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setQty(l.id, 0)}
                          className="text-xs font-semibold text-ink/50 underline underline-offset-2 hover:text-tomato"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <footer className="border-t-2 border-ink px-6 py-5">
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-ink/70">Subtotal</dt>
                    <dd>{money(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink/70">GST (5%)</dt>
                    <dd>{money(gst)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between border-t-2 border-dashed border-ink/20 pt-3">
                    <dt className="display text-2xl">Total</dt>
                    <dd className="display text-3xl">{money(total)}</dd>
                  </div>
                </dl>
                <button type="button" onClick={placeOrder} className="btn mt-5 w-full justify-center bg-tomato text-paper">
                  Place pickup order
                </button>
                <p className="mt-3 text-center text-xs text-ink/50">Pay at the counter · Ready in ~15 min</p>
              </footer>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
