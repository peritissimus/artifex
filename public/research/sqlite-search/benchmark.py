#!/usr/bin/env python3
"""Reproduce with: python3 benchmark.py > results.json (Python 3.10+, SQLite FTS5).
Synthetic English notes; local temporary database; no network or private files.
"""
import hashlib, json, math, os, platform, random, sqlite3, statistics, subprocess, tempfile, time
from datetime import datetime, timezone
from pathlib import Path

SEED = 20261012
SIZES = [1000, 10000, 100000]
REPEATS = 30
QUERIES = ['sqlite', 'orchid', 'release checklist', 'absentterm']
VOCAB = ('meeting project design browser worker latency storage markdown document '
         'client review roadmap testing keyboard interface notes archive backup '
         'network release checklist rendering task schedule memory local search').split()

def notes(count):
    rng = random.Random(SEED)
    for i in range(count):
        words = rng.choices(VOCAB, k=120)
        if i % 10 == 0: words += ['sqlite']
        if i % 1000 == 0: words += ['orchid']
        yield (i + 1, f'Notebook entry {i + 1}', ' '.join(words))

def percentile95(values):
    return sorted(values)[math.ceil(len(values) * .95) - 1]

def run(count):
    with tempfile.TemporaryDirectory(prefix='notes-search-benchmark-') as folder:
        db = sqlite3.connect(str(Path(folder) / 'notes.db'))
        db.execute('PRAGMA journal_mode=DELETE')
        db.execute('CREATE TABLE notes(id INTEGER PRIMARY KEY, title TEXT, body TEXT)')
        rows = list(notes(count))  # generation is outside timed sections
        digest = hashlib.sha256(json.dumps(rows, ensure_ascii=True, separators=(',', ':')).encode()).hexdigest()
        started = time.perf_counter()
        db.executemany('INSERT INTO notes VALUES (?, ?, ?)', rows)
        db.commit()
        insert_ms = (time.perf_counter() - started) * 1000
        before = Path(folder, 'notes.db').stat().st_size
        started = time.perf_counter()
        db.execute("CREATE VIRTUAL TABLE search USING fts5(title, body, content='notes', content_rowid='id', tokenize='unicode61')")
        db.execute("INSERT INTO search(search) VALUES ('rebuild')")
        db.commit()
        build_ms = (time.perf_counter() - started) * 1000
        after = Path(folder, 'notes.db').stat().st_size
        measurements = []
        for term in QUERIES:
            variants = [
                ('fts5', 'SELECT count(*) FROM search WHERE search MATCH ?', '"' + term + '"'),
                ('like', 'SELECT count(*) FROM notes WHERE title LIKE ? OR body LIKE ?', '%' + term + '%'),
            ]
            results, timings = {}, {'fts5': [], 'like': []}
            for repeat in range(5 + REPEATS):
                # Alternate order to reduce a consistent first/second advantage.
                for name, sql, value in variants[::1 if repeat % 2 == 0 else -1]:
                    started = time.perf_counter_ns()
                    result = db.execute(sql, (value,) if name == 'fts5' else (value, value)).fetchone()[0]
                    elapsed = (time.perf_counter_ns() - started) / 1e6
                    results[name] = result
                    if repeat >= 5: timings[name].append(elapsed)
            assert results['fts5'] == results['like'], (term, results)
            measurements.append({'query': term, 'matches': results['fts5'], **{
                name: {'median_ms': statistics.median(samples), 'p95_ms': percentile95(samples), 'samples_ms': samples}
                for name, samples in timings.items()
            }})
        db.close()
        return dict(notes=count, corpus_sha256=digest, insert_ms=insert_ms, index_build_ms=build_ms,
                    database_before_bytes=before, database_after_bytes=after, queries=measurements)

if __name__ == '__main__':
    try:
        cpu = subprocess.check_output(['sysctl', '-n', 'machdep.cpu.brand_string'], text=True).strip() if platform.system() == 'Darwin' else platform.processor()
    except (OSError, subprocess.CalledProcessError):
        cpu = platform.machine()
    print(json.dumps(dict(measured_at=datetime.now(timezone.utc).isoformat(), seed=SEED,
        python=platform.python_version(), sqlite=sqlite3.sqlite_version, os=platform.platform(), cpu=cpu,
        logical_cpus=os.cpu_count(), warmups=5, repeats=REPEATS, timing='warm count query, not ranked retrieval; milliseconds',
        script_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), results=[run(n) for n in SIZES]), indent=2))
