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

Every storage decision in [Stone](/work/stone) starts from one rule: you should be able to delete the database and lose nothing.

Stone keeps notes as Markdown files in a folder and uses SQLite to make them searchable. The rule is that the database should contain only what I can rebuild from those files. Following that rule has shaped much of the app.

## Why the files have to win

Choosing a notes app is a long-term bet. I want to be able to read my notes ten years from now, and I do not expect any piece of software—including mine—to stay unchanged for that long.

Plain Markdown is easy to keep. I can open it in any text editor, diff it in Git, and search it with tools older than I am. A database file does not give me those conveniences. If the only copy of a note lives in a table, reading my writing depends on the app.

The files are the product. SQLite is a cache with opinions.

## What is allowed in the database

Before anything goes into SQLite, I ask a single question: can I rebuild this from the folder on disk?

| Data | Lives in | Why |
| --- | --- | --- |
| Note text | Markdown file | It is the note |
| Chunks and embeddings | SQLite | Derived from the text |
| Full-text index | SQLite (FTS5) | Derived from the text |
| Link graph | SQLite | Derived from links in the text |
| Topic clusters | SQLite | Derived from the embeddings |

Full-text search, vector similarity, and link-graph queries need a query engine. That is SQLite's job. The data supporting those queries comes from the Markdown files.

I have not finished the migration. Tags and pinned flags still live only in database tables because that was convenient when I built them. I plan to move them into each note's frontmatter so they travel with the file.

## Indexing by chunk, not by note

Long notes tend to wander across multiple topics. If you collapse an entire note into a single embedding vector, you average all of those topics together and end up with a vector that does not match any of them well.

Stone splits each note into chunks along its headings. Each chunk stores its text, the headings above it, a token count, and a content hash. It gets its own embedding and its own full-text index entry.

When a file changes, Stone splits it into chunks again and compares their hashes with the index. Only changed chunks need new embeddings. Fixing a typo in one section does not mean embedding the whole note again.

## Recording which model built the index

Embeddings from different models cannot be compared. If I switch models without replacing the old vectors, search can get worse without reporting an error.

Each note's index record therefore keeps the model name, vector dimensions, and indexing status. Stone currently uses `bge-small-en-v1.5`, which produces 384-dimension vectors through transformers.js in a worker thread. Changing models marks old records as stale so they can be rebuilt.

Rebuilding the index does not put the note text at risk, because the source files are still on disk.

## Hybrid search in SQLite: FTS5 and embeddings merged with rank fusion

Keyword search and semantic search fail in opposite, complementary ways. Full-text search is great when you remember an exact error string or function name, but it misses notes that describe the same concept in different words. Semantic search catches the underlying concept, yet it can easily miss the literal string you just typed.

Stone runs both searches and merges their results with reciprocal rank fusion. Each chunk scores `1 / (60 + rank)` in each list where it appears, and those scores are added. A chunk near the top of both lists rises in the combined results.

I chose rank fusion over a weighted sum because keyword and semantic scores use different scales. Their positions in the lists can be combined without making those scores comparable.

If you run a search while the embedding model is still spinning up in the background, the semantic query simply returns an empty list and rank fusion falls back to FTS5 results alone. Waiting on a model to load should never block you from searching your notes.

## Reranking the shortlist

Reciprocal rank fusion is good at pulling the right candidates into a shortlist, but its final ordering is still rough.

Stone sends the top 30 merged chunks to a cross-encoder, `ms-marco-MiniLM-L-6-v2`. An embedding model reads the query and chunk separately; the cross-encoder reads them together. That is slower, but more accurate. Reranking this shortlist takes under a second on a laptop.

Like the embedding model, the cross-encoder runs in that background worker thread so inference does not block the main process.

## Related notes, and why I stopped using centroids

The related-notes panel was the feature I kept getting wrong.

My first approach was to average each note's chunk vectors into a centroid and find nearby centroids. The results were poor. A note covering three subjects ended up between them, while generic notes seemed related to everything.

I threw out centroids and switched to direct chunk-to-chunk comparisons. Stone now compares every chunk of the note you are reading against every chunk of a candidate note, scoring the relationship by blending three signals:

- **The best pair** — the single highest similarity score between any two chunks across the two notes.
- **Depth** — the average similarity of the top few matching chunk pairs.
- **Breadth** — the fraction of the candidate note's chunks that match strongly.

Breadth is a fraction because a raw count would reward long notes. Daily journals could win simply by having more chunks to match.

## Calibrating against your own notes

Small local embedding models have an annoying quirk: they pack all their similarity scores into a tight, high band. Two completely unrelated notes might have a cosine similarity of 0.6, while two closely related ones score 0.75. Because that baseline shifts depending on how and what you write, a hardcoded cutoff tuned on my notes would misfire on yours.

Stone calibrates against the workspace instead. It subtracts the corpus's average embedding from every vector to remove the direction the notes share. Then it samples pairs of chunks from different notes to estimate the background similarity. A match has to clear a threshold three standard deviations above that noise.

Very small workspaces do not have enough chunks to make that statistical sample reliable, so Stone falls back to fixed thresholds until you have written more notes.

## Structure nudges, meaning decides

Pure vector similarity still misses connections that are obvious to a human reader. If two notes are both linked from the same project hub page, they are clearly related even if their wording does not overlap at all.

Once Stone calculates the base semantic score between two notes, it applies small additive boosts if they share structural traits:

- shared tags,
- overlap in the link graph, including direct links,
- distinctive words in common,
- being in the same notebook.

The boosts are small on purpose: they can lift an already related note, but cannot surface a semantically unrelated one. Journal entries also receive a slight penalty so they do not crowd out topical notes.

## Keeping files and index in sync

Files can change outside Stone, through a `git pull` or another editor. A watcher monitors the workspace folder and re-indexes the files that change.

Two SQLite settings made background indexing work alongside interactive reads: write-ahead logging and a busy timeout. They stopped indexing writes from colliding with reads and producing locked-database errors.

## What this design costs

Treating SQLite strictly as a disposable index comes with real trade-offs:

**A cold start is slow.** A new or rebuilt workspace needs to chunk and embed every note before semantic search is useful. Full-text search is ready sooner.

**Two copies can disagree.** Search can be stale between a file changing and the index catching up. The file remains authoritative.

**The embedding model is English-focused.** `bge-small-en-v1.5` is small and fast, but weaker on other languages.

**Metadata is still migrating.** Until I finish moving tags and pinned flags out of SQLite tables and into file frontmatter, deleting the database does lose those specific bits of state. It is better to be upfront about that gap than pretend the migration is finished.

## Frequently asked questions

### Should a notes app store notes in SQLite or in files?

Keep notes as files if you want portability and longevity. Use SQLite for full-text search, vector search, and graph queries, and treat the database as data you can rebuild from the files.

### What is reciprocal rank fusion?

It combines ranked lists by giving each item `1 / (k + rank)` points in every list where it appears, then adding those points. Because it uses positions rather than raw scores, it needs no score normalization.

### Can SQLite do hybrid search?

Yes. Use an FTS5 table for keyword search and store embeddings alongside the rows for vector similarity. Run both searches and merge their rankings with reciprocal rank fusion. You do not need a separate search service.

### Do I need a vector database for semantic search over notes?

Not at the scale of personal notes. Even a few thousand Markdown files only break down into tens of thousands of chunks, and SQLite can store and scan that many vectors comfortably fast on a normal laptop.

### Why split notes into chunks before embedding?

One vector averages all the subjects in a long note. Splitting along headings keeps each vector focused and lets search point to the relevant section.

### What happens when I change the embedding model?

Because vectors generated by different models cannot be meaningfully compared, changing models requires rebuilding your vector index. Storing the model name and vector dimensions on every indexed note makes it straightforward to spot entries built by an older model and re-embed them automatically.

The most honest test for any local-first app is destructive: delete its database file and check what you actually lost. When the only damage is a few minutes of background re-indexing, your files really are the source of truth. You can browse the source code at [github.com/peritissimus/stone-electron](https://github.com/peritissimus/stone-electron), or read a broader overview of the app in [Stone: a local-first Markdown note-taking app for Mac](/blog/stone-local-first-note-taking-app).
