/**
 * Exercises the Cloudflare Pages middleware against a fake asset store, so the
 * negotiation behaviour is verified without booting a Worker runtime.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { onRequest } from '../../functions/_middleware.js';

const HTML_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  // Cloudflare adds this of its own accord; `Vary: Accept` has to survive it.
  Vary: 'Accept-Encoding',
};

/** The subset of `dist/` the tests care about. */
const ASSETS = {
  '/index.html': { body: '<html>home</html>', headers: HTML_HEADERS },
  '/about.html': { body: '<html>about</html>', headers: HTML_HEADERS },
  '/terminal.html': { body: '<html>terminal</html>', headers: HTML_HEADERS },
  '/404.html': { body: '<html>not found</html>', headers: HTML_HEADERS },
  '/index.md': { body: '# peritissimus\n', headers: { 'Content-Type': 'text/markdown' } },
  '/about.md': { body: '# About\n', headers: { 'Content-Type': 'text/markdown' } },
  '/404.md': { body: '# Page not found\n', headers: { 'Content-Type': 'text/markdown' } },
  '/_astro/app.css': { body: 'body{}', headers: { 'Content-Type': 'text/css' } },
};

/** Map a request path to the file the Pages asset server would return. */
function resolve(pathname) {
  if (ASSETS[pathname]) return ASSETS[pathname];
  if (pathname === '/') return ASSETS['/index.html'];
  return ASSETS[`${pathname}.html`] ?? null;
}

/** Serve a path the way the Pages asset server would. */
function serve(pathname) {
  const asset = resolve(pathname);
  if (!asset) {
    const notFound = ASSETS['/404.html'];
    return new Response(notFound.body, { status: 404, headers: notFound.headers });
  }
  return new Response(asset.body, { status: 200, headers: asset.headers });
}

function makeContext(path, { accept, method = 'GET' } = {}) {
  const request = new Request(`https://peritissimus.com${path}`, {
    method,
    headers: accept ? { Accept: accept } : {},
  });

  const fetched = [];
  let nextCalls = 0;

  // Pages advances through the handler chain on every `next()`, so it may only
  // be called once per request. Modelling that here is what catches a
  // middleware that spends it looking for a Markdown twin and then has nothing
  // left to fall back to.
  const next = async (input) => {
    nextCalls += 1;
    if (nextCalls > 1) throw new Error('next() called more than once');

    const target = input ? new URL(input.url) : new URL(request.url);
    fetched.push(target.pathname);
    return serve(target.pathname);
  };

  const env = {
    ASSETS: {
      fetch: async (input) => {
        const target = new URL(input.url);
        fetched.push(target.pathname);
        return serve(target.pathname);
      },
    },
  };

  return { context: { request, next, env }, fetched };
}

/** Lower-cased, whitespace-free members of a comma-separated header. */
function listHeader(response, name) {
  return (response.headers.get(name) ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

describe('HTML requests', () => {
  it('serves the page unchanged and marks it as a negotiated variant', async () => {
    const { context } = makeContext('/about', { accept: 'text/html,*/*;q=0.8' });
    const response = await onRequest(context);

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'text/html; charset=utf-8');
    assert.equal(await response.text(), '<html>about</html>');

    const vary = listHeader(response, 'Vary');
    assert.ok(vary.includes('accept'), 'Vary must include Accept');
    assert.ok(vary.includes('accept-encoding'), 'Vary must keep Accept-Encoding');
  });

  it('advertises the Markdown twin with a Link header', async () => {
    const { context } = makeContext('/about', { accept: 'text/html' });
    const response = await onRequest(context);

    assert.match(
      response.headers.get('Link') ?? '',
      /<\/about\.md>;\s*rel="alternate";\s*type="text\/markdown"/
    );
  });

  it('treats a bare wildcard as a request for HTML', async () => {
    const { context } = makeContext('/about', { accept: '*/*' });
    const response = await onRequest(context);

    assert.equal(response.headers.get('Content-Type'), 'text/html; charset=utf-8');
  });
});

describe('Markdown requests', () => {
  it('returns the twin for a page route', async () => {
    const { context, fetched } = makeContext('/about', { accept: 'text/markdown' });
    const response = await onRequest(context);

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
    assert.equal(await response.text(), '# About\n');
    assert.ok(fetched.includes('/about.md'));
  });

  it('sets Vary: Accept so a CDN cannot cross the two variants', async () => {
    const { context } = makeContext('/about', { accept: 'text/markdown' });
    const response = await onRequest(context);

    const vary = listHeader(response, 'Vary');
    assert.ok(vary.includes('accept'));
    assert.ok(vary.includes('accept-encoding'));
  });

  it('points back at the HTML page as canonical', async () => {
    const { context } = makeContext('/about', { accept: 'text/markdown' });
    const response = await onRequest(context);

    assert.match(response.headers.get('Link') ?? '', /<\/about>;\s*rel="canonical"/);
  });

  it('maps the homepage to /index.md', async () => {
    const { context, fetched } = makeContext('/', { accept: 'text/markdown' });
    const response = await onRequest(context);

    assert.equal(await response.text(), '# peritissimus\n');
    assert.ok(fetched.includes('/index.md'));
  });

  it('falls back to HTML for a page with no twin', async () => {
    const { context, fetched } = makeContext('/terminal', { accept: 'text/markdown' });
    const response = await onRequest(context);

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'text/html; charset=utf-8');
    assert.equal(await response.text(), '<html>terminal</html>');
    assert.deepEqual(fetched, ['/terminal.md', '/terminal']);
  });

  it('serves HTML when the ASSETS binding is unavailable', async () => {
    const { context } = makeContext('/about', { accept: 'text/markdown' });
    delete context.env;

    const response = await onRequest(context);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'text/html; charset=utf-8');
  });
});

describe('.md URLs fetched directly', () => {
  it('are labelled as Markdown and declare the HTML page canonical', async () => {
    const { context } = makeContext('/about.md');
    const response = await onRequest(context);

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
    assert.match(response.headers.get('Link') ?? '', /<\/about>;\s*rel="canonical"/);
  });

  it('map /index.md back to the site root', async () => {
    const { context } = makeContext('/index.md');
    const response = await onRequest(context);

    assert.match(response.headers.get('Link') ?? '', /<\/>;\s*rel="canonical"/);
  });
});

describe('unknown paths', () => {
  it('return a real 404 to a browser, with the styled page', async () => {
    const { context } = makeContext('/nope', {
      accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
    });
    const response = await onRequest(context);

    assert.equal(response.status, 404);
    assert.equal(response.headers.get('Content-Type'), 'text/html; charset=utf-8');
    assert.equal(await response.text(), '<html>not found</html>');
    assert.ok(listHeader(response, 'Vary').includes('accept'));
  });

  it('return a 404 with a Markdown recovery body to an agent', async () => {
    const { context } = makeContext('/nope', { accept: 'text/markdown' });
    const response = await onRequest(context);

    assert.equal(response.status, 404);
    assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
    assert.equal(await response.text(), '# Page not found\n');
  });

  it('return Markdown to a client that never named HTML, such as curl', async () => {
    const { context } = makeContext('/nope', { accept: '*/*' });
    const response = await onRequest(context);

    assert.equal(response.status, 404);
    assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
  });

  it('never answer 200 for a path that does not exist', async () => {
    for (const accept of ['text/html', 'text/markdown', '*/*', undefined]) {
      const { context } = makeContext('/definitely/not/here', { accept });
      const response = await onRequest(context);
      assert.equal(response.status, 404, `Accept: ${accept}`);
    }
  });
});

describe('requests we cannot satisfy', () => {
  it('answer 406 rather than sending the wrong format', async () => {
    const { context } = makeContext('/about', { accept: 'application/json' });
    const response = await onRequest(context);

    assert.equal(response.status, 406);
    assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
    assert.match(await response.text(), /406 Not Acceptable/);
    assert.ok(listHeader(response, 'Vary').includes('accept'));
  });
});

describe('everything that is not a page', () => {
  it('passes hashed assets straight through', async () => {
    const { context } = makeContext('/_astro/app.css', { accept: 'text/markdown' });
    const response = await onRequest(context);

    assert.equal(response.headers.get('Content-Type'), 'text/css');
    assert.equal(response.headers.get('Vary'), null);
  });

  it('passes non-GET requests straight through', async () => {
    const { context, fetched } = makeContext('/about', { accept: 'text/markdown', method: 'POST' });
    await onRequest(context);

    assert.deepEqual(fetched, ['/about']);
  });
});
