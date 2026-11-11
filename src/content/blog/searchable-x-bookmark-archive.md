---
title: 'A Searchable X Bookmark Archive: How I Built Birdbrain'
date: 2026-10-12
author: Kushal Patankar
category: Personal Software
tags: [Personal Software, X Bookmarks, SQLite]
description: 'Inside Birdbrain: capturing X bookmarks, searching saved posts, and separating local storage from hosted AI.'
readTime: 5 min read
---

I built Birdbrain because saving a useful post on Twitter/X was easier than finding it again. I wanted an archive that worked with the bookmarking habit I already had.

A browser extension captures bookmark data as I browse. A local service saves it in SQLite, background jobs add topic labels and summaries, and a separate interface lets me search the archive.

This post is an engineering walkthrough of the [published Birdbrain source](https://github.com/peritissimus/birdbrain/tree/fbe2db3f968409f941dfbfe66122a6eaccb73485) as reviewed on October 12, 2026. It covers how the implementation works and where its limits are. That source review does not establish that capture works against every current X response format.

## Start with retrieval, not a new feed

A saved post matters for two reasons: what the author actually wrote, and why I might need it later. A standard timeline is already an imperfect way to preserve the original post, and it rarely captures why I cared about it in the first place.

To handle both, Birdbrain stores the source text, author details, original post ID, and raw response data right alongside generated topics and summaries. Those generated fields make retrieval easier, while staying clearly separated as interpretations rather than replacements for the source.

I also kept the scope strictly personal. There is no publishing workflow and no shared recommendation feed. The whole point is just to pull up a reference when it becomes useful for something I am working on.

## Capture happens while browsing bookmarks

Instead of requiring a separate manual save step, the browser extension's [capture hook](https://github.com/peritissimus/birdbrain/blob/fbe2db3f968409f941dfbfe66122a6eaccb73485/chrome_extension/hook.js) intercepts matching network responses from X's bookmark and post-detail requests. It watches both fetch and XMLHttpRequest traffic and passes the payload along to the next stage of the extension.

Because it piggybacks on normal browsing, Birdbrain only sees what X actually loads into the page. Scrolling down through my bookmarks pulls more posts into view and into the archive, so simply installing the extension will not automatically download an entire account history.

Capture happens without an extra save button, but it depends on response formats X controls. If those change, the parser may need repair. That is a maintenance burden I can accept for a personal tool; a hosted service making promises to other people would need more.

## Store the source before enriching it

Data moves through the system in five steps:

1. The extension captures raw bookmark response data from the browser.
2. The local API parses the posts and writes them to SQLite.
3. If AI classification is configured and turned on, the API queues a background job.
4. A worker sends the post to a hosted model to get topic labels and a short summary.
5. The web interface exposes the archive with search and topic filters.

Before writing to SQLite, the [repository](https://github.com/peritissimus/birdbrain/blob/fbe2db3f968409f941dfbfe66122a6eaccb73485/src/adapters/db/repository.py) checks whether a post with that original ID already exists. Re-capturing a bookmark updates the existing row rather than intentionally duplicating it.

Birdbrain saves the post before asking the model to classify it. The model should improve a record we already have. There are still rough edges: if the database write succeeds and queueing fails, the API can return an error even though the post was saved. The order is useful, but it does not guarantee end-to-end reliability.

## Search is simpler than the AI label suggests

When I query the archive, the [search endpoint](https://github.com/peritissimus/birdbrain/blob/fbe2db3f968409f941dfbfe66122a6eaccb73485/src/infrastructure/api/server.py) runs plain SQL text matching across the post content, author handle, author name, and generated summary, with topics available as a separate filter.

There is no vector database here, and not even a SQLite FTS5 index. While the AI-generated summaries help by adding extra keywords that might not appear in the tweet itself, the query engine is just matching strings rather than inferring intent.

That distinction tends to get lost when people talk about an “AI bookmark manager.” Using a model to label and summarize records on ingest does not mean retrieval has to be semantic too. Plain text matching may be enough for a personal collection. For a larger archive, I would measure latency and relevance before choosing another index. (If you are curious what a more involved local setup looks like, I wrote a separate post on [hybrid search in Stone](/blog/markdown-notes-sqlite-search-index).)

## Incomplete posts remain an explicit problem

Bookmark feed responses from X do not always include everything—long posts can arrive truncated, and quoted posts are sometimes missing altogether. Rather than pretending every captured bookmark is complete, Birdbrain tracks these gaps explicitly.

If the extension later observes a full post-detail response for an incomplete record, a hydration route swaps in the longer text and fills in any missing quoted-post data. Whenever the main body of a post grows during hydration, Birdbrain also wipes the old classification and marks the item pending again, so a summary written from half a post does not quietly stay attached to the full version.

Hydration depends on the browser receiving the missing content. It cannot recover posts the browser cannot access, and it does not turn media URLs into permanent copies of media files. A local database gives me control over the records, but it is not a complete preservation system.

## Local storage and cloud classification are separate choices

Even though the database lives locally in SQLite, classification leaves my machine. The current [classifier](https://github.com/peritissimus/birdbrain/blob/fbe2db3f968409f941dfbfe66122a6eaccb73485/src/adapters/ai/groq_classifier.py) sends the author's handle and up to 2,000 characters of post text to Groq to generate topics and a summary.

The cleanest way to think about that split is **local storage, hosted AI enrichment**. Calling an external provider means classification involves provider usage and can incur cost. The input cap also means the SQLite row holds more text than the model ever sees on very long posts, which puts a ceiling on how thorough the generated summaries can be.

On the operational side, the API is built strictly as a local development service. It has broad CORS settings and no user authentication on its routes, so it has no business being exposed to the public internet as a shared bookmark service. Even on a personal machine, keeping the archive safe still comes down to running regular backups and being careful about what local processes can talk to the port.

## What I would copy for another personal tool

If I were building another personal archive tomorrow, I would keep the clear split between capture, durable storage, and optional enrichment. Keeping original IDs, preserving raw source text, and surfacing incomplete or failed states openly makes it easy to inspect what actually happened to a record instead of blindly trusting a neat summary.

What I would skip for a simple first reading list is the surrounding infrastructure. Birdbrain runs a web frontend, an API server, Redis, and a background worker. For manual bookmarking, you can get away with far less; all those moving parts only earn their keep once automatic capture and background classification save enough effort to justify them.

If you want to poke around further, the [repository README](https://github.com/peritissimus/birdbrain#readme) covers local setup, and the [project page](/work/birdbrain) has a quick overview. If you would rather build something much smaller first, check out my [first-tool guide](/blog/how-to-build-personal-software). Birdbrain is what I mean by [personal software](/blog/what-is-personal-software): a tool built around an existing habit, where the person using it gets to decide whether the convenience is worth the maintenance.
