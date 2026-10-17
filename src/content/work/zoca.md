---
title: Zoca
updated: 2026-10-17
company: Zoca
role: Sr Software Engineer / IC
description: "LLM application development at Zoca: content generation for 1,000+ businesses, AI website workflows, and queue-backed TypeScript services."
seoTitle: "Zoca – LLM Application Development & AI Workflows"
dateRange: November 2024 – Present
location: Bengaluru
order: 1
technologies: [TypeScript, NestJS, Terraform, AWS, Message Queues, LLM Integration, Web Scraping, LocalStack]
achievements:
  - "**Content Generation System** — Built automated social media post generation powering 1,000+ businesses, enhancing digital presence and engagement"
  - "**AI Website Builder** — Designed config-driven website generation system with contextual data scraping and AI integration for automatic modifications"
  - "**Infrastructure Migration** — Migrated to Terraform and optimized build pipelines, reducing deployment time from 1.5 minutes to 1-4 seconds"
  - "**Intelligent Web Crawlers** — Built automated web crawlers using LLM-driven automation for intelligent data scraping"
  - "**Development Standards** — Established guidelines and code review standards, significantly improving PR review cycles and team productivity"
  - "**Message Queue Architecture** — Introduced message queue + worker architecture enabling seamless feature deployments and improved scalability"
  - "**Raft Internal Tools** — Created comprehensive suite of internal tools reducing developer overhead (website management, Google Business Profile, voice agents, content generation)"
  - "**LocalStack Environment** — Set up LocalStack with custom UI for local AWS simulation, enabling independent development workflows"
  - "**TypeScript Migration** — Led TypeScript adoption across entire codebase, improving code quality and developer experience"
ogImage: /og/work/zoca.png
externalUrl: https://zoca.in
stats:
  - value: "1,000+"
    label: "Businesses Powered"
  - value: "99%"
    label: "Deployment Time Reduction"
  - value: "Multiple"
    label: "0-to-1 Products"
---

I build LLM application workflows for local businesses at Zoca. My work includes an automated social content system serving 1,000+ businesses and a configuration-driven website builder with contextual data scraping and AI-assisted modifications.

An important part of that work is deciding where generation belongs in the backend. I introduced a message queue and worker architecture that separates long-running AI workflows from user-facing requests. The NestJS API creates a job, while workers own its execution and persist its status. That boundary gives generation a lifecycle beyond a single HTTP request.

Alongside the product work, I migrated infrastructure to Terraform, improved build pipelines, and set up LocalStack for local AWS development. The infrastructure and build changes cut deployment time from 1.5 minutes to 1–4 seconds. I explain the reasoning around context selection, job ownership, and useful product outcomes in [Scaling LLM Applications](/blog/scaling-llm-applications).
