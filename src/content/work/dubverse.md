---
title: Dubverse
updated: 2026-10-17
company: Dübverse
role: Founding Engineer
description: Built AI application infrastructure for Dubverse, with Celery and Redis media processing across 600K+ hours of content and 1M+ users.
seoTitle: "Dubverse – AI Application Infrastructure"
dateRange: January 2022 – April 2024
location: Gurugram, Haryana
order: 3
technologies: [NextJS, TypeScript, Django, NodeJS, Celery, Redis, PostgreSQL, Microservices, AWS, Mixpanel, Grafana, Sentry]
achievements:
  - "**Platform Development** — Led development of AI video dubbing platform scaling to 600K+ hours of processed content across 1M+ users"
  - "**Core Features** — Designed and developed creation flows, project management, and editing studio in NextJS, TypeScript and Django/NodeJS achieving 4x increase in per-user project creation"
  - "**Microservices Architecture** — Architected microservices infrastructure enabling 3x faster feature deployments while maintaining 99.9% uptime"
  - "**Distributed Processing** — Engineered distributed processing system with Celery and Redis reducing content generation time by 50%, processing 2K hours of daily content"
  - "**Product Expansion** — Built subtitle generation, document TTS, and TTS API service, driving 40%+ B2B growth and market expansion"
  - "**Analytics & Monitoring** — Built comprehensive stack using Mixpanel, Metabase, Grafana, and Sentry, achieving 80% faster bug resolution and optimized conversions"
  - "**Infrastructure Optimization** — Optimized AWS infrastructure for on-demand scaling"
ogImage: /og/work/dubverse.png
externalUrl: https://dubverse.ai
stats:
  - value: "1M+"
    label: "Users"
  - value: "600K+"
    label: "Hours Processed"
  - value: "4x"
    label: "Project Creation Increase"
  - value: "50%"
    label: "Faster Processing"
  - value: "40%+"
    label: "B2B Growth"
  - value: "99.9%"
    label: "Uptime"
---

I led development of Dubverse’s AI video dubbing platform, from the creation and editing flows in Next.js to the Django and Node.js services behind them. The product grew to serve 1M+ users and process 600K+ hours of content. My work connected the tools people used to create a project with the application infrastructure that produced the result.

I built distributed media processing with Celery and Redis for a workload of 2K hours of content a day. The pipeline changes reduced content generation time by 50%. Separating stages and resuming failed jobs from the affected stage reduced waiting and repeated work across the pipeline.

I also worked on AWS scaling and the monitoring stack, using Mixpanel, Metabase, Grafana, and Sentry to understand product behavior and application failures. [Processing 2,000 Hours of Media a Day with Celery and Redis](/blog/celery-redis-media-pipeline) explains the queue boundaries, durable job state, and worker recovery decisions behind that processing work.
