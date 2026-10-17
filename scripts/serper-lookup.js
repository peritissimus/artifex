#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, parseEnv } from 'node:util';

const HELP = `Usage: node scripts/serper-lookup.js --query "applied AI engineering" [options]

  --query TEXT    Repeat for up to 10 unique queries; one API request per query.
  --country CODE Google country code (default: us).
  --language CODE Google language code (default: en).
  --num N         Organic results requested, 1–10 (default: 10).
  --domain HOST   Domain to check (default: peritissimus.com).
  --out DIR       Dated JSON directory (default: output/seo).
  --dry-run       Print the request plan without calling Serper or saving files.
  --help          Show this help.

Reads SERPER_API_URL and SERPER_API_KEY from the environment or .env.
The URL may be https://google.serper.dev or its /search endpoint.
Live runs consume Serper credits. No retries or automatic keyword expansion.
SERP positions and suggestions are not monthly search volume or SEO difficulty.
`;

export class LookupError extends Error {}

export function parseOptions(args) {
  let parsed;
  try {
    parsed = parseArgs({
      args,
      options: {
        query: { type: 'string', multiple: true },
        country: { type: 'string', default: 'us' },
        language: { type: 'string', default: 'en' },
        num: { type: 'string', default: '10' },
        domain: { type: 'string', default: 'peritissimus.com' },
        out: { type: 'string', default: 'output/seo' },
        'dry-run': { type: 'boolean', default: false },
        help: { type: 'boolean', default: false },
      },
    });
  } catch {
    throw new LookupError('Invalid command options. Run with --help for usage.');
  }
  const { values } = parsed;
  if (values.help) return { help: true };

  const queries = [...new Set((values.query ?? []).map((q) => q.trim()))];
  if (!queries.length || queries.length > 10 || queries.some((q) => !q || q.length > 500)) {
    throw new LookupError('Supply 1–10 nonempty --query values, each at most 500 characters.');
  }
  const country = values.country.toLowerCase();
  const language = values.language.toLowerCase();
  const num = Number(values.num);
  const domain = values.domain.toLowerCase().replace(/^www\./, '');
  if (!/^[a-z]{2}$/.test(country)) throw new LookupError('--country must be a two-letter code.');
  if (!/^[a-z]{2,3}(-[a-z]{2,4})?$/.test(language)) {
    throw new LookupError('--language must be a language code such as en.');
  }
  if (!Number.isInteger(num) || num < 1 || num > 10) {
    throw new LookupError('--num must be an integer from 1 to 10.');
  }
  if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(domain)) {
    throw new LookupError('--domain must be a hostname, without a URL path.');
  }
  if (!values.out.trim()) throw new LookupError('--out must be a directory.');
  return { queries, country, language, num, domain, out: values.out, dryRun: values['dry-run'] };
}

export function searchEndpoint(value = 'https://google.serper.dev') {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new LookupError('SERPER_API_URL must be the official HTTPS Serper URL.');
  }
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'google.serper.dev' ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !['/', '/search', '/search/'].includes(url.pathname)
  ) {
    throw new LookupError(
      'SERPER_API_URL must be https://google.serper.dev or its /search endpoint.'
    );
  }
  return 'https://google.serper.dev/search';
}

export async function readConfig(env = process.env, envFile = resolve('.env')) {
  let local = {};
  try {
    local = parseEnv(await readFile(envFile, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw new LookupError('Could not read the local .env file.');
  }
  return {
    apiUrl: searchEndpoint(env.SERPER_API_URL ?? local.SERPER_API_URL),
    apiKey: (env.SERPER_API_KEY ?? local.SERPER_API_KEY ?? '').trim(),
  };
}

export function requestBody(query, options) {
  return { q: query, gl: options.country, hl: options.language, num: options.num };
}

export async function fetchSearch(config, body, fetchImpl = globalThis.fetch) {
  if (!config.apiKey) throw new LookupError('Set SERPER_API_KEY in your environment or .env.');
  let response;
  try {
    response = await fetchImpl(config.apiUrl, {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(20_000),
      headers: { 'X-API-KEY': config.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new LookupError('Serper request failed or timed out. No automatic retry was made.');
  }
  if (!response.ok) {
    const hint =
      {
        401: ' Check SERPER_API_KEY.',
        403: ' Check API access and available credits.',
        429: ' Rate limited; try later.',
      }[response.status] ?? '';
    throw new LookupError(
      `Serper returned HTTP ${response.status}.${hint} No automatic retry was made.`
    );
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new LookupError('Serper returned invalid JSON.');
  }
  if (!data || !Array.isArray(data.organic)) {
    throw new LookupError('Serper returned an unexpected response without an organic result list.');
  }
  return data;
}

export function summarizeResults(data, domain) {
  const organic = data.organic.map(({ position, title, link, snippet }) => ({
    position: Number.isInteger(position) ? position : null,
    title,
    link,
    snippet,
  }));
  const ownResults = organic.filter(({ link }) => {
    try {
      const host = new URL(link).hostname.toLowerCase();
      return host === domain || host.endsWith(`.${domain}`);
    } catch {
      return false;
    }
  });
  return {
    organic,
    ownResults,
    visibility: ownResults.length
      ? 'Present in the returned organic results; not a fixed or universal rank.'
      : 'Not present in the returned organic results; this does not mean unindexed or never ranking.',
    relatedSearches: (Array.isArray(data.relatedSearches) ? data.relatedSearches : [])
      .map((item) => item?.query)
      .filter(Boolean),
    peopleAlsoAsk: (Array.isArray(data.peopleAlsoAsk) ? data.peopleAlsoAsk : [])
      .map((item) => item?.question)
      .filter(Boolean),
    monthlySearchVolume: null,
    seoDifficulty: null,
    limitations:
      'One country/language SERP snapshot, not GSC performance or a trend. Suggestions do not measure monthly search demand. Null metrics mean unavailable, not zero.',
  };
}

export function redact(text, secret) {
  if (!secret) return text;
  const escaped = JSON.stringify(secret).slice(1, -1);
  return text.split(secret).join('[REDACTED]').split(escaped).join('[REDACTED]');
}

export async function saveSnapshot(snapshot, out, apiKey) {
  await mkdir(out, { recursive: true });
  const name = `serper-${snapshot.requestedAt.replace(/[:.]/g, '-')}-${randomUUID()}.json`;
  const path = resolve(out, name);
  await writeFile(path, redact(`${JSON.stringify(snapshot, null, 2)}\n`, apiKey), {
    flag: 'wx',
    mode: 0o600,
  });
  return path;
}

export async function main(args = process.argv.slice(2)) {
  const options = parseOptions(args);
  if (options.help) {
    console.log(HELP);
    return;
  }
  const config = await readConfig();
  const bodies = options.queries.map((query) => requestBody(query, options));
  if (options.dryRun) {
    console.log(
      redact(
        JSON.stringify({ endpoint: config.apiUrl, requests: bodies, networkCalls: 0 }, null, 2),
        config.apiKey
      )
    );
    return;
  }
  if (!config.apiKey) throw new LookupError('Set SERPER_API_KEY in your environment or .env.');
  const out = resolve(options.out);
  await mkdir(out, { recursive: true });
  console.log(
    `${bodies.length} Serper request(s); country=${options.country}, language=${options.language}.`
  );
  for (const body of bodies) {
    const requestedAt = new Date().toISOString();
    const data = await fetchSearch(config, body);
    const summary = summarizeResults(data, options.domain);
    const snapshot = {
      provider: 'serper.dev',
      endpoint: config.apiUrl,
      requestedAt,
      receivedAt: new Date().toISOString(),
      request: body,
      domain: options.domain,
      summary,
      raw: data,
    };
    const path = await saveSnapshot(snapshot, out, config.apiKey);
    console.log(
      redact(
        `${JSON.stringify(body.q)}: ${summary.organic.length} organic results; ${summary.ownResults.length} domain match(es).`,
        config.apiKey
      )
    );
    console.log(redact(`Saved ${path}`, config.apiKey));
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    // Print only errors created here, never fetch errors, response bodies, or headers.
    console.error(
      error instanceof LookupError
        ? error.message
        : 'Lookup failed. Check the output directory and configuration. Earlier saved results are preserved.'
    );
    process.exitCode = 1;
  });
}
