---
title: Blueprint
company: Blueprint
kind: personal
role: Designer & Engineer
description: A 2.5D floor-plan maker for furnishing my flat, with daylight that follows the real sun over Bengaluru.
seoTitle: 'Blueprint – 2.5D Floor-Plan Maker with Real Daylight'
dateRange: 'October 2026'
sortDate: 2026-10-13
location: Independent
order: 114
technologies: [Three.js, WebGL, GLSL, JavaScript, Vite]
achievements:
  - '**Editing** — Furniture, walls, doors, and windows with undo and browser-local saves'
  - '**Lighting** — Solar positioning and a floor light map that approximates reflected light'
  - '**Views** — Cutaway, flat plan, and eye-level views in illustrated or technical styles'
screenshot:
  src: '/project-screenshots/blueprint.webp'
  alt: 'Blueprint floor-plan editor showing a furnished three-bedroom flat in a 2.5D cutaway view beside a furniture catalogue'
  caption: 'The flat in its 2.5D cutaway: furniture catalogue on the left, wall, door, and window tools along the top.'
  width: 1280
  height: 720
externalUrl: https://blueprint-psi-ten.vercel.app/
updated: 2026-11-12
---

I had a three-bedroom flat in Bengaluru to furnish and a brochure floor plan to work from. I wanted to move furniture around at its actual dimensions and see where daylight would fall before buying or moving anything. Blueprint is a browser model of that flat.

It opens with my walls, doors, and windows already drawn. Furniture sizes use feet and inches, matching the listings I was reading. The layout saves in the browser without an account.

## Rearranging the rooms

I can click or drag a catalogue piece into the plan, then move, turn, resize, or refinish it. Separate tools edit walls, doors, and windows. Undo covers those changes, and browse mode locks editing when I want to look around or show the plan to someone else.

## Following the daylight

The sun's position is calculated from Bengaluru's latitude, the time of day, and the season. Direct light enters through windows, glass doors, and the balcony opening.

The renderer combines sunlight and sky light in a light map on the floor, then uses sunlit surfaces to approximate reflected light inside the rooms. This helps distinguish a room with a small window from one with a wide opening. It is a visual model for comparing arrangements, rather than a measured prediction of indoor brightness.

## Changing the view

A 2.5D cutaway shows the whole flat, a flat plan helps with dimensions, and an eye-level view lets me look from a doorway. An illustrated style is the default; a technical style emphasizes the drawing and measurements.

The app uses JavaScript, Three.js, and Vite. Three.js is pinned to one release because the shadow shader patch and lighting setup depend on it. The scope stays close to the question I started with: where should the furniture go, and what happens to the light?
