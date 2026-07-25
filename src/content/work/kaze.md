---
title: Kaze
company: Kaze
kind: personal
role: Engineer
description: A local code-search CLI for finding relevant files, functions, classes, and methods with natural-language queries.
dateRange: '2025'
sortDate: 2025-03-12
location: Independent
order: 108
technologies: [Python, SQLite, Tree-sitter, OpenAI Embeddings, Click, Rich]
achievements:
  - '**Two levels of retrieval** — Searches whole files for orientation and individual functions, classes, and methods for precision'
  - '**Language-aware chunks** — Uses Tree-sitter when available while preserving parent-child relationships between code elements'
  - '**Local project index** — Stores embeddings and metadata in a portable SQLite database inside the indexed project'
externalUrl: https://github.com/peritissimus/kaze
outcome: 'Kaze made unfamiliar codebases queryable in the same language used to describe the problem, without requiring a hosted indexing service.'
---

Text search works when you know the word the code uses. It is much less helpful when you only know the behavior you are looking for. Kaze is a command-line tool for that earlier moment: ask where database retries happen or how files are parsed, then retrieve the source most likely to answer the question.

**It began as a navigation problem.** In an unfamiliar repository, I often knew what the system did before I knew its filenames, symbols, or internal vocabulary. Opening a hosted indexing product felt excessive for a question that belonged inside the terminal. Kaze turns the project itself into a queryable local index.

**Two indexes answer two kinds of question.** Whole-file embeddings help with orientation: which files appear to own authentication, persistence, or parsing? Code-chunk embeddings add precision by extracting functions, classes, and methods. When Tree-sitter is available, Kaze preserves their parent-child relationships, so a matching method can still be understood inside its class instead of appearing as an isolated fragment.

**The result should lead back to code.** A query can return ranked matches, similarity scores, source content, and surrounding lines. Chunk results can be filtered by type or inspected with their ancestors and children. Human-readable output supports exploration; JSON output lets another script or agent use the same retrieval layer.

**The index stays with the repository.** Kaze stores embeddings and metadata in a `.kaze` SQLite database inside the project. Write-ahead logging, connection reuse, and retry handling keep batch indexing practical without introducing a hosted service. The database is disposable: force a rebuild when the code changes substantially, or remove it without affecting the source.

Kaze is personal software because it fits the way I enter a codebase. It does not try to replace `rg`, an editor, or a language server. It handles the one gap between a question in plain language and the first useful symbol to inspect.
