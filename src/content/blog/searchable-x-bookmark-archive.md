---
title: 'A Searchable X Bookmark Archive: How I Built Birdbrain'
date: 2026-10-12
author: Kushal Patankar
category: Personal Software
tags: [Personal Software, X Bookmarks, SQLite]
description: 'Inside Birdbrain: capturing X bookmarks, searching saved posts, and separating local storage from hosted AI.'
readTime: 5 min read
---

Birdbrain is a personal Twitter/X bookmark archive. A browser extension captures bookmark data as I browse, a local service stores it in SQLite, and background jobs add topic labels and summaries. A separate interface lets me search what was saved.

The reason for building it was simple: saving a useful post was easier than finding it again. I wanted the archive to fit the bookmarking habit I already had.

This is an engineering case study of the [published Birdbrain source](https://github.com/peritissimus/birdbrain/tree/fbe2db3f968409f941dfbfe66122a6eaccb73485), reviewed on October 12, 2026. It describes how the implementation works and its limits. It is not a claim that capture has been freshly tested against every current X response.

## Start with retrieval, not a new feed

A saved post has two kinds of value: what the author wrote, and why I might want it later. A timeline preserves the first imperfectly and often says little about the second.

Birdbrain keeps the source text, author information, original post ID, and raw response data. Generated topics and summaries sit beside those records. They help with retrieval, but they are interpretations of the source.

The scope is deliberately personal. There is no publishing workflow or shared recommendation feed. The useful result is recovering a reference when it becomes relevant to work.

## Capture happens while browsing bookmarks

The extension's [capture hook](https://github.com/peritissimus/birdbrain/blob/fbe2db3f968409f941dfbfe66122a6eaccb73485/chrome_extension/hook.js) watches matching responses from X's bookmark and post-detail requests. It handles both fetch and XMLHttpRequest responses, then passes the captured data to the extension's next stage.

This means capture depends on what X loads in the browser. Scrolling the bookmark list brings more records into view. It is not a promise that installing the extension downloads the entire account history.

That tradeoff is central to the design. It avoids a separate manual saving action, but depends on response shapes controlled by another product. If X changes those shapes, the parser may need repair. A personal tool can accept that maintenance burden; a hosted service making guarantees to strangers would need more.

## Store the source before enriching it

The path through the app is:

1. The extension captures bookmark response data.
2. The API parses posts and saves them in SQLite.
3. If classification is enabled and configured, it queues background work.
4. A worker asks a hosted model for topic labels and a short summary.
5. The interface displays the archive with search and filters.

The [repository](https://github.com/peritissimus/birdbrain/blob/fbe2db3f968409f941dfbfe66122a6eaccb73485/src/adapters/db/repository.py) looks up a post by its original ID before saving it. Capturing the same post again updates the existing row rather than intentionally creating another copy.

Persisting the source before calling the classifier gives the two activities separate responsibilities. An AI response should improve a saved record, not be the condition for having one. This implementation still has rough edges: a queue failure after persistence can leave the caller seeing an error even though the data was saved. The storage order is useful, but it is not an end-to-end reliability guarantee.

## Search is simpler than the AI label suggests

The current [search endpoint](https://github.com/peritissimus/birdbrain/blob/fbe2db3f968409f941dfbfe66122a6eaccb73485/src/infrastructure/api/server.py) matches text against post content, author handle, author name, and summary. Topics are a separate filter.

It uses SQL text matching. It is not vector search or an FTS5 index. Summaries can add useful words to search over, but the search itself does not infer the meaning of a query.

That is an important distinction when describing an “AI bookmark manager.” AI can help organize records without making every part of retrieval semantic. A simple search over saved text may be enough for a personal collection; larger collections would justify measuring latency and relevance before adding a different index.

For a more elaborate local retrieval system, I wrote separately about [hybrid search in Stone](/blog/markdown-notes-sqlite-search-index).

## Incomplete posts remain an explicit problem

A bookmark response may contain truncated text or omit a quoted post. Birdbrain tracks those conditions instead of assuming every captured record is complete.

When a fuller post-detail response becomes available, the hydration route can replace shorter text and fill in missing quoted-post data. When the main text gets longer, it clears the old classification and marks the record pending again. A summary based on incomplete text should not quietly remain authoritative after the source changes.

Hydration depends on receiving the missing content. It cannot recover a post the browser cannot access, and it does not turn media URLs into permanent copies of the media files. A local database is useful ownership, but it is not a complete preservation system.

## Local storage and cloud classification are separate choices

The archive lives in SQLite. The current [classifier](https://github.com/peritissimus/birdbrain/blob/fbe2db3f968409f941dfbfe66122a6eaccb73485/src/adapters/ai/groq_classifier.py) sends the author's handle and up to 2,000 characters of post text to Groq to request topics and a summary.

That boundary deserves a plain description: **local storage, hosted AI enrichment**. Classification involves provider usage and can incur cost. The stored source remains more complete than the classifier's input for longer posts, so generated summaries also have a coverage limit.

The API is designed as a local development service. Its routes do not implement user authentication, and its CORS configuration is broad. It should not be presented as a hardened, publicly deployable bookmark service. Protecting local records also requires backups and control over which processes can reach the service.

## What I would copy for another personal tool

I would keep the separation between capture, durable records, and optional enrichment. I would preserve original IDs and source text. I would make incomplete and failed states visible. Those choices make it possible to understand a record instead of trusting a polished summary blindly.

I would not copy the whole stack for a first reading list. Birdbrain uses a frontend, an API, Redis, and a worker. A manual list can start much smaller. The extra machinery becomes reasonable when background work and automatic capture actually save effort.

The [repository README](https://github.com/peritissimus/birdbrain#readme) has setup instructions. The [project page](/work/birdbrain) gives the shorter overview. For a smaller starting point, follow the [first-tool guide](/blog/how-to-build-personal-software).

This is what I mean by [personal software](/blog/what-is-personal-software): a tool shaped around a real habit, with its value and maintenance costs judged by the person who uses it.
