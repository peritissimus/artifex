import { markdownDocument, markdownResponse } from '../../lib/markdown';
export const GET = () =>
  markdownResponse(
    markdownDocument({
      title: 'Search Markdown Notes with SQLite FTS5',
      description: 'A browser notes-search demo with a reproducible native SQLite benchmark.',
      path: '/tools/notes-search',
      body: [
        'The interactive HTML demo runs SQLite FTS5 in a web worker. Start with six samples or select up to 100 .md/.txt files, 2 MB total. Files replace the samples and stay in a temporary in-memory index. Refreshing or closing the page clears the index without modifying the originals.',
        'All-words mode matches each literal term; exact-phrase mode matches the phrase. Results are ranked and limited to 20. Markdown is indexed as plain text. This is token search, not semantic or arbitrary substring search.',
        'The browser timer covers the count and ranked-result queries, excluding loading, indexing, messaging, and rendering. It is not directly comparable to the native count-query benchmark.',
        'The demo does not send note text, filenames, or queries to a server. PostHog is disabled on this page; hosting may still collect ordinary page-visit analytics.',
        '[Tutorial and benchmark](https://peritissimus.com/blog/sqlite-fts5-notes-search-benchmark)',
        '[Reproduction script](https://peritissimus.com/research/sqlite-search/benchmark.py) · [Raw results](https://peritissimus.com/research/sqlite-search/results.json)',
        '[Stone hybrid search architecture](https://peritissimus.com/blog/markdown-notes-sqlite-search-index)',
      ],
    })
  );
