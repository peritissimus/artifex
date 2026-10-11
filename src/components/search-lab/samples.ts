export const sampleNotes = [
  {
    title: 'A rebuildable notes index',
    body: '# Storage\nMarkdown files hold the durable copy. SQLite FTS5 provides keyword search. Rebuild the index when files change; keep backups of the original notes.',
  },
  {
    title: 'Release checklist',
    body: '# Shipping\nThe release checklist covers keyboard navigation, empty search results, mobile layouts, and recovery after an interrupted import.',
  },
  {
    title: 'Quiet mornings',
    body: '# Routine\nRead yesterday’s notes before opening the browser. Write down one task. Leave time for a walk and an orchid on the desk.',
  },
  {
    title: 'Search belongs in a worker',
    body: '# Responsiveness\nRun SQLite in a web worker so indexing does not block typing. Keep a request number and ignore results from an older query.',
  },
  {
    title: 'Local does not mean permanent',
    body: '# Recovery\nAn in-memory database disappears when the tab closes. Browser persistence and file backups need explicit design. Local storage is not a backup.',
  },
  {
    title: 'Tokens versus substrings',
    body: '# Matching\nFTS5 searches tokens: archive does not match archival. A substring scan has different semantics. Test the words your readers actually use.',
  },
];
