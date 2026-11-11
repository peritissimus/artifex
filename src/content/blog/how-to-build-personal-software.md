---
title: 'How to Build Personal Software: A Practical First-Tool Guide'
date: 2026-10-12
updated: 2026-11-12
author: Kushal Patankar
category: Personal Software
tags: [Personal Software, AI-Assisted Development, Building Tools]
description: Build a small tool for one recurring task, with a reusable brief and checks for storage, recovery, and daily use.
readTime: 5 min read
---

Start with one recurring task. Describe what should happen, choose the smallest interface that gets the job done, and test it with the inputs you use. An AI coding assistant can help write the code; you decide what counts as working.

The reading-list tool in this guide is a proposed first project. Its design draws on tools I have built, including [Tabbit](/work/tabbit) and [Birdbrain](/work/birdbrain). If the idea is new to you, start with [what personal software means](/blog/what-is-personal-software).

## 1. Choose a task with a visible result

Starting with “I want a personal operating system” is far too broad for a first project, whereas “I want to save a link with a note and find it later” gives you a specific result you can actually verify.

In our example, the recurring problem is a pile of reading links scattered across browser tabs and notes apps. A useful first version only needs four actions: save a URL, write down why you saved it, search the list, and mark an item as read. Leave out automatic website scraping, AI summaries, shared accounts, and cross-device sync for now. Every one of those features introduces a new dependency before you even know whether keeping the list helps your workflow.

When picking a first task, look for three properties:

- You run into the problem often enough to test the tool during your normal routine.
- You can tell whether the output is right on your own, without having to ask the AI that wrote the code.
- You can undo a failed run without losing anything important.

## 2. Choose where the tool belongs

Let the task dictate the interface rather than starting with a favorite framework. Tabbit is a browser extension because the tabs it manages already live in the browser. Birdbrain needs a persistent archive because the value comes from searching bookmarks collected over months.

| Where the problem happens                | A reasonable first form                        |
| ---------------------------------------- | ---------------------------------------------- |
| Repeated work on files                   | A script with a preview of proposed changes    |
| A missing action on a website            | A browser extension                            |
| A small list, calculator, or comparison  | A local web page                               |
| Regular access to desktop files or audio | A desktop app, with more setup and permissions |

For a simple reading list, a local web page running in a single browser on one computer is plenty. Just make sure you serve it from a consistent local address. You do not need to deploy anything publicly to find out if the workflow sticks.

## 3. Write the storage rules before the screen

Before thinking about layout, decide what a single saved record looks like and how it will survive over time. Here, each item needs an ID, a URL, a title, a personal note, the date it was saved, and its read status.

That data has to survive a page refresh, and you need a reliable way to get it out of the app. Browser storage can be a reasonable starting point for this small list, provided you account for its limits. As [MDN explains for localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage), the data is tied to a specific browser and site origin—clearing your site data can wipe it out, and opening the page on a different local port can make your list look empty.

To protect your data, build JSON export and import right away. An export file gives you a plain-text backup you can move around and inspect. On the way back in, the import step should validate the file before touching your existing data, preview how many items it is about to add, and check for duplicate IDs.

This habit scales well to larger projects. In [Stone](/blog/stone-local-first-note-taking-app), for instance, the durable records are plain Markdown files on disk, while the search indexes can always be rebuilt from scratch. The storage mechanism is different, but the question is the same: what survives if the interface disappears?

## 4. Give the builder a small, testable brief

Whether you hand the work to a coding assistant or write the code yourself, the most important step is writing a clear specification. Here is a brief you can adapt:

```text
Build a personal reading list for one person, in one browser.

Each item has an ID, URL, title, note, saved date, and read status.
Let me add an item, search its title/URL/note, mark it read,
and delete it with undo until the next page reload.

Use plain HTML, CSS, and JavaScript. No remote scripts,
accounts, analytics, remote page fetching, or AI features.
Use browser storage and document how to run it at one
consistent local URL.

Provide JSON export and import. Validate the entire import
before changing data. Show a preview; merge by ID without
silently overwriting existing items. Reject malformed files.

Treat all item text as text, never HTML. Allow only http/https
links. Show a useful error if storage fails; don't claim saved.

Use labelled form fields, keyboard-accessible controls,
visible focus states, and a layout that fits a phone screen.

First explain the files and data flow. Then implement it.
Include exact run steps and a short manual verification list.
```

One prompt is unlikely to produce a finished tool. Read the code, test the behavior, and revise it.

Ask the assistant to explain each dependency or permission it adds. If it builds an account system, ask which requirement needs one. Keep the brief beside the code as a reference for later changes.

## 5. Verify the boring behavior

The same question applies when a tool grows beyond its first version: which existing rule could the next edit bypass? I explore that problem in [frameworks for AI coding and the rules they leave implicit](/blog/frameworks-for-ai-coding).

Before trusting the app with real links you care about, put it through its paces with dummy data. Run through these checks yourself:

| Check                                                  | What should happen                                |
| ------------------------------------------------------ | ------------------------------------------------- |
| Save three items, then reload                          | All three return with their notes and read status |
| Search a word in a note                                | The matching item appears                         |
| Enter text such as `<b>hello</b>`                      | It displays literally; it does not become markup  |
| Enter an unsupported URL scheme                        | The app rejects it with an explanation            |
| Export, then import into an empty test browser profile | The same records return                           |
| Import the same file twice                             | Records are not duplicated                        |
| Import a malformed file                                | Existing data stays intact                        |
| Delete an item, then undo                              | The item returns                                  |
| Use the form with only the keyboard                    | Every action is reachable and focus is visible    |

Also simulate a browser storage failure, either manually or with your coding assistant. The app must report that saving failed instead of showing a success message over lost work.

A screenshot shows that the page rendered. Exporting the records and restoring them into a fresh profile checks that you can recover them.

## 6. Add AI only when the missing step needs it

Using AI to write the code does not mean you need AI running inside the app. Our reading list works fine without ever sending a saved link to a language model.

If writing notes by hand eventually slows you down too much, you can always add generated summaries later as an optional layer. Design it so the app saves your raw link first, and displays a clear pending or failed state if the summary request hangs or errors out. Be explicit with yourself about which fields get sent to an external API and what those calls cost.

Birdbrain works along these lines, pairing locally stored posts with generated labels and summaries. Because its current classifier relies on a hosted model provider, having a local archive does not mean the processing itself happens offline—a distinction I cover in the [Birdbrain case study](/blog/searchable-x-bookmark-archive).

## 7. Use it before expanding it

Once the basic checks pass, put the tool into your normal routine and pay attention to where you still fall back on old habits. Maybe typing out page titles manually is annoying, or maybe plain text search turns out to be fast enough that building a tagging system would just create extra chores.

Jot down those friction points before asking your assistant for new features. Fix one annoyance at a time, and keep a working version you can return to if an experiment makes the tool worse.

You know the first version is solid enough to rely on when it handles the core task, holds onto your data through everyday use, restores cleanly from a backup, and surfaces errors honestly. Before sharing it, also consider other people's data, setup, and support needs. If it is just for you, though, a useful tool can stay small—only add the next feature when you hit a real problem that demands it.
