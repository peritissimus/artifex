---
title: "Hybrid Search in SQLite: FTS5, Embeddings, and Rank Fusion"
date: 2026-09-26
updated: 2026-10-05
author: Kushal Patankar
category: Architecture
tags: [SQLite, FTS5, Hybrid Search, Reciprocal Rank Fusion, Embeddings, Semantic Search, Markdown, Local-First]
description: How to build hybrid search in SQLite — FTS5 full-text plus embeddings, merged with reciprocal rank fusion and a cross-encoder reranker — while plain Markdown files stay the only durable data.
readTime: 9 min read
---

There is one rule in [Stone](/work/stone) that every other storage decision follows from: you can delete the database and lose nothing.

Stone is a local-first note-taking app. Notes are Markdown files in a folder. A SQLite database sits beside them and makes search fast. The rule says the database holds nothing that cannot be recomputed from the files.

It sounds like a small promise. Keeping it shaped most of the app.

## Why the files have to win

A notes app is a long bet. I want to read these notes in ten years, and I do not expect any app — including mine — to last that long unchanged.

Plain Markdown survives. It opens in any editor, diffs cleanly in Git, and can be searched with tools that existed before I was born. A database file does none of that. Once the durable copy of a note lives in a table, the app has become the only way to read it.

So the files are the product, and SQLite is a cache with opinions.

## What is allowed in the database

Each piece of data gets one question: could this be rebuilt from the folder?

| Data | Lives in | Why |
| --- | --- | --- |
| Note text | Markdown file | It is the note |
| Chunks and embeddings | SQLite | Derived from the text |
| Full-text index | SQLite (FTS5) | Derived from the text |
| Link graph | SQLite | Derived from links in the text |
| Topic clusters | SQLite | Derived from the embeddings |

Text search, vector similarity, and graph queries need a query engine. Everything in the database is there because it needs one, and all of it is derived.

I am not finished. Some metadata, such as tags and pinned flags, still lives in tables only because the database was there when I wrote the feature. The plan is to move those into each note's frontmatter, so they travel with the file.

## Indexing by chunk, not by note

A long note covers several subjects. If you embed it as one vector, you get an average of all of them, which is close to none of them.

Stone splits each note into chunks along its headings. Every chunk stores its text, the path of headings above it, a token count, and a hash of its content. Each chunk gets its own embedding and its own row in the full-text index.

The hash is what makes re-indexing cheap. When a file changes, Stone re-chunks it and compares hashes. Only chunks whose content changed are embedded again. Fixing a typo in one section does not recompute the whole note.

## Recording which model built the index

Embeddings from different models cannot be compared. If I change the model and leave old vectors in place, search quietly gets worse and nothing reports an error.

So each note's index record stores the model name and vector dimensions it was built with, along with a status. Stone currently uses `bge-small-en-v1.5`, which produces 384-dimension vectors and runs in a worker thread through transformers.js. When the model changes, records built with the old one are stale by definition and get rebuilt.

This only works because of the first rule. Rebuilding is always safe, because the files are still there.

## Hybrid search in SQLite: FTS5 and embeddings merged with rank fusion

Full-text search and semantic search fail in opposite ways.

Full-text search finds the exact error message or function name, and misses a note that describes the same idea in different words. Semantic search finds the idea, and can miss the exact string you typed.

Stone runs both at once and merges them with reciprocal rank fusion. Each chunk scores `1 / (60 + rank)` in each list where it appears, and the scores are added. A chunk that ranks well in both lists rises to the top. Rank fusion needs no tuning to make two unrelated score scales comparable, which is why I chose it over a weighted sum.

If the embedding model is not loaded yet, the semantic side returns nothing and search falls back to full-text alone. Search should never be unavailable because a model is still starting.

## Reranking the shortlist

Fusion gives a good shortlist, not a good final order.

The top 30 merged chunks are passed to a cross-encoder, `ms-marco-MiniLM-L-6-v2`. An embedding model scores the query and the chunk separately. A cross-encoder reads them together, which is slower and noticeably more accurate. Thirty candidates re-score in under a second on a laptop.

The reranker shares a worker thread with the embedding model, so the main process never blocks on inference.

## Related notes, and why I stopped using centroids

The related-notes panel was the feature I got wrong the longest.

The obvious approach is to average a note's chunk vectors into one centroid and find the nearest centroids. It gave bad results. Averaging a note that covers three subjects produces a vector near nothing in particular, and generic notes ended up related to everything.

Stone now compares chunk to chunk. Every chunk of a candidate note is matched against every chunk of the note you are reading. The score blends three things:

- **The best pair** — the single strongest match between the two notes.
- **Depth** — the average of the top few pairs.
- **Breadth** — the fraction of the candidate's chunks that match strongly.

Breadth uses a fraction, not a count. A count rewards long notes, and daily journals would win every time just by being long.

## Calibrating against your own notes

Small embedding models squeeze every similarity score into a narrow band. Two unrelated notes might score 0.6 and two closely related ones 0.75. A fixed threshold tuned on my notes would be wrong for yours.

So Stone calibrates against the workspace itself. It subtracts the average embedding of the whole corpus from every vector, which removes the direction all the notes share. Then it samples pairs of chunks from different notes to measure what unrelated looks like. The floor for a real match is set at three standard deviations above that noise.

Workspaces with only a handful of notes do not have enough data for this, so they fall back to fixed thresholds.

## Structure nudges, meaning decides

Embeddings miss things a person would call obvious. Two notes linked from the same project page are related, even if they share no vocabulary.

After the semantic score, Stone adds small boosts for:

- shared tags,
- overlap in the link graph, including direct links,
- distinctive words in common,
- being in the same notebook.

The boosts are small on purpose. Structure can lift a note that is already somewhat related. It can never surface one that is semantically unrelated. Journal entries are scored slightly lower so they do not crowd out topical notes.

## Keeping files and index in sync

Because the files can change outside the app — a `git pull`, an edit in another editor — Stone watches the workspace folder and re-indexes what changed.

Two boring settings mattered more than I expected. Enabling write-ahead logging and a busy timeout on the SQLite connection stopped background indexing from colliding with the app's own reads and failing with a locked-database error.

## What this design costs

**A cold start is slow.** A new or rebuilt workspace has to chunk and embed every note before semantic search is useful. Full-text search is ready much sooner.

**Two copies can disagree.** Between a file changing and the index catching up, search is slightly stale. The file always wins, but the window exists.

**The embedding model is English-focused.** `bge-small-en-v1.5` is small and fast, and weaker on other languages.

**Metadata is still migrating.** Until tags and flags move into frontmatter, the rule is not fully true for them. I would rather say so than pretend the design is finished.

## Frequently asked questions

### Should a notes app store notes in SQLite or in files?

Store the notes as files if you care about portability and longevity, and use SQLite for what files are bad at: full-text search, vector search, and graph queries. Treat the database as derived data that can be rebuilt.

### What is reciprocal rank fusion?

It is a way to merge several ranked lists. Each item scores `1 / (k + rank)` in every list where it appears, and the scores are summed. It needs no score normalization, which makes it a good fit for combining keyword and vector search.

### Can SQLite do hybrid search?

Yes. Use an FTS5 virtual table for keyword search and store embeddings alongside your rows for vector similarity. Run both queries, then merge the two ranked lists with reciprocal rank fusion. No separate search service is needed.

### Do I need a vector database for semantic search over notes?

Not at personal scale. A few thousand notes produce tens of thousands of chunks, and SQLite stores and compares those vectors fast enough on a laptop.

### Why split notes into chunks before embedding?

One vector for a long note averages all its subjects together and matches none of them well. Chunking along headings keeps each vector about one thing, and lets search point at the relevant section.

### What happens when I change the embedding model?

Vectors from different models are not comparable, so the index must be rebuilt. Record the model name and dimensions with each indexed note so stale entries can be detected and re-embedded.

The useful test for a local-first app is a destructive one: delete the database and see what you lost. If the answer is "a few minutes of indexing," the files really are the product. The code is open at [github.com/peritissimus/stone-electron](https://github.com/peritissimus/stone-electron), and the overview of the app is in [Stone: a local-first Markdown note-taking app for Mac](/blog/stone-local-first-note-taking-app).
