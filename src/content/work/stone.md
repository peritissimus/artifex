---
title: Stone
company: Stone
kind: personal
role: Designer & Engineer
description: A local-first desktop workspace that turns notes, meetings, and daily context into useful project memory.
dateRange: 2025 - Present
sortDate: 2025-10-29
location: Independent
order: 101
technologies: [Electron, TypeScript, React, SQLite, Whisper, Local AI, Apple Calendar, Apple Mail]
achievements:
  - "**Plain files you own** — Notes, journals, and meeting records are Markdown in a folder; SQLite holds only rebuildable indexes, so the workspace stays portable and Git-friendly"
  - "**On-device transcription** — Records meetings with system audio and microphone together, applies echo cancellation, and transcribes locally with Whisper — audio never leaves the machine"
  - "**Daily command center** — Brings calendar, mail, tasks, meetings, and project knowledge into a single focused Today view with an AI day summary"
  - "**Retrieval you control** — Full-text and semantic search, topic clustering, a link graph, and related-note scoring, all computed locally"
externalUrl: https://github.com/peritissimus/stone-electron
outcome: "Stone is an ongoing exploration of what a calm, private, context-aware workspace can feel like when the product owns the entire memory loop — capture, transcription, retrieval, and synthesis, all on your machine."
---

Most knowledge tools make you choose: a smart, connected workspace that lives on someone else's servers, or plain files that stay dumb. Stone refuses the trade. It is a native desktop app where the workspace is just a folder of Markdown on disk — and everything intelligent about it runs locally.

**The files are the product.** Notes, daily journals, tasks, and meeting records are plain Markdown you can open in any editor, diff in Git, or walk away with. SQLite holds only metadata and search indexes, and every index can be rebuilt from the files at any time. There is no export step because there is nothing to export from.

**The day is the unit of work.** Stone's Today view assembles the things that actually define a working day — calendar events, unread mail, open tasks, today's journal, and this morning's meetings — into one calm column, then offers to distill it into a day summary you can save back into the journal. A system-wide quick-capture window catches stray thoughts without breaking whatever you were doing.

**Meetings become memory, not homework.** Stone records system audio and microphone together with acoustic echo cancellation, transcribes on-device with Whisper, and files the result as a searchable meeting record with its own summary. The audio is yours: replay it, re-transcribe it, or set it to auto-delete on your own schedule.

**Retrieval is the payoff.** Full-text search, semantic search, topic clustering, a link graph, and related-note scoring all run on your machine, so context from three months ago resurfaces exactly when a project needs it. AI sits behind your data — optional, local-first, and never a requirement for the workspace to be useful.
