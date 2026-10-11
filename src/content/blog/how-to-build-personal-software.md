---
title: 'How to Build Personal Software: A Practical First-Tool Guide'
date: 2026-10-12
author: Kushal Patankar
category: Personal Software
tags: [Personal Software, AI-Assisted Development, Building Tools]
description: Build a small tool for one recurring task, with a reusable brief and checks for storage, recovery, and daily use.
readTime: 5 min read
---

To build personal software, pick one recurring task, describe exactly what should happen, choose the smallest useful interface, and test it with the inputs you actually use. AI can help write the code. You still decide what counts as working.

This guide uses a small reading-list tool as a worked example. It is a proposed first project, not a claim that I shipped another app. The design choices draw on tools I have built, including [Tabbit](/work/tabbit) and [Birdbrain](/work/birdbrain).

If you are new to the idea, start with [what personal software means](/blog/what-is-personal-software).

## 1. Choose a task with a visible result

“I want a personal operating system” is too broad for a first project. “I want to save a link with a note and find it later” gives you a result you can check.

For our example, the recurring problem is a pile of reading links scattered across tabs and notes. The first version needs four actions: save a URL, add a reason for saving it, search the list, and mark an item as read.

Exclude automatic website scraping, AI summaries, shared accounts, and cross-device sync. Each creates another dependency before you know whether the list itself helps.

A good first task has three properties:

- You encounter it often enough to test the tool in ordinary use.
- You can recognize a correct result without asking the AI that produced it.
- A failed attempt can be undone without losing important data.

## 2. Choose where the tool belongs

The interface should follow the task.

| Where the problem happens                | A reasonable first form                        |
| ---------------------------------------- | ---------------------------------------------- |
| Repeated work on files                   | A script with a preview of proposed changes    |
| A missing action on a website            | A browser extension                            |
| A small list, calculator, or comparison  | A local web page                               |
| Regular access to desktop files or audio | A desktop app, with more setup and permissions |

Tabbit belongs in the browser because the tabs already live there. Birdbrain needs an archive because the useful activity happens over months. Neither choice starts with a favorite framework.

For the reading list, choose a web page used in one browser on one computer. Use a consistent local address when running it. You do not need a public deployment to learn whether the workflow is useful.

## 3. Write the storage rules before the screen

Decide what one saved item contains. For this example: an ID, URL, title, personal note, saved date, and read status.

The record needs to survive a refresh. It also needs a way out of the app. Browser storage can be a reasonable first choice for this small list, but it is tied to the browser and site origin, as [MDN explains for localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage). Clearing site data can remove it. A different port can appear to have an empty list.

Add JSON export and import. An export file is the backup you can move and inspect. An import should validate its contents before changing existing records, show how many items will be added, and avoid duplicate IDs.

This principle scales up. In [Stone](/blog/stone-local-first-note-taking-app), the durable records are Markdown files and search indexes can be rebuilt. The implementation differs; the question is the same: what survives if the interface goes away?

## 4. Give the builder a small, testable brief

Use a coding assistant or build it yourself. The important input is the brief. Here is one you can adapt:

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

Ask the assistant to explain any dependency or permission it introduces. If it adds an account system, ask which requirement needs one. Keep the brief beside the code so later changes have a reference point.

This is a specification, not a guarantee that one prompt will produce a finished tool. Expect to inspect the result and revise it.

## 5. Verify the boring behavior

Use dummy links and notes before real data. Check these behaviors yourself:

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

Also ask the builder to exercise a storage failure. The interface must show that saving failed, rather than leave a success message over lost work.

An attractive screenshot proves the page rendered. The export-and-restore check proves something more useful: you can recover the records.

## 6. Add AI only when the missing step needs it

AI used to build an app and AI used inside the app are separate decisions. This reading list can work without sending a single saved link to a model.

If manual notes later become the bottleneck, consider summaries as an optional enhancement. Save the original record first. Show a pending or failed state if enrichment does not finish. State which fields go to an external provider and what that costs.

Birdbrain follows this general shape: stored posts plus generated labels and summaries. Its current classifier uses a hosted provider, so a local archive does not mean fully offline processing. The [Birdbrain case study](/blog/searchable-x-bookmark-archive) explains the distinction.

## 7. Use it before expanding it

Try the tool in the routine that caused the problem. Notice where you still reach for the old method. Perhaps entering a title takes too long. Perhaps search is enough and categories would only add work.

Write down those observations before requesting more features. Change one source of friction at a time, keeping a working version you can return to.

You are ready to rely on the first version when it completes the core task, keeps its data through ordinary use, recovers from a tested backup, and makes failures clear. You are ready to share it when you have also considered other people's data, setup, and support needs.

A useful personal tool can stay small. The next feature should earn its place by solving a problem you have actually encountered.
