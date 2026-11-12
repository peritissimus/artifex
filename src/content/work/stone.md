---
title: Stone
company: Stone
kind: personal
role: Designer & Engineer
description: 'A free, open-source Mac app that keeps notes, journals, tasks, and meeting transcripts in plain Markdown files.'
dateRange: 2025 – Present
sortDate: 2025-10-29
updated: 2026-11-12
seoTitle: Stone – Local-First Note-Taking App for Mac
location: Independent
order: 101
technologies: [Electron, TypeScript, React, SQLite, Whisper, Local AI, Apple Calendar, Apple Mail]
achievements:
  - '**Storage** — Markdown source files with rebuildable SQLite indexes'
  - '**On-device processing** — Whisper transcription, full-text and semantic search'
  - '**Optional generation** — Prose features use a configured local or cloud language model'
externalUrl: https://github.com/peritissimus/stone-electron
---

I built Stone because my working day was scattered across notes, meetings, email, and a task list. I wanted one place to bring that context together while keeping my notes as files I could open in any editor.

Stone is a free, open-source Mac app. Notes, journals, tasks, and meeting transcripts live in a folder of Markdown files. SQLite stores metadata and search indexes that can be rebuilt from that folder. If I stop using the app, the files stay where they are.

## Starting with the day

The Today view brings together my journal, calendar, unread mail, open tasks, and meetings. A system-wide capture window lets me save a thought without switching away from what I am doing. An optional AI summary can pull the day's context into a journal entry.

## Recording a meeting

Stone captures the microphone and system audio, then transcribes them locally with Whisper. Echo cancellation reduces the speaker audio picked up by the microphone. The transcript becomes a searchable meeting record, and I can replay the recording or choose when to delete it.

## Finding an older note

Full-text search finds exact words. Semantic search looks for related meaning, which helps when I remember the subject but not the phrasing. Topic groups, a link graph, and related-note suggestions offer other ways back into the same files. Search and transcription run on the Mac after the local models are downloaded.

## Optional language models

Features that write prose, such as daily summaries, meeting summaries, and Ask Notes, need a language model. Cloud inference is off by default. Configuring a cloud provider allows those features to send relevant notes, transcripts, or Today-view context to that provider; a local endpoint is also an option. Notes, search, and transcription work without enabling cloud inference.

[What Stone is and who it is for](/blog/stone-local-first-note-taking-app) covers features and installation. I wrote about the engineering in [local meeting transcription with whisper.cpp](/blog/local-meeting-transcription-whisper-cpp) and [Markdown as the source of truth](/blog/markdown-notes-sqlite-search-index). [Stone vs Obsidian vs Granola](/blog/stone-vs-obsidian-vs-granola) compares their different approaches.
