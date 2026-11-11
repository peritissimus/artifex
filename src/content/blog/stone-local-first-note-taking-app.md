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

I have been building Stone, a note-taking app for macOS, for my own daily work since October 2025. It is open source under the MIT license and stores everything you write as plain Markdown files in a folder you choose.

Keeping everything in local files is the reason the app exists. I wanted features like semantic search, meeting transcripts, and a unified daily view, without having to hand my notes over to someone else's server.

This post covers what Stone is, what it does today, and where you are better off using a different tool.

## What Stone is, in one paragraph

Stone combines notes, daily journals, tasks, and meeting records in a normal folder of `.md` files. It adds an editor, full-text and semantic search, on-device meeting transcription, and Git sync. There is no account, Stone cloud, or telemetry.

You can [download the latest build from GitHub](https://github.com/peritissimus/stone-electron/releases/latest) or read the [project page](/work/stone).

## Why I built another note-taking app

Before building Stone, my working context was scattered across four places. Notes lived in Markdown files, while meetings turned into recordings I never replayed or details I forgot by the end of the day. Meanwhile, whatever I needed to do next was split across email, my calendar, and a separate task list.

I did not want a fifth inbox to maintain. Instead, I wanted the plain text files I already trusted to carry more weight, and I wanted my day's context pulled together into a single view.

I kept finding a choice between connected apps that held my notes on a server and plain-file editors that left more of the organization to me. I wanted files I owned, with search and transcription running on my machine.

## Your notes are plain Markdown files

Every note, journal entry, and meeting record in Stone is a standard Markdown file on disk. You can open your workspace in any text editor, search it with `grep`, and commit it to Git.

Stone maintains a local SQLite database, but only for metadata and search indexes. Because the files on disk remain the source of truth, if the database ever gets lost or corrupted, Stone simply rebuilds it from your folder. I wrote more about how that works in [Markdown files as the source of truth](/blog/markdown-notes-sqlite-search-index).

In practice, this means Stone has no export feature because there is nothing to export from. If you stop using the app tomorrow, your notes stay right where you left them.

## Six places, one command palette

The interface is organized around six core views, and `Cmd+K` opens a command palette that jumps directly to any view, note, or action:

- **Today** — pulls together today's journal, meetings, open tasks, recent edits, and entries you wrote on this date in past years.
- **Journals** — gives you one dedicated note per day as a built-in view rather than an add-on plugin.
- **Tasks** — collects every task from across your notes into a single list.
- **Knowledge** — clusters your notes by topic so you can see what you actually spend time writing about.
- **Graph** — maps how your notes link to one another.
- **Meetings** — holds your audio recordings, transcripts, and meeting summaries.

Task tracking is worth calling out on its own. Rather than a simple checkbox, Stone supports these states: `TODO`, `DOING`, `DONE`, `WAITING`, `HOLD`, `CANCELED`, and `IDEA`. Real engineering work spends plenty of time blocked on someone else, and a binary done/not-done toggle cannot capture that.

## Meeting notes that never leave your Mac

When you record a meeting in Stone, the app transcribes the audio locally and saves both the transcript and a summary as a searchable Markdown record.

On macOS, Stone captures your microphone and system audio as two separate tracks, transcribes each independently, and merges them into a single conversation labeled "You" and "Others." When you aren't wearing headphones, audio from your speakers bleeds back into the microphone, so Stone runs acoustic echo cancellation on the mic track before transcribing it.

For speech-to-text, Stone runs the Whisper `large-v3-turbo` model via whisper.cpp. After a one-time download of the model weights, transcription runs completely offline. You can choose whether to keep the raw audio files indefinitely, delete them right after transcription finishes, or let Stone clear them out after a set number of days (30 by default). Regardless of what happens to the audio, the text transcript and summary stay in your workspace.

Getting dual-track capture and echo cancellation working reliably was the hardest engineering problem in the project. If you want the technical details, I covered them in [Local meeting transcription on a Mac with whisper.cpp](/blog/local-meeting-transcription-whisper-cpp).

## Search that finds what you meant

When you search your workspace, Stone runs full-text search and semantic search at the same time. Full-text search catches exact phrases, while semantic search surfaces notes on the same topic even when they share none of the same words. Stone merges both result sets and passes them through a small reranking model to sort the best matches to the top. All three stages run on your machine.

Alongside the editor, a related-notes panel suggests other files worth checking while you read or write. Rather than relying on embeddings alone, it weighs semantic similarity, shared tags, shared links, and word overlap together. That way, a note linked from the same hub page as the one you have open can still surface even if the two notes phrase things differently.

## Where AI fits, and where it does not

Embeddings, search reranking, and audio transcription all run locally. They do not need an API key, and they never send data over the network.

Features that write prose, such as meeting summaries, Ask Notes, status reports, and link suggestions, need a language model. You can configure OpenAI, Azure OpenAI, Google, Groq, or any OpenAI-compatible endpoint, including one you host yourself.

Cloud inference is turned off by default, so none of your note content leaves your Mac unless you explicitly configure a provider. Everything else in Stone works fine without it.

## Who Stone is for

Stone is likely a good fit if:

- You are a developer or technical lead who wants project notes, architecture decisions, and meeting context stored as plain text.
- You keep a daily work log and regularly need to reconstruct what happened weeks ago.
- You like local-first tools such as Obsidian or Logseq, but want daily journals, meeting capture, and task aggregation built in rather than stitched together from community plugins.

## Who should use something else

You should pick a different tool if you need any of the following:

- **Real-time collaboration.** Stone has no multiplayer editing.
- **A mobile app.** There isn't one. While the repo includes a small web capture page for sending quick thoughts from your phone to a self-hosted Stone instance, it is not a full mobile client.
- **A hosted team wiki.** Stone is designed as personal software for one person's workspace.
- **Windows or Linux support today.** Although build targets exist in the codebase, only macOS releases are currently tested and published.

One practical heads-up before you install: Stone is not notarized by Apple yet, so macOS Gatekeeper will block it the first time you launch it. The README walks through the one-time step to open it anyway.

## How to install Stone

1. Download the DMG from the [latest release](https://github.com/peritissimus/stone-electron/releases/latest).
2. Drag Stone into your Applications folder.
3. Right-click Stone in Applications, choose Open, and click Open again in the system dialog.
4. Choose a directory for your workspace—an existing folder of Markdown files works out of the box.

## Frequently asked questions about Stone

### Is Stone free?

Yes. Stone is open source under the MIT license with no paid tier. You can browse or build the code at [github.com/peritissimus/stone-electron](https://github.com/peritissimus/stone-electron).

### Does Stone work offline?

Yes. Writing notes, searching, journaling, managing tasks, and transcribing meetings all run offline once the embedding and Whisper models finish their initial one-time download. Only the optional text-generation features require network access, and even then only if you connect them to a cloud API rather than a local model server.

### Where does Stone store my notes?

Every note lives as a plain Markdown file inside whichever folder you pick as your workspace. Search indexes and metadata sit in a local SQLite database, which Stone rebuilds from the files.

### How is Stone different from Obsidian?

Both apps treat local Markdown files as the source of truth, but Stone is narrower in scope and much more opinionated. Daily journals, cross-note task views, dual-track meeting transcription, and hybrid semantic search come built in rather than requiring third-party plugins. Obsidian has mobile apps and a much larger plugin ecosystem; Stone has neither. I wrote a deeper breakdown in [Stone vs Obsidian vs Granola](/blog/stone-vs-obsidian-vs-granola).

### Can I sync Stone between computers?

Yes. Stone includes built-in Git support so you can initialize a repo, commit, pull, and push without leaving the app. Because your workspace is just a standard directory of text files, general-purpose file-sync tools work too.

### Does Stone send my notes to an AI company?

Not unless you configure it to. Search, embeddings, and audio transcription run entirely on your Mac. Summaries and Ask Notes use a language model you configure. Cloud inference is off by default.

Stone is currently at version 0.8, and I rely on it every workday. If you give it a spin and run into a bug, please [open an issue](https://github.com/peritissimus/stone-electron/issues)—user reports and daily paper cuts are how most of the last few hundred commits got started.
