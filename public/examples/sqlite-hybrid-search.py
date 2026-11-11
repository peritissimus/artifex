"""A reproducible FTS5 + vector ranking + reciprocal rank fusion example.

Run: python3 sqlite-hybrid-search.py
Requires Python 3.10+ with SQLite FTS5. Uses hand-authored toy vectors, not a
trained embedding model. Vector ranking scans the tiny table; it is not ANN.
"""
import json
import math
import sqlite3


def cosine(left, right):
    a, b = json.loads(left), json.loads(right)
    denominator = math.sqrt(sum(x * x for x in a) * sum(x * x for x in b))
    return sum(x * y for x, y in zip(a, b)) / denominator if denominator else 0.0


db = sqlite3.connect(":memory:")
db.create_function("cosine", 2, cosine, deterministic=True)
db.executescript("""
CREATE TABLE chunks(id INTEGER PRIMARY KEY, title TEXT, body TEXT, vector TEXT);
CREATE VIRTUAL TABLE chunks_fts USING fts5(title, body, content='chunks', content_rowid='id');
""")
db.executemany("INSERT INTO chunks VALUES (?, ?, ?, ?)", [
    (1, "Redis redelivery", "A Celery Redis visibility timeout can repeat a long task.", "[1, 0, 0]"),
    (2, "Retry-safe jobs", "Make background work idempotent before a worker runs it again.", "[0.9, 0.1, 0]"),
    (3, "Meeting notes", "Transcribe a local audio recording into Markdown.", "[0, 0, 1]"),
])
db.execute("INSERT INTO chunks_fts(chunks_fts) VALUES ('rebuild')")
lexical = [row[0] for row in db.execute(
    "SELECT rowid FROM chunks_fts WHERE chunks_fts MATCH ? ORDER BY bm25(chunks_fts), rowid LIMIT 10",
    ("redis",),
)]
semantic = [row[0] for row in db.execute(
    "SELECT id FROM chunks WHERE cosine(vector, ?) > 0 ORDER BY cosine(vector, ?) DESC, id LIMIT 10",
    ("[1, 0, 0]", "[1, 0, 0]"),
)]
scores = {}
for ranking in (lexical, semantic):
    for rank, chunk_id in enumerate(ranking, start=1):
        scores[chunk_id] = scores.get(chunk_id, 0.0) + 1.0 / (60 + rank)
fused = sorted(scores, key=lambda chunk_id: (-scores[chunk_id], chunk_id))
assert lexical == [1] and semantic == [1, 2] and fused == [1, 2]
assert math.isclose(scores[1], 2 / 61) and math.isclose(scores[2], 1 / 62)
print(json.dumps({
    "fts5": lexical,
    "vector": semantic,
    "rrf": [{"id": chunk_id, "score": round(scores[chunk_id], 6)} for chunk_id in fused],
}, indent=2))
db.close()
