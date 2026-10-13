import sqlite3InitModule, { type Database } from '@sqlite.org/sqlite-wasm';
import wasmUrl from '@sqlite.org/sqlite-wasm/sqlite3.wasm?url';

// The runtime accepts Emscripten options; the package declaration omits them.
const initialize = sqlite3InitModule as (options: {
  locateFile: () => string;
}) => ReturnType<typeof sqlite3InitModule>;
const sqliteReady = initialize({ locateFile: () => wasmUrl });
let db: Database | undefined;
self.onmessage = async ({ data }) => {
  try {
    const sqlite = await sqliteReady;
    if (data.type === 'load') {
      // Build a replacement first; preserve the existing index if import fails.
      const replacement = new sqlite.oo1.DB(':memory:');
      try {
        replacement.exec(
          "CREATE VIRTUAL TABLE notes USING fts5(title, body, tokenize='unicode61')"
        );
        replacement.exec('BEGIN');
        for (const note of data.notes)
          replacement.exec({
            sql: 'INSERT INTO notes(title, body) VALUES (?, ?)',
            bind: [note.title, note.body],
          });
        replacement.exec('COMMIT');
      } catch (error) {
        replacement.close();
        throw error;
      }
      db?.close();
      db = replacement;
      self.postMessage({
        type: 'ready',
        id: data.id,
        count: data.notes.length,
        version: sqlite.version.libVersion,
      });
    } else if (data.type === 'search' && db) {
      const quote = (value: string) => '"' + value.replaceAll('"', '""') + '"';
      const words = data.query.trim().split(/\s+/).filter(Boolean);
      const query = data.phrase ? quote(data.query.trim()) : words.map(quote).join(' AND ');
      const start = performance.now();
      const count = db.selectValue('SELECT count(*) FROM notes WHERE notes MATCH ?', [query]);
      const rows = db.exec({
        sql: "SELECT title, snippet(notes, 1, '', '', '…', 36) AS excerpt FROM notes WHERE notes MATCH ? ORDER BY rank LIMIT 20",
        bind: [query],
        rowMode: 'object',
        returnValue: 'resultRows',
      });
      self.postMessage({
        type: 'results',
        id: data.id,
        count,
        rows,
        ms: performance.now() - start,
      });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      id: data.id,
      message: 'Search could not complete. Reload the sample notes and try again.',
    });
  }
};
