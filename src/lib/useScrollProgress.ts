"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, type RefObject } from "react";

/**
 * 0..1 progress of a tall section scrolling past a pinned (sticky) viewport.
 * Returned as a ref so the 3D render loop can read it without React renders.
 */
export function useScrollProgress(target: RefObject<HTMLElement | null>, onUpdate?: (p: number) => void) {
  const progress = useRef(0);
  const cb = useRef(onUpdate);
  useEffect(() => {
    cb.current = onUpdate;
  });

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: target.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        progress.current = self.progress;
        cb.current?.(self.progress);
      },
    });
    progress.current = st.progress;
    cb.current?.(st.progress);
    return () => st.kill();
  }, [target]);

  return progress;
}
