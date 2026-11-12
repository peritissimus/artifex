---
updated: 2026-11-12
title: Fitroom
company: Fitroom
kind: personal
role: Designer & Engineer
description: 'An AI try-on studio for comparing two people in chosen outfits, using reference photos and saved heights.'
seoTitle: 'Fitroom – AI Couple Outfit Try-On Studio'
dateRange: '2026'
sortDate: 2026-07-07
location: Independent
order: 106
technologies: [Next.js, React, TypeScript, Tailwind CSS, OpenAI Images, Gemini]
achievements:
  - '**Inputs** — Two person photos, two outfit images, and saved height information'
  - '**Preparation** — Garment isolation reduces the influence of the clothing model'
  - '**Generation** — OpenAI or Gemini image models, with polled jobs and saved render history'
screenshot:
  src: '/project-screenshots/fitroom.webp'
  alt: 'Fitroom private studio sign-in screen beside a full-height portrait of a couple'
  caption: 'The private entrance to the couple try-on studio, where saved people, outfits, and generated portraits stay together.'
  width: 1280
  height: 720
externalUrl: https://github.com/peritissimus/fitroom
---

I wanted to compare outfits with my partner in one picture. The try-on tools I found handled one person at a time, and generated images often changed our faces, builds, or relative heights. Fitroom is a private studio for saving our references and trying clothing combinations together.

## Four references, one image

Each render uses a photo of each person and an image of each outfit. All four go into one image-edit request, so generation works from the original references. The prompt separates who the people are from what they should wear.

Before rendering, an outfit image goes through a garment-isolation step to reduce the influence of the person modeling the clothes. People and outfits are saved server-side, so I can reuse them across sessions.

## Giving the model proportions

A saved person includes their height. Fitroom calculates the height difference and includes it in the prompt: for example, one partner should appear about 20% taller than the other. It also asks the model to preserve faces and body builds. These instructions guide generation; they do not guarantee accurate proportions or identity in every result.

## Waiting for a render

Generation and garment isolation run as background jobs. The page polls for progress instead of keeping one request open throughout generation, and interrupted jobs are handled on restart. I can choose an OpenAI or Gemini image model per render, select a quality level, cancel, and download the result as a PNG. Saved renders include their prompt and model.

The studio uses Next.js, React, and TypeScript. Its library is private to the deployment. Garment isolation sends outfit photos to OpenAI, and portrait generation sends person and outfit references to the selected image provider. I use the output to compare combinations; it cannot tell me how a garment will physically fit.

Fitroom is one of the examples in [what personal software means and why I build it](/blog/what-is-personal-software).
