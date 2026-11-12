---
title: Turntable
company: Turntable
kind: personal
role: Designer & Engineer
description: 'A browser-based 3D studio for placing interface screenshots on device models and exporting product images.'
seoTitle: 'Turntable – 3D Device Mockup Studio in the Browser'
dateRange: '2026'
sortDate: 2026-07-15
location: Independent
order: 102
technologies: [Three.js, WebGL, GLSL, JavaScript, Vite]
achievements:
  - '**Scene** — Three.js device models, custom backdrop shaders, and twelve composition presets'
  - '**Editing** — Undo/redo, saved settings, and screenshot restoration through IndexedDB'
  - '**Export** — Exact pixel dimensions, PNG/JPG/WebP, and transparent backgrounds'
screenshot:
  src: '/project-screenshots/turntable.webp'
  alt: 'Turntable 3D mockup editor with an iPhone composition, dark studio background, and configuration panel'
  caption: 'The working studio: direct composition in the canvas, with the configuration panel open beside it.'
  width: 1280
  height: 720
externalUrl: https://github.com/peritissimus/turntable
updated: 2026-11-12
---

I kept needing images of my apps for landing pages and launch posts. Each interface change meant another trip through Blender or a mockup service. I wanted a tool I could leave open beside the code: paste a screenshot, choose an angle, and export an image.

Turntable is that tool. It runs in the browser and lets me place a screenshot on a 3D device, adjust the scene, and export at a specific size. [Daniel Designs' device-composition concept](https://x.com/daniel__designs/status/2077060057791856713) was the starting inspiration.

## Building the devices

The iPhone, iPad, and MacBook are Three.js models assembled from bezels, lenses, buttons, ports, and other parts. Metal and glass materials respond to the scene's lights as the device rotates. The MacBook has a hinged lid and a keyboard made from repeated key geometry.

## Lighting the scene

The backdrop curves from wall to floor, like a photography studio. This gives the device a continuous surface to cast its shadow onto. Custom shaders add grain, soften the edges of the backdrop, and darken the area near the device. Presets provide starting compositions, including Alabaster, Midnight, and Terracotta backgrounds.

## Keeping editing responsive

The renderer pauses when the scene is idle. During editing, preview resolution and shadow quality are limited; exports restore the full shadow settings. Output supports exact dimensions, PNG, JPG, WebP, and transparent backgrounds.

Undo and redo cover scene changes. Settings are saved in the browser, and IndexedDB keeps uploaded screenshots available after a refresh. The app uses JavaScript and Vite, with one shared state tree for the scene and controls.
