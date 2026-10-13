---
title: 'SQLite FTS5 for Markdown Notes: Demo and Benchmark'
date: 2026-10-12
author: Kushal Patankar
category: Architecture
tags: [SQLite, FTS5, Markdown, Local-First, Benchmarks]
description: 'Try a local notes-search demo and reproduce an FTS5 benchmark on 1,000 to 100,000 synthetic notes.'
readTime: 7 min read
---

A notes search feature needs to answer a simple question: where did I write that? Before adding embeddings, I wanted a small, measurable example of keyword search.

[Open the working notes-search demo](/tools/notes-search). It runs real SQLite FTS5 in your browser. You can search six sample notes or select your own Markdown files. The demo does not upload note contents, and refreshing the page clears the index.

I also ran a separate native SQLite benchmark on 1,000, 10,000, and 100,000 synthetic notes. The result below is one machine’s measurement of a narrow workload, not a promise about every notes app.

## What I measured

The benchmark compares counting matching notes through an FTS5 index with counting substring matches using `LIKE '%query%'`. Each method receives bound parameters. Both read the same title and body fields.

This is **not a ranked top-20 search benchmark**. Counting all matches forces both methods to finish their result set; there is no early exit after a handful of results. The browser demo additionally ranks and extracts snippets, so its timer measures a different workload.

The dataset has 120 randomly selected words per note, drawn from a small English vocabulary. Every tenth note includes `sqlite`; every thousandth includes `orchid`. The phrase `release checklist` appears through the random generator. `absentterm` is absent. A fixed seed makes each dataset reproducible, and the output includes a SHA-256 hash of each corpus.

These short, repetitive synthetic notes are useful for a controlled experiment. They do not represent a diverse personal archive with long documents, multiple languages, code, and uneven topic distribution.

## Results on this machine

Measured October 12, 2026, India time, on an Apple M4 with 10 logical CPUs, macOS 27.0.1, Python 3.14.0, and native SQLite 3.53.3. The JSON records the UTC timestamp and full platform string.

Each query has five warmups followed by 30 measured executions per method. The execution order alternates. Times include executing the query and fetching the count through Python. The table reports median milliseconds; all individual samples and nearest-rank p95 values are in the [raw results](/research/sqlite-search/results.json).

|   Notes | Query               | Matches | FTS5 median (ms) | LIKE median (ms) |
| ------: | ------------------- | ------: | ---------------: | ---------------: |
|   1,000 | `sqlite`            |     100 |            0.008 |            0.917 |
|   1,000 | `orchid`            |       1 |            0.006 |            1.144 |
|   1,000 | `release checklist` |     146 |            0.077 |            1.395 |
|   1,000 | `absentterm`        |       0 |            0.007 |            1.090 |
|  10,000 | `sqlite`            |   1,000 |            0.036 |           10.458 |
|  10,000 | `orchid`            |      10 |            0.020 |           13.315 |
|  10,000 | `release checklist` |   1,493 |            0.811 |           15.812 |
|  10,000 | `absentterm`        |       0 |            0.019 |           12.261 |
| 100,000 | `sqlite`            |  10,000 |            0.202 |          107.561 |
| 100,000 | `orchid`            |     100 |            0.041 |          133.352 |
| 100,000 | `release checklist` |  15,118 |            7.977 |          159.955 |
| 100,000 | `absentterm`        |       0 |            0.039 |          125.565 |

FTS5 was faster for every query in this run. The frequent phrase was substantially more expensive than the rare token within FTS5 itself. That is a useful warning against reporting only one impressive lookup time.

These are warmed queries against a temporary on-disk database. I did not flush the operating system’s caches between queries. This does not measure cold disk reads, concurrent writers, battery usage, semantic relevance, or browser performance.

## Indexing has a cost

|   Notes | FTS index build | Database before → after |
| ------: | --------------: | ----------------------: |
|   1,000 |          5.2 ms |         0.98 → 1.25 MiB |
|  10,000 |         46.1 ms |        9.80 → 12.26 MiB |
| 100,000 |        637.0 ms |      97.91 → 124.86 MiB |

The index-build measurement includes creating the virtual table, rebuilding it from the source table, and committing. Corpus generation and initial insertion are separate; insertion timings are available in the JSON. File sizes include SQLite’s allocated database pages. They are not measurements of peak RAM.

The benchmark uses an external-content FTS table so the searchable text remains in `notes`. FTS stores its derived index rather than another complete copy of every body. The small browser demo uses a simpler standalone FTS table because its entire database is disposable.

## Build the smallest version

Start with a regular table and derive the index:

```sql
CREATE TABLE notes (
  id INTEGER PRIMARY KEY,
  title TEXT,
  body TEXT
);
CREATE VIRTUAL TABLE search USING fts5(
  title, body,
  content='notes', content_rowid='id',
  tokenize='unicode61'
);
INSERT INTO search(search) VALUES ('rebuild');
```

After importing the notes, query the index with a bound parameter:

```sql
SELECT count(*) FROM search WHERE search MATCH ?;
```

For a visible result list, the demo uses a standalone table and requests a ranked shortlist:

```sql
SELECT title, snippet(notes, 1, '', '', '…', 36) AS excerpt
FROM notes
WHERE notes MATCH ?
ORDER BY rank
LIMIT 20;
```

The UI builds a literal phrase for each search term rather than accepting raw FTS operators. In all-words mode, it joins those phrases with `AND`. Exact-phrase mode quotes the whole query. It doubles embedded double quotes, then binds the resulting expression. SQL parameter binding and FTS query escaping solve different problems; both matter.

Returned titles and snippets are inserted with `textContent`. Imported Markdown is searchable text, not executable HTML. The demo limits imports to 100 files and 2 MB total to bound the work in a browser tab.

## FTS and LIKE do not mean the same thing

FTS5’s default `unicode61` tokenizer works with tokens. A substring search can match part of a word that the token index would not. Phrase matching can also treat punctuation differently from a literal substring. The benchmark checks that both methods return the same counts **for this generated corpus and these queries**, not that the two methods are interchangeable.

Choose the semantics you want first. If a reader expects partial filenames, identifiers, typo tolerance, or conceptual similarity, add and test those behaviors explicitly. See the [SQLite FTS5 reference](https://www.sqlite.org/fts5.html) for tokenizer and query options.

## Keep the original files

The demo’s index lives only in memory. Selecting files reads them without changing the originals. A worker keeps indexing away from the page’s main thread, and request numbers prevent an old response from replacing newer search results.

A durable application needs more: file watching, incremental updates, deletion handling, crash recovery, and a way to detect a stale index. An external-content FTS table does not automatically follow changes to the source table; maintain it with explicit writes or triggers, or rebuild it.

In [Stone’s search architecture](/blog/markdown-notes-sqlite-search-index), Markdown is intended to be the durable source and the database a rebuildable index. That larger design combines keyword and semantic search. This demo deliberately isolates the keyword part so you can inspect it.

## Reproduce the experiment

Download the [standalone Python script](/research/sqlite-search/benchmark.py) and run:

```sh
python3 benchmark.py > my-results.json
```

Use Python 3.10 or newer with SQLite compiled with FTS5. No third-party Python package is required. The script generates only synthetic text, writes databases into temporary directories, and removes them afterward. Allow a few hundred megabytes of memory and disk space for the largest dataset. It reads no personal notes and makes no network requests.

The JSON contains the runtime versions, CPU, seed, script and corpus hashes, build times, sizes, match counts, and every timing sample. Compare your result with the [published raw run](/research/sqlite-search/results.json). Keep the workload identical before drawing conclusions about a difference in hardware or SQLite version.

The next experiment should use a representative archive and time ranked retrieval, edits, deletions, and startup. This run establishes a reproducible baseline, not a finished search evaluation.
