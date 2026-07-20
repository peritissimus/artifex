---
title: Birdbrain
company: Birdbrain
kind: personal
role: Designer & Engineer
description: A private Twitter/X bookmark archive with AI summaries, topic classification, search, and automatic hydration.
dateRange: "2026"
sortDate: 2026-01-21
location: Independent
order: 103
technologies: [SvelteKit, TypeScript, Python, FastAPI, SQLite, Celery, Redis, Groq]
achievements:
  - "**Zero-effort capture** — A browser extension intercepts X's own GraphQL responses as you scroll, so bookmarking works exactly as it always did"
  - "**AI organization** — A Celery pipeline classifies every bookmark into topics and writes a concise summary using Llama on Groq"
  - "**Smart hydration** — Detects truncated tweets and missing quotes, then repairs them automatically the next time the full thread is on screen"
  - "**Private by architecture** — The archive is a local SQLite file with full-text search across posts, authors, topics, and summaries"
externalUrl: https://github.com/peritissimus/birdbrain
outcome: "Birdbrain turns an unsearchable bookmark pile into a private, progressively organized knowledge archive — one that gets more complete the more you use X, not less."
---

Twitter bookmarks are where good ideas go to disappear: no search worth using, no organization, no export, and a platform that can take the pile away at any moment. Birdbrain treats that pile as what it actually is — a personal knowledge source — and quietly moves it somewhere it can be owned, searched, and understood.

**Capture costs nothing.** A browser extension listens to X's own GraphQL responses while you browse and lifts bookmark data straight out of the stream. There is no "save to Birdbrain" button, no copy-pasting links, no API keys rate-limiting your own data back to you. You bookmark the way you always did; the archive builds itself.

**A pipeline does the librarian work.** Every captured post flows through a Celery + Redis background pipeline where Llama (via Groq) assigns topic labels and writes a one-line summary. The archive ends up browsable two ways at once: by topic, with live counts, or by meaning, through full-text search that covers the tweet, the author, and the AI summary.

**It heals its own gaps.** Tweets arrive truncated; quoted posts go missing. Birdbrain notices incomplete records and hydrates them automatically the next time the full thread crosses your screen — the archive gets more complete the more you browse, without you doing anything.

**It stays yours.** Everything lands in a local SQLite file behind a SvelteKit interface styled like Twitter's own dark theme, so the archive feels like home instead of an admin panel. Classification status is visible per bookmark, pending items can be re-run in one click, and nothing about your reading habits leaves your machine except the text sent for classification.
