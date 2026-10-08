import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  HTML,
  MARKDOWN,
  markdownTwinPath,
  mergeVary,
  negotiate,
  parseAccept,
  rankMediaTypes,
} from '../../functions/lib/negotiation.js';

const BROWSER = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,*/*;q=0.8';
const CLAUDE_CODE = 'text/markdown, text/html, */*';

describe('parseAccept', () => {
  it('treats a missing, empty, or unparseable header as */*', () => {
    for (const header of [null, undefined, '', '  ', 'garbage', '*/html']) {
      assert.deepEqual(parseAccept(header), [
        { type: '*', subtype: '*', params: {}, q: 1, index: 0 },
      ]);
    }
  });

  it('reads weights, parameters, and order', () => {
    assert.deepEqual(parseAccept('Text/Markdown;variant=GFM;q=0.8, text/html'), [
      { type: 'text', subtype: 'markdown', params: { variant: 'GFM' }, q: 0.8, index: 0 },
      { type: 'text', subtype: 'html', params: {}, q: 1, index: 1 },
    ]);
  });

  it('clamps weights to 0–1 with three decimals and ignores malformed ones', () => {
    const q = (header) => parseAccept(header)[0].q;
    assert.equal(q('text/html;q=0.9001'), 0.9);
    assert.equal(q('text/html;q=7'), 1);
    assert.equal(q('text/html;q=-1'), 0);
    assert.equal(q('text/html;q=abc'), 1);
    assert.equal(q('text/html;q='), 1);
  });

  it('ignores accept-extensions after the weight', () => {
    assert.deepEqual(parseAccept('text/html;q=0.5;level=1')[0].params, {});
  });
});

describe('rankMediaTypes', () => {
  const rank = (header) => rankMediaTypes(header, [HTML, MARKDOWN]);

  const cases = [
    ['text/markdown', [MARKDOWN]],
    [CLAUDE_CODE, [MARKDOWN, HTML]],
    [BROWSER, [HTML, MARKDOWN]],
    ['*/*', [HTML, MARKDOWN]],
    [null, [HTML, MARKDOWN]],
    ['text/*', [HTML, MARKDOWN]],
    ['text/html, text/markdown', [HTML, MARKDOWN]],
    ['text/markdown;q=0.5, text/html', [HTML, MARKDOWN]],
    ['text/html;q=0.5, text/markdown', [MARKDOWN, HTML]],
    ['text/markdown, */*', [MARKDOWN, HTML]],
    // The most specific range wins, even when a broader one weighs more.
    ['text/*;q=0.5, text/markdown;q=0', [HTML]],
    ['text/markdown;q=0, */*', [HTML]],
    ['text/markdown, text/html;q=0', [MARKDOWN]],
    ['text/markdown;charset=utf-8', [MARKDOWN]],
    ['text/markdown;charset=iso-8859-1', []],
    ['application/json', []],
    ['text/plain', []],
    ['image/png, application/pdf', []],
  ];

  for (const [header, expected] of cases) {
    it(`${JSON.stringify(header)} → ${JSON.stringify(expected)}`, () => {
      assert.deepEqual(rank(header), expected);
    });
  }
});

describe('markdownTwinPath', () => {
  it('maps pages to their .md twin', () => {
    assert.equal(markdownTwinPath('/'), '/index.md');
    assert.equal(markdownTwinPath('/about'), '/about.md');
    assert.equal(
      markdownTwinPath('/blog/scaling-llm-applications'),
      '/blog/scaling-llm-applications.md'
    );
  });

  it('skips files and trailing-slash redirects', () => {
    for (const path of ['/llms.txt', '/og/home.png', '/about.html', '/about/', '/.well-known']) {
      assert.equal(markdownTwinPath(path), null, path);
    }
  });
});

describe('mergeVary', () => {
  it('puts Accept and Accept-Encoding first and keeps other fields once', () => {
    assert.equal(mergeVary(null), 'Accept, Accept-Encoding');
    assert.equal(mergeVary('accept-encoding'), 'Accept, Accept-Encoding');
    assert.equal(mergeVary('Origin, Accept'), 'Accept, Accept-Encoding, Origin');
    assert.equal(mergeVary('*'), '*');
  });
});

/**
 * A stand-in for the Pages asset server: serves `files` by path, 404s with an
 * HTML page otherwise, honours If-None-Match, and stamps a security header on
 * every response the way `_headers` does.
 */
function fakeSite(files) {
  const serve = (request) => {
    const { pathname } = new URL(request.url);
    const file = files[pathname];
    const body = (text) => (request.method === 'HEAD' ? null : text);
    const security = { 'X-Frame-Options': 'DENY' };

    if (!file) {
      return new Response(body('<!doctype html><title>Page not found</title>'), {
        status: 404,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          ...security,
        },
      });
    }
    const etag = `"${pathname}"`;
    if (request.headers.get('If-None-Match') === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag, ...security } });
    }
    return new Response(body(file.body), {
      headers: {
        'Content-Type': file.type,
        'Cache-Control': 'public, max-age=0',
        ETag: etag,
        ...security,
        ...file.headers,
      },
    });
  };

  const calls = { next: 0 };
  const handle = (path, init = {}) => {
    const request = new Request(`https://peritissimus.com${path}`, init);
    const next = async () => {
      calls.next += 1;
      return serve(request);
    };
    return negotiate(request, { ASSETS: { fetch: async (r) => serve(r) } }, next);
  };
  return { handle, calls };
}

const site = () =>
  fakeSite({
    '/': {
      type: 'text/html; charset=utf-8',
      body: '<h1>home</h1>',
      headers: { Link: '</llms.txt>; rel="describedby"' },
    },
    '/index.md': { type: 'text/markdown', body: '# home' },
    '/about': { type: 'text/html; charset=utf-8', body: '<h1>about</h1>' },
    '/about.md': { type: 'text/markdown', body: '# About' },
    '/terminal': { type: 'text/html; charset=utf-8', body: '<canvas></canvas>' },
    '/404.md': { type: 'text/markdown', body: '# 404 — Page not found' },
    '/llms.txt': { type: 'text/plain; charset=utf-8', body: '# peritissimus' },
  });

const accept = (value) => ({ headers: { Accept: value } });

describe('negotiate', () => {
  it('serves the markdown twin at the page URL when markdown is preferred', async () => {
    for (const header of ['text/markdown', CLAUDE_CODE]) {
      const response = await site().handle('/about', accept(header));
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
      assert.equal(response.headers.get('Vary'), 'Accept, Accept-Encoding');
      assert.equal(response.headers.get('Content-Location'), '/about.md');
      assert.equal(response.headers.get('Cache-Control'), 'private, max-age=0, must-revalidate');
      assert.equal(response.headers.get('X-Frame-Options'), 'DENY');
      assert.equal(await response.text(), '# About');
    }
  });

  it('serves the homepage twin from /index.md', async () => {
    const response = await site().handle('/', accept('text/markdown'));
    assert.equal(await response.text(), '# home');
    assert.equal(response.headers.get('Content-Location'), '/index.md');
  });

  it('serves HTML, marked as negotiated and linking its twin, to everyone else', async () => {
    for (const header of [BROWSER, '*/*', 'text/markdown;q=0.5, text/html']) {
      const response = await site().handle('/about', accept(header));
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('Content-Type'), 'text/html; charset=utf-8');
      assert.equal(response.headers.get('Vary'), 'Accept, Accept-Encoding');
      assert.equal(
        response.headers.get('Link'),
        '</about.md>; rel="alternate"; type="text/markdown"'
      );
      assert.equal(await response.text(), '<h1>about</h1>');
    }

    const noAccept = await site().handle('/about');
    assert.equal(noAccept.headers.get('Content-Type'), 'text/html; charset=utf-8');
  });

  it('keeps existing Link headers on the HTML', async () => {
    const response = await site().handle('/', accept(BROWSER));
    assert.equal(
      response.headers.get('Link'),
      '</llms.txt>; rel="describedby", </index.md>; rel="alternate"; type="text/markdown"'
    );
  });

  it('answers 406 when neither HTML nor markdown is acceptable', async () => {
    const response = await site().handle('/about', accept('application/json'));
    assert.equal(response.status, 406);
    assert.equal(response.headers.get('Content-Type'), 'text/plain; charset=utf-8');
    assert.equal(response.headers.get('Vary'), 'Accept, Accept-Encoding');
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('ETag'), null);
    assert.equal(response.headers.get('X-Frame-Options'), 'DENY');
    assert.match(await response.text(), /available as: text\/html, text\/markdown/);
  });

  it('falls back to HTML for a page without a twin, or 406s if HTML is ruled out', async () => {
    const fallback = await site().handle('/terminal', accept('text/markdown, text/html;q=0.5'));
    assert.equal(fallback.status, 200);
    assert.equal(fallback.headers.get('Content-Type'), 'text/html; charset=utf-8');
    assert.equal(fallback.headers.get('Link'), null);

    const refused = await site().handle('/terminal', accept('text/markdown'));
    assert.equal(refused.status, 406);
    assert.match(await refused.text(), /available as: text\/html\n/);
  });

  it('gives a nonexistent path a markdown 404 body when markdown is preferred', async () => {
    const response = await site().handle('/some-path-that-does-not-exist', accept('text/markdown'));
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
    assert.equal(response.headers.get('Vary'), 'Accept, Accept-Encoding');
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('ETag'), null);
    assert.equal(await response.text(), '# 404 — Page not found');
  });

  it('keeps the HTML 404 page for browsers', async () => {
    const response = await site().handle('/some-path-that-does-not-exist', accept(BROWSER));
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('Content-Type'), 'text/html; charset=utf-8');
    assert.equal(response.headers.get('Vary'), 'Accept, Accept-Encoding');
  });

  it('labels .md files as markdown and points at the HTML original', async () => {
    const about = await site().handle('/about.md');
    assert.equal(about.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
    assert.equal(about.headers.get('Link'), '<https://peritissimus.com/about>; rel="canonical"');

    const home = await site().handle('/index.md');
    assert.equal(home.headers.get('Link'), '<https://peritissimus.com/>; rel="canonical"');

    const notFoundBody = await site().handle('/404.md');
    assert.equal(notFoundBody.headers.get('Link'), null);

    const missing = await site().handle('/missing.md');
    assert.equal(missing.status, 404);
    assert.equal(missing.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
  });

  it('answers HEAD with headers only', async () => {
    const response = await site().handle('/about', { method: 'HEAD', ...accept('text/markdown') });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
    assert.equal(response.body, null);
  });

  it('keeps Vary on 304 Not Modified', async () => {
    const response = await site().handle('/about', {
      headers: { Accept: BROWSER, 'If-None-Match': '"/about"' },
    });
    assert.equal(response.status, 304);
    assert.equal(response.headers.get('Vary'), 'Accept, Accept-Encoding');
  });

  it('leaves other methods and non-page assets untouched', async () => {
    const post = await site().handle('/about', { method: 'POST', ...accept('text/markdown') });
    assert.equal(post.headers.get('Content-Type'), 'text/html; charset=utf-8');
    assert.equal(post.headers.get('Vary'), null);

    const llms = await site().handle('/llms.txt', accept('text/markdown'));
    assert.equal(llms.headers.get('Content-Type'), 'text/plain; charset=utf-8');
    assert.equal(llms.headers.get('Vary'), null);
  });

  it('does not fetch the page when the markdown twin answers', async () => {
    const { handle, calls } = site();
    await handle('/about', accept('text/markdown'));
    assert.equal(calls.next, 0);
  });
});
