---
updated: 2026-11-12
seoTitle: Tabbit – Personal AI New Tab and Chrome Tab Organizer
title: Tabbit
company: Tabbit
kind: personal
role: Designer & Engineer
description: A personal Chrome new tab with work shortcuts, dev servers, an AI brief, a discovery feed, and native tab organization.
dateRange: '2026'
sortDate: 2026-10-13
location: Independent
order: 104
technologies: [JavaScript, Chrome Extensions, Manifest V3, OpenAI API, Codex CLI, Claude Code]
achievements:
  - '**Dashboard** — Work shortcuts, development servers, a brief, and a discovery feed'
  - '**AI access** — OpenAI API or a signed-in Codex or Claude CLI through a local native host'
  - '**Background work** — Saved build progress and results, with recovery for interrupted jobs'
  - '**Tab groups** — Current-window organization using Chrome groups, preserving pinned tabs'
screenshot:
  src: '/project-screenshots/tabbit-newtab.jpg'
  alt: 'Tabbit new-tab preview with search, pill-shaped Organize tabs and Settings controls, work shortcuts, dev servers, a compact brief, and a discovery feed'
  caption: 'The new tab brings daily work within reach. This preview uses illustrative data, not a live browsing history or current news feed.'
  width: 1280
  height: 1300
externalUrl: https://github.com/peritissimus/tabbit
---

Tabbit started as a way to organize a crowded Chrome tab bar. It grew into the page I wanted between tasks: work links, running development servers, a short brief, and a few relevant articles and product releases.

## Opening a new tab

Shortcuts and development servers sit near the top. Search can find an open tab or a recent page, or continue to web search. The brief expands when I want to read more, while saved sessions and secondary lists stay out of the way.

## Building the brief and feed

Recent browsing, a watchlist, and feedback help select sources. The model reads source text and receives candidate links to use in its output. Items are ranked by recency and estimated practical impact. Thumbs-up and thumbs-down feedback guide later editions.

The feed depends on the pages it can read. Those pages can be incomplete, and the ranking reflects a model's judgment. I use it as a shortlist of things to open and examine.

Generation runs in the extension's background worker, with progress and results saved locally. Closing a new tab does not discard its saved build state. Another new tab can show the same progress or completed edition, and interrupted work has recovery rules.

## Choosing an AI provider

Tabbit supports the OpenAI API or a signed-in Codex or Claude command-line tool. Separate model settings control selection and writing. CLI access requires a one-time local native-host installation and uses the tool's existing login and plan limits.

## Organizing tabs

The Organize tabs button works on the current window and creates Chrome's own groups, leaving pinned tabs alone. It uses the configured AI provider or local grouping when AI is not configured. The job rechecks tabs before applying groups, prevents duplicate runs, and shows errors that can be retried. The popup also has cleanup, deduplication, and saved sessions.

Settings and cached results stay in Chrome's local extension storage. AI grouping sends tab titles and trimmed URLs to the chosen provider. Brief and feed generation can also send browsing context, feedback, and selected page text, including private content from signed-in pages. There is no Tabbit account or hosted Tabbit backend.

The extension uses plain Manifest V3 JavaScript. I wrote about its motivation in [Why I Upgraded the Screen I Visit Most After the Terminal](/blog/new-tab-productivity).
