/**
 * Runs the built site (`dist/`) in Cloudflare's Pages runtime via
 * `wrangler pages dev` — static assets, `_headers`, `_routes.json`, and
 * `functions/` together — and checks what agents get back over HTTP.
 *
 * Needs a build first: `pnpm build && pnpm test:pages`.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { after, before, describe, it } from 'node:test';

const SITE_URL = 'https://peritissimus.com';
const DIST = new URL('../../dist/', import.meta.url);
const BROWSER = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
/** Sitemap pages with no markdown twin (custom layouts outside Base). */
const HTML_ONLY = new Set(['/newspaper']);

let origin;
let wrangler;

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer().listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

before(async () => {
  assert.ok(existsSync(new URL('index.html', DIST)), 'dist/ is missing — run `pnpm build` first');

  const port = await freePort();
  origin = `http://127.0.0.1:${port}`;
  wrangler = spawn(
    'pnpm',
    [
      'exec',
      'wrangler',
      'pages',
      'dev',
      'dist',
      '--ip',
      '127.0.0.1',
      '--port',
      String(port),
      '--compatibility-date',
      '2025-01-17',
      '--log-level',
      'error',
    ],
    {
      cwd: new URL('../../', import.meta.url),
      env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
      detached: true,
      stdio: 'ignore',
    }
  );

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      await fetch(origin);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error('wrangler pages dev did not start within 60s');
});

after(() => {
  if (wrangler?.pid) process.kill(-wrangler.pid, 'SIGTERM');
});

const get = (path, accept, init = {}) =>
  fetch(`${origin}${path}`, {
    redirect: 'manual',
    ...init,
    headers: accept ? { Accept: accept } : {},
  });

/** Route paths listed in the sitemap, e.g. `/`, `/about`, `/blog/<slug>`. */
function sitemapPaths() {
  const xml = readFileSync(new URL('sitemap-0.xml', DIST), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => new URL(loc).pathname);
}

function assertSecurityHeaders(response) {
  assert.match(response.headers.get('Strict-Transport-Security') ?? '', /max-age=/);
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(response.headers.get('X-Frame-Options'), 'DENY');
}

describe('markdown content negotiation', () => {
  it('serves every sitemap page as HTML or markdown from the same URL', async () => {
    for (const path of sitemapPaths()) {
      const html = await get(path, BROWSER);
      assert.equal(html.status, 200, path);
      assert.match(html.headers.get('Content-Type'), /^text\/html/, path);
      assert.match(html.headers.get('Vary'), /^Accept, Accept-Encoding/, path);
      const page = await html.text();

      if (HTML_ONLY.has(path)) {
        assert.doesNotMatch(page, /type="text\/markdown"/, path);
        assert.equal((await get(path, 'text/markdown')).status, 406, path);
        continue;
      }

      const twin = path === '/' ? '/index.md' : `${path}.md`;
      assert.match(
        page,
        new RegExp(`<link rel="alternate" type="text/markdown" href="${SITE_URL}${twin}">`),
        path
      );
      assert.equal(
        html.headers.get('Link')?.includes(`<${twin}>; rel="alternate"; type="text/markdown"`),
        true,
        path
      );

      const markdown = await get(path, 'text/markdown');
      assert.equal(markdown.status, 200, path);
      assert.equal(markdown.headers.get('Content-Type'), 'text/markdown; charset=utf-8', path);
      assert.equal(markdown.headers.get('Vary'), 'Accept, Accept-Encoding', path);
      assert.equal(markdown.headers.get('Content-Location'), twin, path);
      assertSecurityHeaders(markdown);
      assert.match(await markdown.text(), /^# \S/, path);
    }
  });

  it('honours q-values and the order agents list types in', async () => {
    const type = async (accept) => (await get('/about', accept)).headers.get('Content-Type');
    assert.match(await type('text/markdown, text/html, */*'), /^text\/markdown/);
    assert.match(await type('text/html;q=0.5, text/markdown'), /^text\/markdown/);
    assert.match(await type('text/markdown;q=0.5, text/html'), /^text\/html/);
    assert.match(await type('*/*'), /^text\/html/);
    assert.match(await type(undefined), /^text\/html/);
  });

  it('rejects unsupported types with 406', async () => {
    const response = await get('/about', 'application/json');
    assert.equal(response.status, 406);
    assert.equal(response.headers.get('Content-Type'), 'text/plain; charset=utf-8');
    assert.equal(response.headers.get('Vary'), 'Accept, Accept-Encoding');
    assertSecurityHeaders(response);
  });

  it('serves .md URLs directly, with a canonical link to the HTML page', async () => {
    const response = await get('/blog/scaling-llm-applications.md');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
    assert.equal(
      response.headers.get('Link'),
      `<${SITE_URL}/blog/scaling-llm-applications>; rel="canonical"`
    );
  });
});

describe('agent-friendly 404', () => {
  const missing = '/some-path-that-does-not-exist';

  it('returns a real 404 with a markdown body pointing at the indexes', async () => {
    const response = await get(missing, 'text/markdown');
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
    assertSecurityHeaders(response);
    const body = await response.text();
    assert.match(body, /^# 404/);
    assert.match(body, /\(https:\/\/peritissimus\.com\/llms\.txt\)/);
    assert.match(body, /\(https:\/\/peritissimus\.com\/sitemap-index\.xml\)/);
  });

  it('returns a real 404 to browsers and default clients too', async () => {
    for (const accept of [BROWSER, '*/*', undefined]) {
      const response = await get(missing, accept);
      assert.equal(response.status, 404, String(accept));
      const body = await response.text();
      assert.match(body, /href="\/llms\.txt"/);
      assert.match(body, /href="\/sitemap-index\.xml"/);
    }
  });
});

describe('llms.txt', () => {
  it('follows the llmstxt.org layout', async () => {
    const response = await get('/llms.txt');
    assert.equal(response.status, 200);
    assert.match(response.headers.get('Content-Type'), /^text\/plain/);
    const lines = (await response.text()).trimEnd().split('\n');

    assert.equal(lines[0], '# peritissimus', 'starts with an H1 naming the site');
    assert.match(lines[2], /^> \S/, 'then a blockquote summary');
    assert.equal(lines.filter((line) => /^# /.test(line)).length, 1, 'only one H1');
    assert.ok(!lines.some((line) => /^#{3,} /.test(line)), 'no headings below H2');

    // After the first H2, every non-blank line is a heading or a file-list entry.
    const firstSection = lines.findIndex((line) => line.startsWith('## '));
    for (const line of lines.slice(firstSection).filter(Boolean)) {
      assert.match(line, /^(## .+|- \[[^\]]+\]\([^)\s]+\)(: .+)?)$/, line);
    }
  });

  it('tells agents when to use the site', async () => {
    const text = await (await get('/llms.txt')).text();
    const section = text.split('## When to use this site\n')[1]?.split('\n## ')[0] ?? '';
    const entries = section.split('\n').filter((line) => line.startsWith('- ['));
    assert.ok(entries.length >= 5, 'names the jobs the site is right for');
    for (const entry of entries) assert.match(entry, /\): Use when /, entry);
    assert.match(text, /Accept: text\/markdown/, 'says how to fetch markdown');
  });

  it('links only to URLs that resolve', async () => {
    const text = await (await get('/llms.txt')).text();
    const urls = [...text.matchAll(/\]\((https:\/\/peritissimus\.com[^)]*)\)/g)].map(
      ([, url]) => url
    );
    assert.ok(urls.length > 20);
    for (const url of urls) {
      const response = await get(new URL(url).pathname);
      assert.equal(response.status, 200, url);
      if (url.endsWith('.md')) {
        assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8', url);
      }
    }
  });
});

describe('structured data', () => {
  it('describes the person behind the site with contact point and address', async () => {
    const html = await (await get('/', BROWSER)).text();
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(
      ([, json]) => JSON.parse(json)
    );
    const person = blocks.find((block) => block['@type'] === 'Person');
    const website = blocks.find((block) => block['@type'] === 'WebSite');

    assert.equal(person.contactPoint['@type'], 'ContactPoint');
    assert.match(person.contactPoint.email, /@/);
    assert.ok(person.contactPoint.contactType);
    assert.equal(person.address['@type'], 'PostalAddress');
    assert.ok(person.address.addressLocality && person.address.addressCountry);
    assert.equal(website.name, 'peritissimus');
    assert.equal(website.publisher['@id'], person['@id']);
  });
});

describe('static files stay off the Function', () => {
  it('keeps _routes.json within Cloudflare limits', () => {
    const routes = JSON.parse(readFileSync(new URL('_routes.json', DIST), 'utf8'));
    assert.equal(routes.version, 1);
    assert.ok(routes.include.length >= 1);
    assert.ok(routes.include.length + routes.exclude.length <= 100);
    for (const rule of [...routes.include, ...routes.exclude]) assert.ok(rule.length <= 100, rule);
  });

  it('still serves feeds and indexes unchanged', async () => {
    for (const path of [
      '/robots.txt',
      '/rss.xml',
      '/sitemap-index.xml',
      '/.well-known/security.txt',
    ]) {
      const response = await get(path, 'text/markdown');
      assert.equal(response.status, 200, path);
      assert.equal(response.headers.get('Vary'), null, path);
    }
  });
});
