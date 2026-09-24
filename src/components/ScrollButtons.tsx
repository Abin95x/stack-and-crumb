"use client";

import { useEffect, useState } from "react";
import { getLenis } from "@/lib/lenis";

export default function ScrollButtons() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show buttons if the page is scrollable and we have scrolled a bit, or just always show them?
      // "add a scroll down button and scroll up button after analizing int"
      // Let's just always show them, but maybe hide the top one when at the very top.
      setShow(true);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(0, { lerp: 0.05 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const scrollToBottom = () => {
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo("bottom", { lerp: 0.05 });
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  };

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed left-4 bottom-4 z-50 flex flex-col gap-2 sm:left-6 sm:bottom-6 max-sm:hidden">
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className="pointer-events-auto flex size-10 items-center justify-center rounded-full border-2 border-ink bg-paper text-ink shadow-[2px_2px_0_var(--color-ink)] transition-transform hover:translate-y-[-2px] hover:shadow-[2px_4px_0_var(--color-ink)]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m18 15-6-6-6 6"/>
        </svg>
      </button>
      <button
        type="button"
        onClick={scrollToBottom}
        aria-label="Scroll to bottom"
        className="pointer-events-auto flex size-10 items-center justify-center rounded-full border-2 border-ink bg-paper text-ink shadow-[2px_2px_0_var(--color-ink)] transition-transform hover:translate-y-[2px] hover:shadow-[2px_4px_0_var(--color-ink)]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
    </div>
  );
}
