---
title: Fitroom
company: Fitroom
kind: personal
role: Designer & Engineer
description: An AI couple try-on studio that renders two people in chosen outfits as a single true-to-height portrait.
dateRange: '2026'
sortDate: 2026-07-07
location: Independent
order: 106
technologies: [Next.js, React, TypeScript, Tailwind CSS, OpenAI Images, Gemini]
achievements:
  - '**Couple composer** — Pairs a person and an outfit for each partner and renders both in one photorealistic side-by-side portrait'
  - '**True relative height** — Uses each person''s saved height to scale partners correctly, so a 6''0" and a 5''0" partner read the way they do in life'
  - "**Garment isolation** — Pre-processes every outfit down to the garment alone, so an outfit model's face or physique can never leak into a render"
  - '**Model picker with job queue** — Switches per render between OpenAI and Gemini image models, with generation running as polled background jobs'
screenshot:
  src: '/project-screenshots/fitroom.webp'
  alt: 'Fitroom private studio sign-in screen beside a full-height portrait of a couple'
  caption: 'The private entrance to the couple try-on studio, where saved people, outfits, and generated portraits stay together.'
  width: 1280
  height: 720
externalUrl: https://github.com/peritissimus/fitroom
outcome: 'Fitroom turns virtual try-on into a shared ritual: compose a couple, pick the outfits, and get one portrait that respects who they actually are.'
---

Virtual try-on tools are built for one person at a time, and they quietly lie: faces drift, bodies get idealized, and everyone comes out model-height. Fitroom starts from a different premise — that trying on outfits is something couples do together — and treats fidelity to the two real people as the entire product.

**How the idea started.** I wanted to compare outfits with my partner, but every try-on product I found treated us as two unrelated solo sessions. Even when the clothes looked plausible, the people stopped looking like us: heights converged, physiques were idealized, and details from the clothing model leaked into the result. Fitroom began as a very specific fix for that gap — put both of us, both outfits, and our real proportions into one shared image.

**Why it is personal software.** This is not a fashion marketplace or a generic avatar service. It is a private wardrobe built around people I know, clothes we are actually considering, and the small facts that make the output believable to us. I use it as a visual decision tool: save our references once, try combinations together, and keep the renders worth returning to. The model picker, persistent library, and protected deployment exist because I pay the generation cost and use the product myself.

**One pass, four references.** Both people and both outfits go into a single image-edit call, so the model works directly from the original photos instead of a lossy intermediate. That is what lets faces, skin, and body builds survive the generation. Physique preservation is asserted forcefully in the prompt: the render must show _these_ two people, not the fashion-average bodies image models default to.

**Height is data, not vibes.** Every saved person carries their real height, and the composite is scaled from it — a 6'0" partner and a 5'0" partner read correctly, side by side, the way they do in photographs. It is a small detail that decides whether the output feels like _them_ or like stock imagery.

**The wardrobe is persistent and clean.** People and outfits are saved server-side and reused across sessions, and every outfit is pre-processed down to the garment alone. That isolation step means a prominent model in a product photo can never leak their face or build into your couple's portrait.

**The plumbing respects reality.** Generation and isolation run as polled background jobs rather than long-lived requests, so nothing trips serverless timeouts, and orphaned jobs are swept up on restart. A model picker switches per render between OpenAI's gpt-image models and Google's Nano Banana family, every render is stored with its prompt and model, and the composer keeps the ritual quick: ⌘Enter to generate, draft or high-quality, cancel in flight, download as PNG.
