# SOBHA — 3D redesign

A scroll-driven 3D redesign of [sobha.com](https://www.sobha.com) built with
React 19, Vite and react-three-fiber.

**Live:** https://fsix7115-arch.github.io/sobha-3d/

## What's in here

- **Real content harvested from the source site** — 30 project images, actual
  project names, all 14 cities, the company timeline and the real stats.
  Nothing is placeholder lorem.
- **Five scroll stations** laid out along -Z. The camera lerps between them
  as you scroll; the DOM sections stay the scroll spine (no scroll-jacking),
  so anchor links and text selection keep working.
- **Quality tiering** — the GPU is detected before the first render and the
  scene scales to it. `PerformanceMonitor` lowers the pixel ratio further if
  the frame rate can't hold.
- **Graceful degradation** — no WebGL, a failed chunk, or a driver reset
  drops the 3D backdrop and leaves a fully readable, CSS-only page.

## Stack

| Package | Version |
|---------|---------|
| three | 0.186 |
| @react-three/fiber | 9.8 |
| @react-three/drei | 10.7 |
| react | 19.3 |
| vite | 8.3 |

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
npm run preview
```

## Deploying to Vercel

**Via the dashboard:** import this repo, and Vercel detects the Vite preset
(build `npm run build`, output `dist`). `vercel.json` is already committed
with the right settings.

**Via the CLI:**

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # production
```

**As a static build (no server):** run `npm run build` and upload the `dist/`
folder to any static host.

## Notes

- The project images in `public/projects/` are resized to 600px wide WebP.
  The originals from sobha.com are 500–1000px, which is wasted bandwidth for
  textures that never display larger than ~600px.
- `src/scene/quality.js` holds the GPU tiers. `src/scene/Scene.jsx` holds
  the station layout and the camera rig.
