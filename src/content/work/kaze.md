---
title: Kaze
company: Kaze
kind: personal
role: Engineer
description: 'A code-search CLI with a local index and natural-language queries, using OpenAI embeddings by default.'
seoTitle: 'Kaze – Natural-Language Code Search CLI with a Local Index'
dateRange: '2025'
sortDate: 2025-03-12
location: Independent
order: 108
technologies: [Python, SQLite, Tree-sitter, OpenAI Embeddings, Click, Rich]
achievements:
  - '**Retrieval** — Whole-file and code-chunk search, with Python chunk extraction'
  - '**Index** — Project-local SQLite storage for embeddings and metadata'
  - '**Model boundary** — OpenAI embeddings by default; indexed code and queries go to the provider'
externalUrl: https://github.com/peritissimus/kaze
updated: 2026-11-12
---

In an unfamiliar repository, I often know the behavior I am looking for before I know its name in the code. I might ask where database retries happen, while the relevant function has a name I would never think to search for. Kaze is a command-line tool for finding a useful starting point from that kind of question.

## Searching files and functions

Kaze builds embeddings: numerical representations used to compare the meaning of a query with source code. Whole-file matches help identify an area of the project. Smaller chunks, such as functions, classes, and methods, narrow the search.

When Tree-sitter is available, it helps extract those chunks while preserving their parent-child relationships. A matching method can be shown with its class and surrounding context. Chunk extraction currently supports Python.

## Returning to the source

Results can include ranked matches, similarity scores, source text, and surrounding lines. I can filter by chunk type or inspect a result's ancestors and children. JSON output lets scripts and agents use the same search.

## Keeping the index with the project

Embeddings and metadata are stored in SQLite under the project's `.kaze` directory. The index can be rebuilt or deleted without changing the source files. Database retries and batched indexing help handle larger runs.

The index is local, but embedding generation depends on the selected model. The default is OpenAI's `text-embedding-3-small`, which sends indexed source text and search queries to OpenAI. A local database does not make that configuration offline.

I use Kaze to get from a description of behavior to a symbol worth inspecting. Once I know the vocabulary, ordinary text search and the editor take over.
