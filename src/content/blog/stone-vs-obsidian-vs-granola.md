---
title: "Stone vs Obsidian vs Granola: A Local, Open-Source Alternative"
date: 2026-10-05
author: Kushal Patankar
category: Product
tags: [Stone, Obsidian Alternative, Granola Alternative, Note-Taking, Meeting Notes, Local-First]
description: An honest comparison of Stone with Obsidian and Granola. Where an open-source, local-first notes app with on-device meeting transcription fits, and where the other two are the better choice.
readTime: 6 min read
---

Because I build [Stone](/work/stone), this comparison is not neutral. To make it useful anyway, I want to be upfront about where Obsidian and Granola are simply better tools.

Obsidian is the best general-purpose notes app for plain Markdown files, and Granola is the most polished AI meeting notepad. I built Stone for a narrower overlap: when you want both of those jobs handled in one app, with all your files and audio transcription staying locally on your Mac.

## The three tools in one table

| | Stone | Obsidian | Granola |
| --- | --- | --- | --- |
| Main job | Notes, journals, tasks, meetings | Notes and knowledge base | Meeting notes |
| Where notes live | Markdown files in your folder | Markdown files in your folder | The vendor's cloud |
| Meeting transcription | Built in, on-device | Through community plugins | Built in, cloud-processed |
| Source | Open source (MIT) | Closed source, free to use | Closed source, commercial |
| Plugins | None | Very large ecosystem | Integrations |
| Mobile app | None | Yes | Check their current offering |
| Platforms | macOS | Desktop and mobile | Check their current offering |

I left the last two Granola cells vague on purpose. Commercial product lineups change fast, so it is better to check their site directly for current platform support.

## Stone vs Obsidian

Stone and Obsidian start from the same foundation: your notes live as plain Markdown files in a local folder you control. If local Markdown is your main requirement, Obsidian is the safer bet. It has years of UI polish, solid mobile apps, an enormous plugin ecosystem, and a massive community behind it.

Where they diverge is in how much comes built into the core app. Stone includes several workflows natively:

- **Daily journals** as a primary view rather than an add-on.
- **Tasks** pulled from across all your notes into a single list, supporting states like `WAITING` and `HOLD`.
- **Meeting recording** that captures your mic and system audio, then transcribes everything on-device.
- **Semantic search and related notes** running out of the box on local models.
- **Git sync** built directly into the app.

In Obsidian, you choose, configure, and maintain plugins for these features. That flexibility is a good fit for many people. Stone trades some of those choices for features that are built in.

Licensing is another difference. Obsidian is free to use, while Stone is MIT-licensed open source. That distinction matters if you like being able to inspect or modify the code behind your tools.

**Choose Obsidian if** you need mobile apps, rely on plugins, or want a mature app with a large community. **Choose Stone if** you work on a Mac, want journals, tasks, meetings, and local semantic search integrated from day one, and do not mind rough edges in a young project.

## Stone vs Granola

Granola is a dedicated AI notepad for meetings, and it does that one job remarkably well. Instead of sending a bot into your call, it captures system audio directly on your computer, then combines the transcript with whatever rough notes you jotted down to generate a clean summary.

Stone uses that same bot-free recording approach, so the real differences come down to where the processing happens and where your notes end up.

Granola sends audio to the cloud for transcription and summarization. Stone runs Whisper locally via whisper.cpp, meaning your meeting audio never leaves your Mac. If you want AI summaries in Stone, you wire up a language model yourself, and cloud inference stays turned off by default.

The second difference is what happens after the call ends. In Stone, a meeting is not trapped in a separate meeting tool—it is saved as another Markdown file in the same folder as your daily journals and project notes. Because it lives in the same workspace, it turns up in full-text search and surfaces automatically in related notes.

Granola has clear advantages:

- Its summaries are much more polished and work immediately with zero configuration.
- It runs smoothly on lighter hardware because their servers handle the heavy compute.
- It is a mature commercial product backed by a dedicated team.

**Choose Granola if** you want top-tier meeting summaries with zero setup and are comfortable with cloud processing. **Choose Stone if** you need recordings and transcripts to stay strictly on your machine, or if you want meeting transcripts living right alongside the rest of your Markdown notes.

If you are curious about the implementation details, I wrote a separate post on [local meeting transcription with whisper.cpp](/blog/local-meeting-transcription-whisper-cpp).

## What Stone does not do

Any comparison that only highlights strengths is really just marketing, so here are Stone's actual limitations right now:

- **No mobile app.**
- **No real-time collaboration.**
- **No plugin system.**
- **macOS only** for published builds.
- **Not notarized by Apple yet**, which means bypassing a macOS gatekeeper prompt on first launch.
- **No speaker diarization for remote participants.** Everyone on the other end of a call gets grouped under a single label.
- **It is a solo project.** One developer maintains it, and bugs happen.

If any of those are dealbreakers for your workflow, you will be much happier with Obsidian or Granola.

## Can you use them together?

With Obsidian, yes. Point both apps at the same folder of Markdown files and use whichever suits the task. Stone keeps its index in a separate database that it rebuilds from the files, so your notes remain usable without it. I explain the design in [hybrid search in SQLite over Markdown notes](/blog/markdown-notes-sqlite-search-index).

## Frequently asked questions

### Is there an open-source alternative to Granola?

Yes, there are a few options now, and Stone is one of them. It records your microphone and system audio locally without a meeting bot, transcribes the audio on-device using Whisper, and writes the output to a local Markdown file. It is free and MIT-licensed, though keep in mind it is a broader notes app with meeting support rather than a standalone meeting recorder.

### Is Stone a good Obsidian alternative?

It can be, provided you are on a Mac and want opinionated, built-in support for daily journals, task aggregation, meeting transcription, and local semantic search. If your workflow depends on Obsidian's plugins or mobile apps, Stone will not replace it.

### Does Stone record meetings without a bot joining the call?

Yes. Stone captures audio directly from your Mac's mic and system output, so no virtual attendee joins the room. Tell people you are recording; in many places the law requires it.

### Can I move my Obsidian vault into Stone?

You can open an existing Obsidian vault directly in Stone since both just read folders of Markdown files. Any workflows powered by Obsidian plugins will not carry over, though. As always, back up your vault before pointing a new piece of software at your files.

### Does Stone work without an internet connection?

Yes. Once you have downloaded the local models, note-taking, hybrid search, and meeting transcription all run completely offline. You only need an internet connection if you choose to enable optional summarization or Q&A features and point them at a cloud-hosted LLM.

Stone is free and open source at [github.com/peritissimus/stone-electron](https://github.com/peritissimus/stone-electron). For a deeper look at the rest of the app, check out [Stone: a local-first Markdown note-taking app for Mac](/blog/stone-local-first-note-taking-app).
