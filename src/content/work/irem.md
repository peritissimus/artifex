---
title: IREM
company: IREM
kind: personal
role: Preservation Engineer
description: A modern restoration of the I Remember WebGL memory archive, rebuilt with ES modules and current tooling.
dateRange: '2026'
sortDate: 2026-04-26
location: Independent
order: 110
technologies: [JavaScript, Three.js, WebGL, GSAP, Vite, Playwright]
achievements:
  - '**Preserved interaction model** — Restores the navigable particle field, memory posts, search, and contribution flow'
  - '**Modern module graph** — Migrates a legacy browser application to ES modules with explicit controllers and shared primitives'
  - '**Regression coverage** — Adds build verification and Playwright smoke tests around the recovered experience'
externalUrl: https://github.com/peritissimus/irem
outcome: 'IREM preserves a meaningful piece of interactive-web history while making its code understandable and runnable with modern browsers and tooling.'
---

IREM is a restoration of _I Remember_, an interactive WebGL archive created to collect memories and raise awareness of Alzheimer's disease. The original experience placed contributed photographs and stories inside a navigable field of particles that gradually faded without new memories.

The restoration keeps that emotional interaction intact while replacing the legacy loading and module system with an explicit ES-module architecture. Rendering, input, sound, navigation, search, posting, and tutorial behavior are separated into focused controllers.

Build checks validate the module graph and entry points, while Playwright snapshots protect the recovered loading and contribution flows. The goal is preservation through maintainability: the experience should remain runnable, inspectable, and testable rather than survive only as archived assets.
