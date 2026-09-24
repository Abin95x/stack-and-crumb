import type Lenis from "lenis";

/** The page's single Lenis instance, so overlays can pause smooth scrolling. */
let instance: Lenis | null = null;

export const setLenis = (l: Lenis | null) => {
  instance = l;
};

export const getLenis = () => instance;
