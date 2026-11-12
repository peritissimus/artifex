---
title: Garatch
company: Garatch
kind: personal
role: Watch-face Designer & Engineer
description: 'Garmin watch faces for exploring how to make time, activity, and other data readable at a glance.'
seoTitle: 'Garatch – Information-Dense Garmin Watch Faces'
dateRange: 2025 – Present
sortDate: 2025-06-21
location: Independent
order: 105
technologies: [Monkey C, Connect IQ, Garmin SDK, Wearable UI]
achievements:
  - '**Layouts** — Multiple Garmin watch faces with different approaches to information density'
  - '**Assets** — Custom bitmap fonts, icons, and progress segments'
  - '**Development** — Shared builds, Connect IQ simulation, and a desktop layout preview tool'
externalUrl: https://github.com/peritissimus/garatch
updated: 2026-11-12
---

I wanted a Garmin watch face with more useful data, but I still needed to read it during a walk. Garatch is a collection of faces I built to explore that balance: how much can fit on the display before the time or heart rate becomes hard to find?

Wearing a face gives me feedback that a mockup cannot. If a number takes too long to find, I change its position or size. If an always-on display is too bright at night, I revisit the colors.

## Different layouts for the same data

Sixdash puts six rows and segmented goal bars beneath a large time display. Orbit arranges metrics in rings. Blueprint uses a technical-drawing style, Telemetry resembles an instrument panel, and Atelier focuses on typography. Each is a different way to arrange time, activity, battery, and other readings.

## Working within the watch's limits

Small displays, limited memory, and always-on behavior affect the layout and rendering. Custom bitmap fonts, icons, and progress segments let me tune the result at the device's actual resolution. Layouts adapt to supported round and rectangular displays.

The faces use Monkey C and Garmin's Connect IQ SDK. A shared Makefile builds a selected face for a supported device and opens the simulator. Annotated layout drawings and a desktop designer companion let me check compositions before compiling them for the watch.
