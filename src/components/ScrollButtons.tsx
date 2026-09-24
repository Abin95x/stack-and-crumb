"use client";

import { useEffect, useState } from "react";
import { getLenis } from "@/lib/lenis";

export default function ScrollButtons() {
  const [visibleButton, setVisibleButton] = useState<"up" | "down">("down");

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      if (currentScrollY <= 0) {
        setVisibleButton("down");
      } else if (currentScrollY >= maxScroll - 10) {
        setVisibleButton("up");
      } else {
        if (currentScrollY > lastScrollY) {
          setVisibleButton("down");
        } else if (currentScrollY < lastScrollY) {
          setVisibleButton("up");
        }
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check
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

  return (
    <div className="pointer-events-none fixed left-4 bottom-4 z-50 flex flex-col gap-2 sm:left-6 sm:bottom-6">
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`pointer-events-auto flex size-10 items-center justify-center rounded-full border-2 border-ink bg-paper text-ink shadow-[2px_2px_0_var(--color-ink)] transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[2px_4px_0_var(--color-ink)] ${
          visibleButton === "up" ? "scale-100 opacity-100" : "absolute scale-0 opacity-0 pointer-events-none"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m18 15-6-6-6 6"/>
        </svg>
      </button>
      <button
        type="button"
        onClick={scrollToBottom}
        aria-label="Scroll to bottom"
        className={`pointer-events-auto flex size-10 items-center justify-center rounded-full border-2 border-ink bg-paper text-ink shadow-[2px_2px_0_var(--color-ink)] transition-all duration-300 hover:translate-y-[2px] hover:shadow-[2px_4px_0_var(--color-ink)] ${
          visibleButton === "down" ? "scale-100 opacity-100" : "absolute scale-0 opacity-0 pointer-events-none"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
    </div>
  );
}
