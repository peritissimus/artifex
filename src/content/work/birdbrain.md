---
updated: 2026-10-12
title: Birdbrain
company: Birdbrain
kind: personal
role: Designer & Engineer
description: A private Twitter/X bookmark archive with AI summaries, topic classification, search, and automatic hydration.
seoTitle: 'Birdbrain – Local X Bookmark Archive with AI Summaries'
dateRange: '2026'
sortDate: 2026-01-21
location: Independent
order: 103
technologies: [SvelteKit, TypeScript, Python, FastAPI, SQLite, Celery, Redis, Groq]
achievements:
  - "**Zero-effort capture** — A browser extension intercepts X's own GraphQL responses as you scroll, so bookmarking works exactly as it always did"
  - '**AI organization** — A Celery pipeline classifies every bookmark into topics and writes a concise summary using Llama on Groq'
  - '**Smart hydration** — Detects truncated tweets and missing quotes, then repairs them automatically the next time the full thread is on screen'
  - '**Local archive** — SQLite stores posts and generated summaries; text search covers posts, authors, and summaries, with separate topic filters'
externalUrl: https://github.com/peritissimus/birdbrain
outcome: 'Birdbrain turns an unsearchable bookmark pile into a private, progressively organized knowledge archive — one that gets more complete the more you use X, not less.'
---

A saved post is only useful if I can find it again. I wanted an archive outside X, with my own search interface and organization. Birdbrain treats that pile as what it actually is — a personal knowledge source — and quietly moves it somewhere it can be owned, searched, and understood.

**It began with my own bookmark debt.** I had saved useful technical threads, references, and half-formed ideas for years, but returning to one depended on remembering the author or the exact phrasing. The collection was valuable in theory and nearly unusable in practice. Birdbrain came from wanting the archive to organize itself without asking me to change how I browse.

**Why it is personal software.** It watches the bookmarking action I already use, stores the result in a database I control, and improves the archive in the background. There is no shared feed or publishing layer to maintain. The product is successful when an old idea returns at the moment I need it.

**Capture follows browsing.** A browser extension listens to X's own GraphQL responses while you browse and lifts bookmark data straight out of the stream. There is no separate "save to Birdbrain" button or manual link copying. Capture depends on the bookmark responses X loads while you browse. You bookmark the way you always did; the archive builds itself.

**A pipeline does the librarian work.** Every captured post flows through a Celery + Redis background pipeline where Llama (via Groq) assigns topic labels and writes a one-line summary. The archive ends up browsable two ways at once: by topic, with live counts, or through text matching across the post, author, and AI summary. This is SQL text search, not semantic retrieval.

**It heals its own gaps.** Tweets arrive truncated; quoted posts go missing. Birdbrain notices incomplete records and hydrates them automatically the next time the full thread crosses your screen — the archive gets more complete the more you browse, without you doing anything.

**It stays yours.** Everything lands in a local SQLite file behind a SvelteKit interface styled like Twitter's own dark theme, so the archive feels like home instead of an admin panel. Classification status is visible per bookmark, pending items can be re-run in one click, and classification sends the author handle and post text to Groq. Storage is local; AI enrichment is hosted. The API is a development service without user authentication, not a hardened public deployment.

Read the [Birdbrain engineering case study](/blog/searchable-x-bookmark-archive) for the capture flow, current search implementation, and the boundary between local storage and hosted AI.
