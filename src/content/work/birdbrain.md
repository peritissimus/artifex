---
updated: 2026-11-12
title: Birdbrain
company: Birdbrain
kind: personal
role: Designer & Engineer
description: 'A local Twitter/X bookmark archive with text search, topic labels, and AI summaries through Groq.'
seoTitle: 'Birdbrain – Local X Bookmark Archive with AI Summaries'
dateRange: '2026'
sortDate: 2026-01-21
location: Independent
order: 103
technologies: [SvelteKit, TypeScript, Python, FastAPI, SQLite, Celery, Redis, Groq]
achievements:
  - '**Capture** — Reads bookmark data from X responses observed by the browser extension'
  - '**Enrichment** — Celery and Redis queue topic classification and summaries through Groq'
  - '**Storage and search** — Local SQLite with SQL text matching and topic filters'
externalUrl: https://github.com/peritissimus/birdbrain
---

I had years of saved X posts and no useful way to find an old one. I could remember the subject of a thread without remembering its author or exact wording. Birdbrain gives those bookmarks a local archive with search, topic labels, and short summaries.

## Capturing bookmarks

A browser extension reads the bookmark responses X loads while I browse. I keep using X's bookmark button; there is no separate save action. The archive only receives records present in those responses, so opening the extension does not import every bookmark automatically.

## Adding topics and summaries

A background worker uses Llama through Groq to classify captured posts and write a one-line summary. Celery and Redis manage that work separately from the interface. Pending or failed classifications stay visible and can be run again.

Search matches text across posts, authors, and summaries, with topic filters alongside it. The generated summaries add useful words to search for. Retrieval itself is SQL text matching, rather than semantic search.

## Filling in missing content

Bookmark responses sometimes contain shortened posts or omit a quoted post. Birdbrain marks those gaps and updates the record if the extension later sees the full content. It cannot recover content the browser never receives, and storing a media URL does not preserve the media file.

Records live in local SQLite, with a SvelteKit interface for browsing them. Classification sends the author's handle and post text to Groq, so local storage and hosted AI are separate parts of the system. The API is a development service without user authentication and is intended to run locally.

The [Birdbrain engineering case study](/blog/searchable-x-bookmark-archive) covers capture, search, and the boundary between local storage and hosted AI in more detail.
