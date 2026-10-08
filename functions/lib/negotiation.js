/**
 * Markdown content negotiation for agents (RFC 9110 §12.5, acceptmarkdown.com).
 *
 * The build publishes every page twice: `/about` as HTML and `/about.md` as
 * its markdown twin (see src/lib/markdown.ts). This serves whichever one the
 * request's Accept header prefers, at the page's own URL:
 *
 *   prefers text/markdown           → the twin, as text/markdown
 *   prefers text/html, or anything  → the HTML page, unchanged
 *   accepts neither type            → 406 Not Acceptable
 *   nonexistent path                → 404, with a markdown body when markdown is preferred
 *
 * Every negotiated response carries `Vary: Accept, Accept-Encoding` so caches
 * keep the two representations apart.
 */

export const HTML = 'text/html';
export const MARKDOWN = 'text/markdown';
const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8';
const SITE_URL = 'https://peritissimus.com';
const VARY = ['Accept', 'Accept-Encoding'];

/**
 * @typedef {{ type: string, subtype: string, params: Record<string, string>, q: number, index: number }} MediaRange
 */

/**
 * Parse an Accept header into media ranges, in the order the client wrote
 * them. A missing, empty, or wholly unparseable header accepts anything.
 *
 * @param {string | null | undefined} header
 * @returns {MediaRange[]}
 */
export function parseAccept(header) {
  /** @type {MediaRange[]} */
  const ranges = [];

  for (const [index, part] of (header ?? '').split(',').entries()) {
    const [range, ...rawParams] = part.split(';');
    const [type, subtype, extra] = range.trim().toLowerCase().split('/');
    if (!type || !subtype || extra !== undefined || (type === '*' && subtype !== '*')) continue;

    /** @type {Record<string, string>} */
    const params = {};
    let q = 1;
    for (const rawParam of rawParams) {
      const eq = rawParam.indexOf('=');
      if (eq === -1) continue;
      const name = rawParam.slice(0, eq).trim().toLowerCase();
      const value = rawParam
        .slice(eq + 1)
        .trim()
        .replace(/^"(.*)"$/, '$1');
      if (name === 'q') {
        // Anything after the weight is an accept-extension, not a media type parameter.
        q = parseWeight(value);
        break;
      }
      params[name] = value;
    }

    ranges.push({ type, subtype, params, q, index });
  }

  return ranges.length > 0 ? ranges : [{ type: '*', subtype: '*', params: {}, q: 1, index: 0 }];
}

/** A qvalue is 0–1 with at most three decimals; a malformed one is ignored. */
function parseWeight(value) {
  const q = Number(value);
  if (value === '' || !Number.isFinite(q)) return 1;
  return Math.min(1, Math.max(0, Math.round(q * 1000) / 1000));
}

/**
 * How specifically `range` names `mediaType`, or -1 if it doesn't match.
 * `*\/*` < `text/*` < `text/markdown` < `text/markdown;variant=GFM`.
 * We only ever send UTF-8, so a range asking for another charset never matches.
 *
 * @param {MediaRange} range
 * @param {string} mediaType
 */
function specificity(range, mediaType) {
  const [type, subtype] = mediaType.split('/');
  if (range.params.charset && range.params.charset.toLowerCase() !== 'utf-8') return -1;
  if (range.type === '*') return 0;
  if (range.type !== type) return -1;
  if (range.subtype === '*') return 100;
  if (range.subtype !== subtype) return -1;
  return 200 + Object.keys(range.params).length;
}

/**
 * Order the media types a resource is available in by how much the client
 * wants each. A type takes the weight of the most specific range matching it,
 * so `text/*;q=0.5, text/markdown;q=0` rules markdown out. Ties go to the type
 * named by the more specific range, then to the one the client listed first,
 * then to `available` order — the server's preference. Types weighted 0 are
 * dropped, so an empty result means nothing acceptable can be served.
 *
 * @param {string | null | undefined} header
 * @param {string[]} available
 * @returns {string[]}
 */
export function rankMediaTypes(header, available) {
  const ranges = parseAccept(header);

  return available
    .map((mediaType, serverOrder) => {
      /** @type {{ range: MediaRange, rank: number } | null} */
      let best = null;
      for (const range of ranges) {
        const rank = specificity(range, mediaType);
        if (rank < 0) continue;
        if (!best || rank > best.rank || (rank === best.rank && range.q > best.range.q)) {
          best = { range, rank };
        }
      }
      return (
        best && {
          mediaType,
          q: best.range.q,
          rank: best.rank,
          index: best.range.index,
          serverOrder,
        }
      );
    })
    .filter((match) => match !== null && match.q > 0)
    .sort(
      (a, b) => b.q - a.q || b.rank - a.rank || a.index - b.index || a.serverOrder - b.serverOrder
    )
    .map((match) => match.mediaType);
}

/**
 * Path of a page's markdown twin, or null for paths that aren't pages:
 * files (`.xml`, `.txt`, `.png`, `.html` redirects) and trailing-slash URLs,
 * which Pages redirects to the slash-less form.
 *
 * @param {string} pathname
 */
export function markdownTwinPath(pathname) {
  if (pathname === '/') return '/index.md';
  if (pathname.endsWith('/')) return null;
  const lastSegment = pathname.slice(pathname.lastIndexOf('/') + 1);
  return lastSegment.includes('.') ? null : `${pathname}.md`;
}

/** `Vary` with Accept and Accept-Encoding first, keeping any other fields. */
export function mergeVary(existing) {
  const fields = [...VARY];
  for (const field of (existing ?? '').split(',').map((value) => value.trim())) {
    if (field === '*') return '*';
    if (field && !fields.some((known) => known.toLowerCase() === field.toLowerCase())) {
      fields.push(field);
    }
  }
  return fields.join(', ');
}

/**
 * @param {Response} response
 * @param {Headers} headers
 * @param {number} [status]
 */
function rewrap(response, headers, status = response.status) {
  return new Response(response.body, { status, headers });
}

/** The HTML page, marked as one of two representations. */
function htmlVariant(page, twinPath) {
  const headers = new Headers(page.headers);
  headers.set('Vary', mergeVary(headers.get('Vary')));
  if (twinPath) headers.append('Link', `<${twinPath}>; rel="alternate"; type="${MARKDOWN}"`);
  return rewrap(page, headers);
}

/** The markdown twin, served at the page's own URL. */
function markdownVariant(twin, twinPath) {
  const headers = new Headers(twin.headers);
  headers.set('Content-Type', MARKDOWN_CONTENT_TYPE);
  headers.set('Content-Location', twinPath);
  headers.set('Vary', mergeVary(headers.get('Vary')));
  // Shared caches must not store this variant. Cloudflare's edge cache keys on
  // the URL alone, so a cached copy would be replayed to browsers asking for HTML.
  headers.set('Cache-Control', 'private, max-age=0, must-revalidate');
  return rewrap(twin, headers);
}

/** A `.md` URL requested directly: label it as markdown and point at the HTML original. */
function markdownFile(response, pathname) {
  const headers = new Headers(response.headers);
  headers.set('Content-Type', MARKDOWN_CONTENT_TYPE);
  const htmlPath = pathname === '/index.md' ? '/' : pathname.slice(0, -'.md'.length);
  if (htmlPath !== '/404') headers.set('Link', `<${SITE_URL}${htmlPath}>; rel="canonical"`);
  return rewrap(response, headers);
}

/**
 * Answer one request. Wired to Cloudflare Pages in functions/_middleware.js.
 *
 * @param {Request} request
 * @param {{ ASSETS: { fetch: (request: Request) => Promise<Response> } }} env
 * @param {() => Promise<Response>} next  serves the static asset for this URL
 * @returns {Promise<Response>}
 */
export async function negotiate(request, env, next) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return next();

  const url = new URL(request.url);
  /** Fetch another static asset, by default keeping this request's method and headers. */
  const asset = (path, init = request) => env.ASSETS.fetch(new Request(new URL(path, url), init));

  /** The 404 page with its HTML body swapped for the markdown one, or null if that's missing. */
  const markdownNotFound = async (page) => {
    const body = await asset('/404.md', { method: request.method });
    if (!body.ok) return null;
    await page.body?.cancel();

    const headers = new Headers(body.headers);
    headers.delete('ETag');
    headers.delete('Last-Modified');
    headers.set('Content-Type', MARKDOWN_CONTENT_TYPE);
    headers.set('Cache-Control', page.headers.get('Cache-Control') ?? 'no-store');
    headers.set('Vary', mergeVary(headers.get('Vary')));
    return rewrap(body, headers, 404);
  };

  if (url.pathname.endsWith('.md')) {
    const response = await next();
    if (response.status === 404) return (await markdownNotFound(response)) ?? response;
    return markdownFile(response, url.pathname);
  }

  const twinPath = markdownTwinPath(url.pathname);
  if (!twinPath) return next();

  const ranked = rankMediaTypes(request.headers.get('Accept'), [HTML, MARKDOWN]);

  let twinProbe = Promise.resolve(false);
  if (ranked[0] === MARKDOWN) {
    const twin = await asset(twinPath);
    if (twin.status !== 404) return markdownVariant(twin, twinPath);
    await twin.body?.cancel();
  } else {
    // Probe in parallel with the page so the HTML can advertise its twin.
    twinProbe = asset(twinPath, { method: 'HEAD' }).then(
      (response) => response.ok,
      () => false
    );
  }

  const page = await next();

  if (page.status === 404) {
    const notFound = ranked[0] === MARKDOWN ? await markdownNotFound(page) : null;
    return notFound ?? htmlVariant(page, null);
  }

  const isHtml = (page.headers.get('Content-Type') ?? '').startsWith(HTML);
  if (page.status !== 304 && !isHtml) return page;

  const hasTwin = await twinProbe;
  const servable = ranked.filter((type) => type === HTML || (type === MARKDOWN && hasTwin));
  if (servable.length === 0) return notAcceptable(request, page, hasTwin);

  return htmlVariant(page, hasTwin ? twinPath : null);
}

/**
 * 406 for an Accept header that rules out every representation we have. Built
 * from the page's headers so the security headers from `_headers` survive.
 */
async function notAcceptable(request, page, hasTwin) {
  await page.body?.cancel();

  const headers = new Headers(page.headers);
  for (const name of ['Content-Length', 'Content-Encoding', 'ETag', 'Last-Modified', 'Link']) {
    headers.delete(name);
  }
  headers.set('Content-Type', 'text/plain; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  headers.set('Vary', mergeVary(headers.get('Vary')));

  const available = hasTwin ? [HTML, MARKDOWN] : [HTML];
  const body =
    request.method === 'HEAD'
      ? null
      : `406 Not Acceptable\n\nThis resource is available as: ${available.join(', ')}\n`;
  return new Response(body, { status: 406, headers });
}
