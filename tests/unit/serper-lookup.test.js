import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, before, describe, it, mock } from 'node:test';
import { inspect } from 'node:util';
import {
  LookupError,
  fetchSearch,
  parseOptions,
  readConfig,
  redact,
  requestBody,
  saveSnapshot,
  searchEndpoint,
  summarizeResults,
} from '../../scripts/serper-lookup.js';

const TEST_KEY = 'unit-test-only-not-a-real-api-key';
const ENDPOINT = 'https://google.serper.dev/search';
const CONFIG = { apiUrl: ENDPOINT, apiKey: TEST_KEY };

before(() => {
  mock.method(globalThis, 'fetch', () => assert.fail('Real network access is forbidden.'));
});

after(() => {
  const calls = globalThis.fetch.mock.callCount();
  mock.restoreAll();
  assert.equal(calls, 0, 'Every fetchSearch call must inject an offline fetch implementation.');
});

async function tempDirectory(t) {
  const directory = await mkdtemp(join(tmpdir(), 'serper-lookup-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

function safeFailure(pattern) {
  return (error) => {
    assert.ok(error instanceof LookupError);
    assert.match(error.message, pattern);
    assert.ok(!inspect(error, { showHidden: true, depth: null }).includes(TEST_KEY));
    return true;
  };
}

describe('Serper command options', () => {
  it('trims and deduplicates queries while preserving order and explicit defaults', () => {
    assert.deepEqual(
      parseOptions([
        '--query',
        ' personal software ',
        '--query',
        'personal software',
        '--query',
        'AI',
      ]),
      {
        queries: ['personal software', 'AI'],
        country: 'us',
        language: 'en',
        num: 10,
        domain: 'peritissimus.com',
        out: 'output/seo',
        dryRun: false,
      }
    );
  });

  it('accepts ten unique queries and counts duplicates only once toward the limit', () => {
    const args = Array.from({ length: 10 }, (_, i) => ['--query', `query ${i}`]).flat();
    assert.equal(parseOptions([...args, '--query', 'query 0']).queries.length, 10);
    assert.equal(parseOptions(['--query', 'x'.repeat(500)]).queries[0].length, 500);
    assert.throws(() => parseOptions([...args, '--query', 'query 10']), /1–10/);
    for (const args of [[], ['--query', '  '], ['--query', 'x'.repeat(501)]]) {
      assert.throws(() => parseOptions(args), /nonempty/);
    }
  });

  it('normalizes targeting options without adding extra request fields', () => {
    const options = parseOptions([
      '--query',
      'AI',
      '--country',
      'IN',
      '--language',
      'EN-US',
      '--num',
      '3',
      '--domain',
      'WWW.Peritissimus.COM',
      '--out',
      'temporary-output',
      '--dry-run',
    ]);
    assert.equal(options.domain, 'peritissimus.com');
    assert.equal(options.dryRun, true);
    assert.equal(options.out, 'temporary-output');
    assert.deepEqual(requestBody('AI', options), { q: 'AI', gl: 'in', hl: 'en-us', num: 3 });
    assert.deepEqual(parseOptions(['--help']), { help: true });
  });

  it('rejects invalid targeting and malformed options without echoing supplied values', () => {
    for (const [name, value] of [
      ['country', 'USA'],
      ['language', 'english'],
      ['num', '0'],
      ['num', '11'],
      ['num', '1.5'],
      ['num', 'NaN'],
      ['domain', 'https://peritissimus.com/path'],
      ['out', ' '],
    ]) {
      assert.throws(() => parseOptions(['--query', 'AI', `--${name}`, value]), LookupError);
    }
    assert.throws(
      () => parseOptions(['--query', 'AI', '--unknown', TEST_KEY]),
      safeFailure(/Invalid command options/)
    );
  });
});

describe('Serper endpoint and isolated configuration', () => {
  it('normalizes the official root and search URLs', () => {
    for (const url of [
      undefined,
      'https://google.serper.dev',
      'https://google.serper.dev/',
      'https://google.serper.dev/search',
      'https://google.serper.dev/search/',
    ]) {
      assert.equal(searchEndpoint(url), ENDPOINT);
    }
  });

  it('rejects insecure, credential-bearing, nonofficial and nonsearch endpoints', () => {
    for (const url of [
      'not a URL',
      'http://google.serper.dev',
      'https://example.invalid/search',
      'https://google.serper.dev.example.invalid/search',
      'https://google.serper.dev:8443/search',
      `https://${TEST_KEY}@google.serper.dev/search`,
      `https://user:${TEST_KEY}@google.serper.dev/search`,
      'https://google.serper.dev/news',
      'https://google.serper.dev/search?key=secret',
      'https://google.serper.dev/search#fragment',
    ]) {
      assert.throws(() => searchEndpoint(url), safeFailure(/SERPER_API_URL/));
    }
  });

  it('reads only its own temporary env file and honors environment-key precedence', async (t) => {
    const directory = await tempDirectory(t);
    const file = join(directory, '.env');
    await writeFile(
      file,
      'SERPER_API_URL=https://google.serper.dev/search/\nSERPER_API_KEY=" local-test-only "\n'
    );
    assert.deepEqual(await readConfig({}, file), { apiUrl: ENDPOINT, apiKey: 'local-test-only' });
    assert.deepEqual(await readConfig({ SERPER_API_KEY: ` ${TEST_KEY} ` }, file), CONFIG);
    assert.equal((await readConfig({ SERPER_API_KEY: '' }, file)).apiKey, '');
    await writeFile(
      file,
      'SERPER_API_URL=https://untrusted.invalid\nSERPER_API_KEY=local-test-only\n'
    );
    assert.deepEqual(
      await readConfig({ SERPER_API_URL: ENDPOINT, SERPER_API_KEY: TEST_KEY }, file),
      CONFIG
    );
    assert.deepEqual(await readConfig({}, join(directory, 'missing.env')), {
      apiUrl: ENDPOINT,
      apiKey: '',
    });
  });

  it('reports an unreadable env fixture without leaking file paths or contents', async (t) => {
    const directory = await tempDirectory(t);
    await assert.rejects(readConfig({}, directory), (error) => {
      assert.ok(safeFailure(/Could not read the local .env file/)(error));
      assert.ok(!error.message.includes(directory));
      return true;
    });
  });
});

describe('offline Serper requests', () => {
  it('sends one JSON POST with the API header, blocked redirects and a 20-second timeout', async (t) => {
    const controller = new AbortController();
    t.mock.method(AbortSignal, 'timeout', (duration) => {
      assert.equal(duration, 20_000);
      return controller.signal;
    });
    const body = { q: 'personal software', gl: 'in', hl: 'en', num: 3 };
    const result = { organic: [] };
    const calls = [];
    const actual = await fetchSearch(CONFIG, body, async (url, options) => {
      calls.push({ url, options });
      return { ok: true, json: async () => result };
    });
    assert.equal(actual, result);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, ENDPOINT);
    assert.equal(calls[0].options.method, 'POST');
    assert.equal(calls[0].options.redirect, 'error');
    assert.equal(calls[0].options.signal, controller.signal);
    assert.deepEqual(calls[0].options.headers, {
      'X-API-KEY': TEST_KEY,
      'Content-Type': 'application/json',
    });
    assert.deepEqual(JSON.parse(calls[0].options.body), body);
  });

  it('fails before making a request when the key is missing', async () => {
    let calls = 0;
    await assert.rejects(
      fetchSearch({ apiUrl: ENDPOINT, apiKey: '' }, {}, async () => {
        calls += 1;
      }),
      /Set SERPER_API_KEY/
    );
    assert.equal(calls, 0);
  });

  it('sanitizes fetch failures and never retries', async () => {
    let calls = 0;
    await assert.rejects(
      fetchSearch(CONFIG, {}, async () => {
        calls += 1;
        throw new Error(`Request headers contained ${TEST_KEY}`);
      }),
      safeFailure(/failed or timed out.*No automatic retry/)
    );
    assert.equal(calls, 1);
  });

  it('propagates timeout cancellation as a safe failure without waiting or retrying', async (t) => {
    t.mock.method(AbortSignal, 'timeout', () => {
      const controller = new AbortController();
      queueMicrotask(() => controller.abort(new DOMException(TEST_KEY, 'TimeoutError')));
      return controller.signal;
    });
    let calls = 0;
    await assert.rejects(
      fetchSearch(CONFIG, {}, async (_, { signal }) => {
        calls += 1;
        return new Promise((_, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason), { once: true });
        });
      }),
      safeFailure(/failed or timed out/)
    );
    assert.equal(calls, 1);
  });

  for (const status of [401, 403, 429, 500]) {
    it(`does not read or expose an HTTP ${status} error body or retry`, async () => {
      let calls = 0;
      let bodyReads = 0;
      const readBody = async () => {
        bodyReads += 1;
        return TEST_KEY;
      };
      await assert.rejects(
        fetchSearch(CONFIG, {}, async () => {
          calls += 1;
          return { ok: false, status, statusText: TEST_KEY, text: readBody, json: readBody };
        }),
        safeFailure(new RegExp(`HTTP ${status}.*No automatic retry`))
      );
      assert.equal(calls, 1);
      assert.equal(bodyReads, 0);
    });
  }

  it('sanitizes invalid JSON and rejects missing organic results without exposing payloads', async () => {
    let calls = 0;
    await assert.rejects(
      fetchSearch(CONFIG, {}, async () => {
        calls += 1;
        return {
          ok: true,
          json: async () => {
            throw new Error(TEST_KEY);
          },
        };
      }),
      safeFailure(/invalid JSON/)
    );
    assert.equal(calls, 1);
    for (const data of [null, { error: TEST_KEY }, { organic: null, error: TEST_KEY }]) {
      let attempts = 0;
      await assert.rejects(
        fetchSearch(CONFIG, {}, async () => {
          attempts += 1;
          return { ok: true, json: async () => data };
        }),
        safeFailure(/without an organic result list/)
      );
      assert.equal(attempts, 1);
    }
  });
});

describe('search interpretation and redacted snapshots', () => {
  it('matches the target hostname and its subdomains, not lookalikes or URL text', () => {
    const links = [
      'https://PERITISSIMUS.COM/work/stone',
      'https://www.peritissimus.com/',
      'https://notes.peritissimus.com/search',
      'https://notperitissimus.com/',
      'https://peritissimus.com.attacker.invalid/',
      'https://peritissimus.com@attacker.invalid/',
      'https://example.invalid/?q=peritissimus.com',
      'not a URL',
    ];
    const result = summarizeResults(
      { organic: links.map((link, i) => ({ link, position: i + 1 })) },
      'peritissimus.com'
    );
    assert.deepEqual(
      result.ownResults.map(({ link }) => link),
      links.slice(0, 3)
    );
    assert.match(result.visibility, /not a fixed or universal rank/);
  });

  it('preserves unknown positions and demand metrics as null instead of inventing values', () => {
    const result = summarizeResults(
      {
        organic: [{ position: '1', link: 'https://example.invalid/' }, { position: 2.5 }, {}],
        relatedSearches: [null, {}, { query: '' }, { query: 'local-first software' }],
        peopleAlsoAsk: [null, { question: 'What is personal software?' }],
        monthlySearchVolume: 1234,
        seoDifficulty: 1,
      },
      'peritissimus.com'
    );
    assert.deepEqual(
      result.organic.map(({ position }) => position),
      [null, null, null]
    );
    assert.deepEqual(result.relatedSearches, ['local-first software']);
    assert.deepEqual(result.peopleAlsoAsk, ['What is personal software?']);
    assert.equal(result.monthlySearchVolume, null);
    assert.equal(result.seoDifficulty, null);
    assert.match(result.visibility, /does not mean unindexed or never ranking/);
    assert.match(result.limitations, /Null metrics mean unavailable, not zero/);
    const absent = summarizeResults(
      { organic: [], relatedSearches: {}, peopleAlsoAsk: {} },
      'peritissimus.com'
    );
    assert.deepEqual(absent.relatedSearches, []);
    assert.deepEqual(absent.peopleAlsoAsk, []);
  });

  it('redacts all literal and JSON-escaped copies while preserving valid JSON', () => {
    const key = 'unit-test-"quoted"\\path\nend';
    assert.equal(redact(`before ${key} after ${key}`, key), 'before [REDACTED] after [REDACTED]');
    const original = JSON.stringify({ echoed: key, nested: [key], public: 'unchanged' });
    const sanitized = redact(original, key);
    assert.ok(!sanitized.includes(key));
    assert.ok(!sanitized.includes(JSON.stringify(key).slice(1, -1)));
    assert.deepEqual(JSON.parse(sanitized), {
      echoed: '[REDACTED]',
      nested: ['[REDACTED]'],
      public: 'unchanged',
    });
    assert.equal(redact('public text', ''), 'public text');
  });

  it('saves distinct dated private snapshots without overwriting or persisting the key', async (t) => {
    const directory = await tempDirectory(t);
    const out = join(directory, 'snapshots');
    const key = 'unit-test-"quoted"\\path\nend';
    const snapshot = {
      requestedAt: '2026-10-17T12:00:00.000Z',
      request: { q: 'AI' },
      raw: { echoed: key },
    };
    const first = await saveSnapshot(snapshot, out, key);
    const second = await saveSnapshot(snapshot, out, key);
    assert.equal(dirname(first), out);
    assert.notEqual(first, second);
    assert.equal((await readdir(out)).length, 2);
    for (const path of [first, second]) {
      const contents = await readFile(path, 'utf8');
      assert.ok(!contents.includes(key));
      assert.ok(!contents.includes(JSON.stringify(key).slice(1, -1)));
      assert.deepEqual(JSON.parse(contents), { ...snapshot, raw: { echoed: '[REDACTED]' } });
      if (process.platform !== 'win32') assert.equal((await stat(path)).mode & 0o777, 0o600);
    }
  });
});
