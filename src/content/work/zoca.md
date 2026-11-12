---
title: Zoca
updated: 2026-11-12
company: Zoca
role: Sr Software Engineer / IC
description: 'Product engineering at Zoca: the Front Desk voice agent, content and website systems, AWS infrastructure, and developer experience.'
seoTitle: 'Zoca – Voice Agents, Product Engineering & Infrastructure'
dateRange: November 2024 – Present
location: Bengaluru
order: 1
technologies:
  [
    TypeScript,
    NestJS,
    Next.js,
    Terraform,
    AWS,
    Message Queues,
    Voice Agents,
    API Emulation,
    OpenTelemetry,
    Grafana,
  ]
achievements:
  - '**Front Desk agent** — Built the end-to-end voice and messaging agent, connecting business context, booking actions, follow-ups, and handoffs'
  - '**Content and websites** — Built automated social content generation for 1,000+ businesses, contextual crawlers, and a configuration-driven website builder'
  - '**Infrastructure as code** — Migrated AWS infrastructure to Terraform and improved deployment pipelines'
  - '**Backend architecture** — Introduced message queues and workers, then consolidated worker services around distinct workloads'
  - '**Developer experience** — Led TypeScript adoption, extended local API emulation, and built isolated branch-preview tooling'
  - '**Operations** — Built Raft internal tools and a local observability stack for inspecting application behavior'
ogImage: /og/work/zoca.png
externalUrl: https://www.zoca.com/
stats:
  - value: '1,000+'
    label: 'Businesses Using the Content System'
  - value: '1–4s'
    label: 'Deployment Time After Optimization'
---

At Zoca, I build products for local businesses and the infrastructure and tools our engineering team uses to run them. My work spans the Front Desk agent, content and website systems, backend architecture, infrastructure as code, and developer experience.

## Building the Front Desk agent

I built Zoca's [Front Desk agent](https://www.zoca.com/front-desk-agent) end to end. It handles customer conversations across voice and messaging, answers questions using the business's information, and connects those conversations to booking actions, follow-ups, and handoffs to the team.

For example, a caller asking about an appointment needs more than a generated answer. The agent needs the business's services and policies, tools to work with bookings, and a way to pass the request to a person when necessary. My work covers the orchestration around those steps as well as the conversation itself.

The workflow continues after the call. Summaries, transcripts, recordings, and follow-up tasks give the business a record of what happened and what still needs attention.

## Content and website systems

I built an automated social content system serving more than 1,000 businesses and a configuration-driven website builder. The website system combines scraped business context with AI generation and supports later modifications to the generated site.

I also built LLM-assisted crawlers to collect business context from the web for those content and website workflows.

## Infrastructure as code

I migrated AWS infrastructure to Terraform and improved the build pipelines. Infrastructure changes live in versioned code, so they can be reviewed alongside application changes.

Earlier infrastructure and pipeline improvements brought deployment time from around 1.5 minutes to 1–4 seconds.

## Backend services and background work

I introduced a message queue and worker architecture to separate long-running workflows from user-facing requests. The NestJS API creates a job, while workers execute it and persist its status. Generation can continue beyond the HTTP request that started it.

I later consolidated worker services around synchronization, content, platform, and website workloads. I also worked on structured logging and AI-request auditing to make background execution easier to inspect. [Scaling LLM Applications](/blog/scaling-llm-applications) covers the AI side of this architecture, including context selection and job ownership.

## Local development and branch previews

I initially set up LocalStack with a custom UI for local AWS development. The local setup has since moved to API emulation. I extended a fork of Vercel's Emulate for Zoca, adding provider emulation and inspection tools for AWS, voice, messaging, and website workflows.

Those tools let engineers inspect requests and simulate supported provider events locally. They reproduce selected API behavior, rather than a live carrier or a voice model.

I also built tooling for isolated branch previews. A branch can run with its application services, database, cache, and emulators in its own environment, using synthetic data. This gives a change a place to be exercised without replacing another developer's running setup.

## Developer experience and observability

I led TypeScript adoption across the codebase and established development guidelines and code review standards. That work gives the team a more consistent way to make and review changes across services.

I built a local observability setup using Grafana, Prometheus, and Tempo. Engineers can inspect traces and metrics on their own machines using the same instrumentation path as the application, rather than relying only on logs from a shared environment.

## Internal tools for operations

I built Raft, an internal tools suite for website management, Google Business Profile integrations, voice agents, content generation, and query building. It brings recurring operational workflows into an interface the team can use, reducing the work that otherwise falls back to developers.
