---
title: Garatch
company: Garatch
kind: personal
role: Watch-face Designer & Engineer
description: A collection of information-dense Garmin watch faces exploring typography, glanceability, and wearable data.
dateRange: 2025 - Present
sortDate: 2025-06-21
location: Independent
order: 105
technologies: [Monkey C, Connect IQ, Garmin SDK, Wearable UI]
achievements:
  - "**Twelve design theses** — minimal, orbit, blueprint, telemetry, atelier, cosmic, analog, sixdash, metrics, and instrument-grid each argue a different answer to the same question"
  - "**Glanceable density** — Time, steps, heart rate, calories, battery, temperature, and goal progress arranged so one glance is enough"
  - "**Device-aware layouts** — Information hierarchy adapts across round and rectangular Garmin displays instead of letterboxing one design"
  - "**Purpose-built assets and tooling** — Custom bitmap type, icons, and progress segments, plus a monorepo that builds and simulates any face on any device with one command"
externalUrl: https://github.com/peritissimus/garatch
outcome: "Garatch is an ongoing laboratory for designing useful interfaces at wrist scale, where every pixel, every milliwatt, and every glance matters."
---

A watch face is the hardest interface brief there is: a canvas a few centimeters wide, read in under a second, on a battery budget measured in milliwatts. Garatch takes that brief seriously and answers it twelve different ways — a collection of Garmin faces that each test how much information a wrist can carry before it stops feeling calm.

**Each face is a thesis.** *Sixdash* stacks six data rows with segmented goal bars over an oversized time display. *Orbit* puts your metrics in planetary rings. *Blueprint* renders the day as a technical drawing; *telemetry* as an instrument panel; *atelier* as a type specimen; *cosmic* and *analog* push toward ornament and tradition. The collection is the point — the same data, re-argued through typography, measurement, and hierarchy until the trade-offs are visible.

**The constraints are the craft.** Low-power wearable displays punish laziness: burn-in rules out static brightness, memory budgets rule out lazy rendering, and 1 Hz second hands have to be earned. Garatch faces use purpose-built bitmap type, custom icons, and hand-tuned progress segments instead of scaled-down phone UI, and each face adapts its hierarchy to round and rectangular Garmin displays rather than letterboxing one layout everywhere.

**The tooling is half the project.** A monorepo Makefile builds any face for any supported device and launches it in the Connect IQ simulator with one command, while annotated layout mockups pin down every coordinate before a line of Monkey C is written. A custom desktop designer companion previews compositions at device resolution, keeping the design loop out of the compile loop.
