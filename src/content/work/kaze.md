---
title: Kaze
company: Kaze
kind: personal
role: Engineer
description: A semantic code-search CLI that embeds files and code chunks for natural-language retrieval.
dateRange: '2025'
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

Kaze is a command-line tool for asking a codebase questions before you know which filenames or symbols matter. It creates a semantic index of project files and lets natural-language queries retrieve the most relevant source and surrounding context.

For broader questions, Kaze embeds complete files. For precise questions, it extracts functions, classes, and methods into hierarchical chunks, retaining enough structural information to show how a result fits into its parent code.

The index lives with the project in SQLite, and both human-readable and JSON output make the tool useful interactively or as a building block in larger developer workflows.
