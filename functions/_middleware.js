// @ts-check
/**
 * Cloudflare Pages middleware: Accept-header content negotiation.
 *
 * The site is still prerendered — every page and every Markdown twin is a file
 * in `dist/`. This middleware only chooses between two files that already
 * exist and stamps the caching headers that choice requires:
 *
 *   GET /about   Accept: text/html      -> dist/about.html  (unchanged)
 *   GET /about   Accept: text/markdown  -> dist/about.md
 *   GET /nope    Accept: text/markdown  -> dist/404.md, status 404
 *
 * `Vary: Accept` is the load-bearing part. Without it Cloudflare caches
 * whichever representation it saw first and serves it to everyone.
 *
 * See acceptmarkdown.com and RFC 9110 §12.5.1 for the negotiation rules; the
 * parsing itself lives in `src/lib/content-negotiation.js` so it can be unit
 * tested without a Worker runtime.
 */
import {
  MARKDOWN_CONTENT_TYPE,
  appendToListHeader,
  explicitlyAcceptsHtml,
  markdownTwinPath,
  negotiate,
} from '../src/lib/content-negotiation.js';

/**
 * The slice of the Cloudflare Pages context this middleware uses.
 * @typedef {{
 *   request: Request,
 *   next: (input?: Request) => Promise<Response>,
 *   env?: { ASSETS?: { fetch: (input: Request) => Promise<Response> } },
 * }} PagesContext
 */

/** Matches the HTML policy in `public/_headers`. */
const PAGE_CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=600';

/** Mirrors the `/*` block in `public/_headers`, for responses we synthesise. */
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

/**
 * @param {string} path
 * @returns {string}
 */
function markdownAlternate(path) {
  return `<${path}>; rel="alternate"; type="text/markdown"`;
}

/**
 * Declare that this response depends on `Accept`, so a shared cache keys the
 * HTML and Markdown variants separately.
 *
 * @param {Headers} headers
 */
function markVariant(headers) {
  let vary = appendToListHeader(headers.get('Vary'), 'Accept');
  vary = appendToListHeader(vary, 'Accept-Encoding');
  headers.set('Vary', vary);
}

/**
 * The HTML page a Markdown twin is a representation of. `/index.md` belongs to
 * `/`; everything else drops the extension.
 *
 * @param {string} pathname
 * @returns {string}
 */
function htmlCounterpart(pathname) {
  const withoutExtension = pathname.replace(/\.md$/, '');
  return withoutExtension === '/index' ? '/' : withoutExtension;
}

/**
 * Fetch a sibling file from the static build, or `null` when it is not there.
 *
 * Deliberately goes through the `ASSETS` binding rather than `next()`:
 * `next()` advances through the handler chain and may only be called once per
 * request, so spending it on a twin that turns out not to exist would leave
 * nothing to fall back to.
 *
 * @param {PagesContext} context
 * @param {URL} url
 * @param {string} path
 * @returns {Promise<Response | null>}
 */
async function fetchAsset(context, url, path) {
  const assets = context.env?.ASSETS;
  if (!assets) return null;

  // Reuse the method so a HEAD stays a HEAD and comes back without a body.
  const assetRequest = new Request(new URL(path, url), {
    method: context.request.method,
    headers: context.request.headers,
  });

  const response = await assets.fetch(assetRequest);
  return response.ok ? response : null;
}

/**
 * Re-dress a Markdown file as the negotiated representation of a page.
 *
 * @param {Response} source
 * @param {{ status: number, canonical?: string }} options
 * @returns {Response}
 */
function asNegotiatedMarkdown(source, options) {
  const headers = new Headers(source.headers);
  headers.set('Content-Type', MARKDOWN_CONTENT_TYPE);
  headers.set('Cache-Control', PAGE_CACHE_CONTROL);
  markVariant(headers);
  if (options.canonical) headers.set('Link', `<${options.canonical}>; rel="canonical"`);

  return new Response(source.body, { status: options.status, headers });
}

/**
 * @param {URL} url
 * @returns {Response}
 */
function notAcceptable(url) {
  const body = [
    '# 406 Not Acceptable',
    '',
    `\`${url.pathname}\` is available as HTML or Markdown, and this request accepted neither.`,
    '',
    '- `Accept: text/html` returns the rendered page.',
    '- `Accept: text/markdown` returns the same page as Markdown.',
    '',
    'Site index for agents: https://peritissimus.com/llms.txt',
    '',
  ].join('\n');

  return new Response(body, {
    status: 406,
    headers: {
      ...SECURITY_HEADERS,
      'Content-Type': MARKDOWN_CONTENT_TYPE,
      'Cache-Control': PAGE_CACHE_CONTROL,
      Vary: 'Accept, Accept-Encoding',
    },
  });
}

/**
 * @param {PagesContext} context
 * @returns {Promise<Response>}
 */
export async function onRequest(context) {
  const { request, next } = context;

  if (request.method !== 'GET' && request.method !== 'HEAD') return next();

  const url = new URL(request.url);
  const accept = request.headers.get('Accept');

  // A `.md` URL is a resource in its own right, not a negotiated one: label it
  // and point search engines at the HTML page it mirrors.
  if (url.pathname.endsWith('.md')) {
    const response = await next();
    if (!response.ok) return response;

    const headers = new Headers(response.headers);
    headers.set('Content-Type', MARKDOWN_CONTENT_TYPE);
    headers.set('Link', `<${htmlCounterpart(url.pathname)}>; rel="canonical"`);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  const twin = markdownTwinPath(url.pathname);

  // Hashed assets, images, feeds, robots.txt: one representation, nothing to
  // negotiate, no reason to pay for a Worker touching the response.
  if (!twin) return next();

  const preferred = negotiate(accept);
  if (preferred === 'none') return notAcceptable(url);

  if (preferred === 'markdown') {
    const markdown = await fetchAsset(context, url, twin);
    if (markdown) {
      return asNegotiatedMarkdown(markdown, { status: 200, canonical: url.pathname });
    }
    // No twin for this page — fall through and serve the HTML rather than
    // 404-ing a page that exists. `next()` is still unspent, because the twin
    // lookup went through the ASSETS binding.
  }

  const response = await next();

  if (response.status === 404) {
    // Anything that did not ask for HTML by name — `curl`, an agent, a fetch
    // with `Accept: text/markdown` — gets a body it can recover from. Browsers
    // still get the styled 404 page.
    if (!explicitlyAcceptsHtml(accept)) {
      const markdown = await fetchAsset(context, url, '/404.md');
      if (markdown) return asNegotiatedMarkdown(markdown, { status: 404 });
    }

    const headers = new Headers(response.headers);
    markVariant(headers);
    headers.append('Link', markdownAlternate('/404.md'));
    return new Response(response.body, {
      status: 404,
      statusText: response.statusText,
      headers,
    });
  }

  const headers = new Headers(response.headers);
  markVariant(headers);
  headers.append('Link', markdownAlternate(twin));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
