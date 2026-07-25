---
title: IREM
company: IREM
kind: personal
role: Preservation Engineer
description: A working restoration of the I Remember WebGL memory archive, recovered from an archived site and rebuilt for modern browsers.
dateRange: '2026'
sortDate: 2026-04-26
location: Independent
order: 110
technologies: [JavaScript, Three.js, WebGL, GSAP, Vite, Playwright]
achievements:
  - '**Preserved interaction model** — Restores the navigable particle field, memory posts, search, and contribution flow'
  - '**Self-contained archive runtime** — Replays the recovered memory dataset and retired JSONP endpoints locally instead of depending on vanished services'
  - '**Modern module graph** — Migrates the browser application to ES modules with explicit controllers and shared primitives'
  - '**Regression coverage** — Verifies the dependency graph, HTML entry points, boot sequence, search overlay, and contribution flow'
externalUrl: https://github.com/peritissimus/irem
outcome: 'IREM preserves a meaningful piece of interactive-web history while making its code understandable and runnable with modern browsers and tooling.'
---

Most archived websites preserve a picture of an interface, not the experience itself. _I Remember_ depended on WebGL, animation, remote APIs, uploaded photographs, and a multi-step contribution flow. Saving the HTML was never going to be enough. IREM restores the piece as working software.

**The experience was worth recovering.** _I Remember_ collected photographs and stories to raise awareness of Alzheimer's disease. It placed those memories inside a navigable field of particles that faded when the archive stopped receiving new contributions. The metaphor lived in the motion, sound, and interaction, so a screenshot or video could not preserve what made it meaningful.

**The archive had to become its own backend.** The original application expected JSONP endpoints, uploaded media, and social APIs that no longer exist. IREM extracts the recovered post data into a local dataset, maps archived media into the application, and answers legacy search and post requests through a small in-browser archive runtime. Search remains useful, old memories still open, and the contribution path can explain that new submissions are unavailable instead of failing silently.

**Modernization stops at the behavior boundary.** The old loading and module system has been replaced with explicit ES modules, but the visual quirks and timing that define the piece remain. Rendering, input, sound, navigation, search, posting, and tutorial behavior live in focused controllers. Three.js, GSAP, and Vite make the code understandable to a modern browser without redesigning the work into something it was never meant to be.

**Preservation needs regression tests.** Static checks validate the module graph and HTML entry points before a build. Playwright then boots the recovered application and exercises the interactions most likely to break: opening the contribution path, revealing search, and navigating the archived shell. Screenshots protect the visual state as the restoration changes.

This is personal software in a different sense from a daily utility. I wanted a piece of interactive-web history to remain explorable, not merely documented. The maintenance work is therefore part of the preservation: if the project can still be run, inspected, and tested, it has a better chance of surviving the next browser generation.
