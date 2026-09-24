# Stack & Crumb

## Run

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

## Stack

Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · three.js via @react-three/fiber + drei ·
GSAP ScrollTrigger · Lenis smooth scroll.

## How the animation works

All food is procedural geometry — no downloaded models or photos.

- `src/components/three/geometry.ts` — buns, patties, cheese, lettuce, bacon, egg (lathes + noise), the
  hinged long roll, cilantro sprigs.
- `src/components/three/textures.ts` — canvas-drawn textures (tomato and pickle cross-sections, crust).
- `src/components/three/detail.ts` — shader patch that adds object-space micro-detail to any material:
  band-limited noise bump, colour variation, char patches, crumb/meat pores, roughness breakup.
- Lighting (`Stage.tsx`) is procedural softboxes + key/rim lights with Neutral tone mapping. An HDRI
  environment and SSAO post-processing were tried and removed: both crashed the WebGL context on an
  Intel UHD 620.
- `src/components/three/HeroScene.tsx` — scroll-driven: ingredients float scattered, then fly in one by one
  and squash onto the stack. Timings live in `src/lib/hero.ts`.
- `src/components/three/Roll.tsx` + `RollScene.tsx` — the roll opens on its hinge, fillings rain in as
  instanced meshes (`FlyingInstances.tsx`), then it closes. Timeline in `src/lib/roll.ts`.
- `src/components/three/BuilderScene.tsx` — interactive "stack your own"; layers drop in on a spring.
- `src/lib/useScrollProgress.ts` — maps a tall section's scroll to 0..1 (read inside `useFrame`, no re-renders).

## Performance

- Canvases render **on demand** (`Stage.tsx`): full frame rate while scrolling, moving the pointer, or
  while a scene calls `useWake()`; ~30 fps for idle motion; nothing when off-screen.
- Shadow maps refresh every frame only while active; floor shadows are a baked blob (`SoftShadow.tsx`)
  instead of a per-frame depth render + blur.
- The hero canvas mounts first; the others mount in idle time (or when approached) and precompile their
  shaders with `compileAsync`, so no compile stall lands mid-scroll.
- Instanced fillings skip matrix uploads when the scroll timeline hasn't moved.
- No `backdrop-filter`, CSS `blur()` or blend modes over the live canvases (they force a full
  recomposite every frame); glows are radial gradients.
- Scroll: Lenis driven by GSAP's ticker (one rAF loop), `ScrollTrigger.ignoreMobileResize`.

Measure against a production build (`npm run build && npm start`); `next dev` is several times slower.

## Images

- `public/art/*.svg` — hand-written SVG illustrations (mascot, stamp, sides, drinks, map, pattern tile).
- `public/menu/*.webp` — menu photos rendered from the 3D models (captured as PNG, converted with
  `ffmpeg -i x.png -c:v libwebp -quality 86 -pix_fmt yuva420p x.webp`). In dev, open `/studio/<item-id>`
  (e.g. `/studio/foreman`) — it renders the item on a transparent canvas and sets `body[data-ready]`
  when it's safe to screenshot at 900×900 with a transparent background. The route 404s in production.



<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/a03b3385-28fe-4db8-af63-303a9020d078" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/6ce2bd42-8f24-4e46-b0cf-062ccb151401" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/be104996-c13b-4a1b-b378-216d4312b9d9" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/05787eef-52b5-43c4-ac91-13711e5b4566" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/eec9f01b-7ff6-4496-acb5-b043daee78cc" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/be22c23e-e0da-4f34-ac14-bfa39e07a75a" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/7fb6f7ad-a31e-42ed-8653-8983ccb5f1ae" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/8f3e04c5-c8d9-4e4e-a55a-13d9b72798c6" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/2b74914b-ac02-4e9f-83c7-3fc279117b0c" />









  
