---
title: "Stone: A Local-First Markdown Note-Taking App for Mac"
date: 2026-09-08
updated: 2026-10-05
author: Kushal Patankar
category: Product
tags: [Stone, Note-Taking, Local-First, Markdown, Personal Knowledge Management]
description: Stone is a free, open-source note-taking app for Mac that keeps notes, journals, tasks, and meeting transcripts as plain Markdown files on your own disk. Here is what it does and who it is for.
readTime: 7 min read
---

Stone is a note-taking app I have been building for myself since October 2025. It runs on macOS, it is open source under the MIT license, and it stores everything you write as plain Markdown files in a folder you choose.

That last part is the reason it exists. I wanted a notes app where the smart features — search by meaning, meeting transcripts, a view of my day — did not require handing my notes to someone else's server.

This post is the plain description: what Stone is, what it does today, and where it is the wrong tool.

## What Stone is, in one paragraph

Stone is a desktop workspace for notes, daily journals, tasks, and meeting records. Your workspace is a normal folder of `.md` files. Stone adds a fast editor, full-text and semantic search, on-device meeting transcription, and Git sync on top of that folder. There is no account to create, no Stone cloud, and no telemetry.

You can [download the latest build from GitHub](https://github.com/peritissimus/stone-electron/releases/latest) or read the [project page](/work/stone).

## Why I built another note-taking app

My working context was spread across four places. Notes lived in Markdown. Meetings turned into recordings I never replayed, or details I forgot by evening. The next thing to do was split between mail, calendar, and a task list.

I did not want a fifth place to feed. I wanted the files I already trusted to remember more, and I wanted the day's context to show up in one view.

Most tools made me pick a side. The connected, intelligent ones keep your notes on their servers. The plain-file ones leave the files dumb. Stone is my attempt to get both: files I own, with the intelligence computed on my own machine.

## Your notes are plain Markdown files

Notes, journals, and meeting records are Markdown files on disk. You can open them in any editor, search them with `grep`, and commit them to Git.

Stone does use a SQLite database, but only for metadata and search indexes. The files are the source of truth. If the database is lost, Stone rebuilds it from the folder. I wrote about that design in more detail in [Markdown files as the source of truth](/blog/markdown-notes-sqlite-search-index).

The practical result is that there is no export feature, because there is nothing to export from. If you stop using Stone tomorrow, your notes are exactly where they were.

## Six places, one command palette

Stone is organized around six views:

- **Today** — the current journal, meetings, open tasks, recent edits, and what you wrote on this day in earlier years.
- **Journals** — one note per day. Journals are a first-class surface, not a plugin.
- **Tasks** — every task from every note, collected in one list.
- **Knowledge** — your notes clustered into topics, so you can see what you actually write about.
- **Graph** — how your notes link to each other.
- **Meetings** — recordings, transcripts, and summaries.

`Cmd+K` opens a command palette that jumps to any view, any note, or any action.

Tasks deserve a note. Stone supports more states than done and not done: `TODO`, `DOING`, `DONE`, `WAITING`, `HOLD`, `CANCELED`, and `IDEA`. Real work spends a lot of time in "waiting on someone," and a checkbox cannot say that.

## Meeting notes that never leave your Mac

Stone records a meeting, transcribes it on your machine, and files the transcript and a summary as a searchable meeting record.

On macOS it captures two tracks: your microphone and the system audio. They are transcribed separately and merged into one transcript labelled "You" and "Others." Because speaker audio leaks into the mic when you are not wearing headphones, Stone runs acoustic echo cancellation on the mic track first.

Transcription uses Whisper `large-v3-turbo` through whisper.cpp. The model is downloaded once, then everything runs offline. You decide what happens to the audio: keep it, delete it right after transcription, or delete it automatically after a number of days. The default is 30. The transcript and summary are always kept.

The engineering behind this was the hardest part of the app. The full write-up is in [Local meeting transcription on a Mac with whisper.cpp](/blog/local-meeting-transcription-whisper-cpp).

## Search that finds what you meant

Stone has two kinds of search and uses both at once.

Full-text search finds the exact phrase. Semantic search finds notes that are about the same thing even when they share no words. Results from both are merged and then re-scored by a small reranking model. All three steps run locally.

Next to each note, a related-notes panel suggests other notes worth reading. It combines meaning, shared tags, shared links, and word overlap, so a note linked from the same hub as the one you are reading can surface even when the wording differs.

## Where AI fits, and where it does not

Embeddings, reranking, and transcription run on your machine. They need no API key and send nothing anywhere.

Text generation is different. Features that write prose — meeting summaries, the Ask Notes question-answering view, status reports, link suggestions — need a language model. You can point Stone at OpenAI, Azure OpenAI, Google, or Groq, or at any OpenAI-compatible endpoint, including one you host yourself.

Cloud inference is off by default. Note content does not leave your machine unless you turn it on. Everything else in the app works without it.

## Who Stone is for

Stone fits you if:

- You are a developer or technical lead who wants project notes, decisions, and meeting context in plain text.
- You keep a daily work journal and need to recover context from weeks ago.
- You like Obsidian or Logseq, and you want journals, meetings, and tasks built in instead of assembled from plugins.

## Who should use something else

Stone is the wrong tool if you need any of these:

- **Real-time collaboration.** There is no multiplayer editing.
- **A mobile app.** There is none. A small web capture page exists for sending a thought from your phone to a self-hosted Stone server, but it is not a mobile client.
- **A hosted team wiki.** Stone is personal software.
- **Windows or Linux today.** Packaging targets exist in the project, but only macOS builds are published and tested.

One more caveat: Stone is not notarized by Apple yet, so macOS blocks it on first launch. The README explains the one-time step to open it.

## How to install Stone

1. Download the DMG from the [latest release](https://github.com/peritissimus/stone-electron/releases/latest).
2. Drag Stone into Applications.
3. Right-click Stone, choose Open, then Open again.
4. Pick a folder for your workspace. An existing folder of Markdown notes works.

## Frequently asked questions about Stone

### Is Stone free?

Yes. Stone is open source under the MIT license, and there is no paid tier. The source is at [github.com/peritissimus/stone-electron](https://github.com/peritissimus/stone-electron).

### Does Stone work offline?

Yes. Notes, search, journals, tasks, and meeting transcription all work offline. The transcription and embedding models are downloaded once on first use. Only the optional text-generation features need a network connection, and only if you point them at a cloud provider.

### Where does Stone store my notes?

In the folder you choose as your workspace, as Markdown files. Search indexes and metadata live in a local SQLite database that can be rebuilt from those files.

### How is Stone different from Obsidian?

Both keep notes as local Markdown files. Stone is narrower and more opinionated: daily journals, cross-note tasks, meeting recording with on-device transcription, and semantic search are built in rather than added through plugins. Obsidian has a much larger plugin ecosystem and mobile apps, and Stone has neither. There is a longer comparison in [Stone vs Obsidian vs Granola](/blog/stone-vs-obsidian-vs-granola).

### Can I sync Stone between computers?

Stone has Git built in: you can initialize a repository, commit, pull, and push from inside the app. Because the workspace is a plain folder, any file-sync service works too.

### Does Stone send my notes to an AI company?

Not unless you ask it to. Search, embeddings, and transcription run locally. Summaries and Ask Notes use a language model you configure, and that setting is off by default.

Stone is at version 0.8 and I use it every working day. If you try it and something breaks, [open an issue](https://github.com/peritissimus/stone-electron/issues) — that is how most of the last few hundred commits started.
