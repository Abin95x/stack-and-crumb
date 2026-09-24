"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect } from "react";
import { setLenis } from "@/lib/lenis";

/**
 * Lenis inertia scrolling driven by GSAP's ticker, so Lenis, ScrollTrigger and
 * every GSAP tween advance in the same animation frame (no double rAF loops,
 * no one-frame lag between scroll position and scroll-linked 3D).
 */
export default function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    // Mobile browser toolbars resize the viewport while scrolling; refreshing
    // every trigger on each of those is a big source of jank.
    ScrollTrigger.config({ ignoreMobileResize: true });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.09,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
      smoothWheel: true,
      anchors: { offset: -72, lerp: 0.08 },
    });
    setLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      setLenis(null);
      lenis.destroy();
    };
  }, []);

  return null;
}
