"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";

/** Fades every [data-reveal] element up as it scrolls into view. */
export default function Reveals() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 88%",
        once: true,
        onEnter: (els) =>
          gsap.fromTo(
            els,
            { y: 40, opacity: 0, rotate: 0.6 },
            { y: 0, opacity: 1, rotate: 0, duration: 0.9, ease: "power3.out", stagger: 0.08 },
          ),
      });
    });
    return () => ctx.revert();
  }, []);
  return null;
}
