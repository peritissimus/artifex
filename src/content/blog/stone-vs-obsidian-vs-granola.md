---
title: "Stone vs Obsidian vs Granola: A Local, Open-Source Alternative"
date: 2026-10-05
author: Kushal Patankar
category: Product
tags: [Stone, Obsidian Alternative, Granola Alternative, Note-Taking, Meeting Notes, Local-First]
description: An honest comparison of Stone with Obsidian and Granola. Where an open-source, local-first notes app with on-device meeting transcription fits, and where the other two are the better choice.
readTime: 6 min read
---

I build [Stone](/work/stone), so this comparison is not neutral. I have tried to make it useful anyway, which means saying plainly where Obsidian and Granola are better.

The short version: Obsidian is the best general notes app for plain Markdown files. Granola is the most polished AI meeting notepad. Stone is for the narrower case where you want both jobs in one app, with the files and the transcription staying on your own Mac.

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

The last two Granola cells are deliberately vague. Product details change quickly, and their own site is the right source.

## Stone vs Obsidian

Both keep your notes as Markdown files in a folder you own. If that is the only thing you care about, Obsidian is the safer choice. It has years of polish, mobile apps, a huge plugin ecosystem, and a large community.

Stone differs in what it builds in:

- **Daily journals** are a core view, not a plugin.
- **Tasks** are collected from every note into one list, with states like `WAITING` and `HOLD`.
- **Meeting recording** captures your mic and system audio and transcribes them on-device.
- **Semantic search and related notes** work out of the box, with the models running locally.
- **Git sync** is built into the app.

In Obsidian, each of those is a plugin you choose, configure, and keep updated. That flexibility is the point of Obsidian, and for many people it is the right trade. Stone makes the opposite trade: fewer choices, more in the box.

Stone is also open source. Obsidian is free to use but not open source. If you want to read or change the code of your notes app, that matters.

**Choose Obsidian if** you want mobile apps, plugins, or a mature tool with a big community. **Choose Stone if** you want journals, tasks, meetings, and semantic search in one opinionated Mac app, and you are comfortable with a young project.

## Stone vs Granola

Granola is an AI notepad built around meetings. It listens to the audio on your computer without sending a bot into the call, and turns your rough notes plus the transcript into a clean summary. It does that job very well.

The difference is where the work happens. Granola processes meetings in the cloud. Stone transcribes on your Mac with Whisper, using whisper.cpp, and the audio never leaves the machine. Summaries in Stone use a language model you configure, and cloud inference is off by default.

There is a second difference in what you are left with afterwards. In Stone, a meeting record is a Markdown file in the same folder as your notes and journals. It is searchable alongside everything else, and it shows up in related notes. A meeting is not a separate product. It is one more kind of note.

Granola is better in several ways:

- The summaries are more polished and need no setup.
- It does not need a capable machine, because the heavy work runs on their servers.
- It is a finished commercial product with a team behind it.

**Choose Granola if** you want the best meeting notes with no setup and you are fine with cloud processing. **Choose Stone if** recordings and transcripts must stay on your machine, or you want meetings to live in the same files as the rest of your notes.

I wrote up how the recorder works in [local meeting transcription with whisper.cpp](/blog/local-meeting-transcription-whisper-cpp).

## What Stone does not do

A comparison that only lists strengths is an advert. Stone has real gaps:

- **No mobile app.**
- **No real-time collaboration.**
- **No plugin system.**
- **macOS only** in published builds.
- **Not notarized by Apple yet**, so the first launch needs a manual step.
- **One label for everyone else on a call.** Remote speakers are not told apart.
- **A small project.** One developer, and things break.

If any of those is a requirement, pick one of the other two.

## Can you use them together?

Yes, for Obsidian. Stone's workspace is a plain folder of Markdown, so you can point both apps at the same folder and use whichever suits the moment. Stone stores its own index in a separate database, and it rebuilds that from the files, so nothing in the notes themselves is tied to Stone. I explain that design in [hybrid search in SQLite over Markdown notes](/blog/markdown-notes-sqlite-search-index).

## Frequently asked questions

### Is there an open-source alternative to Granola?

Yes, several. Stone is one: it records your microphone and system audio without a meeting bot, transcribes on-device with Whisper, and saves the result as a Markdown file. It is MIT-licensed and free. It is a notes app with meetings built in, not a dedicated meeting tool.

### Is Stone a good Obsidian alternative?

It can be, if you want daily journals, tasks, meeting transcription, and semantic search built in and you work on a Mac. If you depend on Obsidian plugins or its mobile apps, Stone will not replace it.

### Does Stone record meetings without a bot joining the call?

Yes. Stone captures the audio on your own computer, so nothing joins the meeting and other participants see no extra attendee. Tell people you are recording; in many places the law requires it.

### Can I move my Obsidian vault into Stone?

Stone opens a folder of Markdown files, so an existing vault works as a workspace. Features that come from Obsidian plugins will not carry over. Keep a backup before pointing any new app at your notes.

### Does Stone work without an internet connection?

Notes, search, and meeting transcription all work offline once the models have been downloaded. Only the optional summary and question-answering features need a network, and only if you connect them to a cloud model.

Stone is free and the code is at [github.com/peritissimus/stone-electron](https://github.com/peritissimus/stone-electron). The fuller description of the app is in [Stone: a local-first Markdown note-taking app for Mac](/blog/stone-local-first-note-taking-app).
