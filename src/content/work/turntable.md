---
title: Turntable
company: Turntable
kind: personal
role: Designer & Engineer
description: A browser-based 3D device mockup studio for turning interface screenshots into polished product imagery.
dateRange: "2026"
location: Independent
order: 102
technologies: [Three.js, WebGL, GLSL, JavaScript, Vite]
achievements:
  - "**Direct manipulation** — Drop, paste, or upload a screenshot, drag to orbit, scroll to zoom, and start from twelve composition presets"
  - "**Obsessive device models** — iPhone, iPad, MacBook, and browser-frame assemblies with layered bezels, camera lenses, ports, hinges, and instanced keyboards in physical metal and glass"
  - "**A real studio, in shaders** — GLSL gives the wall a physical bow, restrained grain, and edge falloff; a curved cyclorama catches the device's actual projected shadow"
  - "**Production export** — Exact pixel dimensions, PNG/JPG/WebP, transparent canvas, and export-time restoration of full shadow quality"
externalUrl: https://github.com/peritissimus/turntable
outcome: "Turntable compresses a product-photography workflow into a playful browser tool: compose, light, rotate, and export without opening a 3D package."
---

Every product screenshot eventually needs to become a product *image* — the hero shot for a landing page, an App Store frame, a launch tweet. The usual route runs through Blender or a mockup subscription. Turntable's pitch is that the whole workflow fits in a browser tab: drop in a screenshot, spin the device, light the scene, export a high-res PNG.

**The devices are built, not faked.** The iPhone Pro, iPad Pro, and MacBook Pro are full Three.js assemblies — layered bezels, camera arrays, buttons, ports, speaker grilles, a hinged lid with instanced keys — dressed in physical metal and glass materials, lit by area emitters and an environment map. When the device turns, highlights sweep across the titanium the way they should.

**The studio is engineered like a set.** A GLSL-augmented backdrop gives the receiving wall a subtle physical bow, restrained grain, and edge falloff; a second shader adds distance-aware contact density under the device; a curved cyclorama catches the real projected shadow with no wall-to-floor seam. Three generated studio plates — Alabaster, Midnight, Terracotta — sit alongside procedural presets, mirror floors, and transparent backdrops.

**It stays fast where it matters.** Rendering is demand-driven — the scene sleeps until you touch it — with capped preview density and a lightweight live shadow pass keeping manipulation responsive. Exports temporarily restore full shadow quality, then hand back the interactive preview.

**It behaves like an editor, not a demo.** One serializable state tree drives the whole app, with undo/redo (⌘Z all the way back), debounced settings persistence, and IndexedDB-backed restoration of your uploaded artwork across refreshes. No UI framework, no build complexity — vanilla JavaScript and Vite.
