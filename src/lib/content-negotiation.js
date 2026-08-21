// @ts-check
/**
 * Accept-header content negotiation, shared by the Cloudflare Pages middleware
 * in `functions/_middleware.js` and its unit tests.
 *
 * Plain JavaScript with JSDoc types rather than TypeScript: the module is
 * bundled into a Worker by Cloudflare and imported directly by `node --test`,
 * and neither runtime should need a compile step to read it.
 *
 * Follows RFC 9110 §12.5.1 (Accept) and the acceptmarkdown.com convention:
 * parse the header, rank by q-value, break ties by specificity — never
 * substring-match.
 */

/** Media types that count as "the agent asked for Markdown". */
export const MARKDOWN_TYPES = ['text/markdown', 'text/x-markdown'];

/** What we serve when Markdown wins. */
export const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8';

/**
 * A single parsed entry of an Accept header.
 * `specificity` is 3 for an exact `type/subtype`, 2 for a subtype wildcard,
 * 1 for the full wildcard.
 * @typedef {{ type: string, subtype: string, q: number, specificity: number }} MediaRange
 */

/**
 * A negotiation outcome: which representation to send, or `none` when the
 * client accepts neither of the two we can produce (→ 406).
 * @typedef {'markdown' | 'html' | 'none'} Representation
 */

/**
 * Parse an Accept header into media ranges. Malformed entries are dropped
 * rather than failing the request — a broken Accept must not 500 a page.
 *
 * @param {string | null | undefined} header
 * @returns {MediaRange[]}
 */
export function parseAccept(header) {
  if (!header) return [];

  /** @type {MediaRange[]} */
  const ranges = [];

  for (const entry of header.split(',')) {
    const [rawType, ...rawParams] = entry.split(';');
    const mediaType = rawType.trim().toLowerCase();
    if (!mediaType.includes('/')) continue;

    const [type, subtype] = mediaType.split('/', 2);
    if (!type || !subtype) continue;

    // RFC 9110: a `q` parameter that is not a valid qvalue is ignored, which
    // leaves the default weight of 1.
    let q = 1;
    for (const param of rawParams) {
      const [name, ...value] = param.split('=');
      if (name.trim().toLowerCase() !== 'q') continue;
      const parsed = Number.parseFloat(value.join('=').trim());
      if (Number.isFinite(parsed)) q = Math.min(Math.max(parsed, 0), 1);
      break; // Parameters after `q` are accept-ext, not media-type params.
    }

    const specificity = type === '*' ? 1 : subtype === '*' ? 2 : 3;
    ranges.push({ type, subtype, q, specificity });
  }

  return ranges;
}

/**
 * Best match for a concrete media type across a set of ranges, or `null` when
 * the type is not acceptable (no match, or matched only at `q=0`).
 *
 * @param {MediaRange[]} ranges
 * @param {string} mediaType e.g. `text/html`
 * @returns {{ q: number, specificity: number } | null}
 */
export function matchQuality(ranges, mediaType) {
  const [type, subtype] = mediaType.toLowerCase().split('/', 2);

  /** @type {{ q: number, specificity: number } | null} */
  let best = null;

  for (const range of ranges) {
    const matches =
      (range.type === '*' && range.subtype === '*') ||
      (range.type === type && range.subtype === '*') ||
      (range.type === type && range.subtype === subtype);
    if (!matches) continue;

    // A more specific range always wins over a broader one, whatever its
    // q-value: that is how a weighted full wildcard co-exists with `text/html`.
    if (!best || range.specificity > best.specificity) {
      best = { q: range.q, specificity: range.specificity };
    }
  }

  return best && best.q > 0 ? best : null;
}

/**
 * Best match across every Markdown media type we recognise.
 *
 * @param {MediaRange[]} ranges
 * @returns {{ q: number, specificity: number } | null}
 */
function matchMarkdown(ranges) {
  /** @type {{ q: number, specificity: number } | null} */
  let best = null;
  for (const mediaType of MARKDOWN_TYPES) {
    const match = matchQuality(ranges, mediaType);
    if (!match) continue;
    if (!best || match.q > best.q || (match.q === best.q && match.specificity > best.specificity)) {
      best = match;
    }
  }
  return best;
}

/**
 * Decide which representation of a page to serve.
 *
 * Markdown only wins when the client ranks it above HTML. A wildcard Accept
 * (a full wildcard, or no header at all) is a tie, and ties go to HTML so generic
 * clients — link previewers, feed readers, `curl` with no flags — keep getting
 * the same bytes they got before.
 *
 * @param {string | null | undefined} header
 * @returns {Representation}
 */
export function negotiate(header) {
  const ranges = parseAccept(header);
  if (ranges.length === 0) return 'html';

  const markdown = matchMarkdown(ranges);
  const html = matchQuality(ranges, 'text/html');

  if (!markdown && !html) return 'none';
  if (!markdown) return 'html';
  if (!html) return 'markdown';

  if (markdown.q > html.q) return 'markdown';
  if (markdown.q < html.q) return 'html';
  return markdown.specificity > html.specificity ? 'markdown' : 'html';
}

/**
 * Whether the client named HTML outright, rather than merely tolerating it
 * through a wildcard. Browsers do; `curl`, fetch-based agents, and anything
 * sending `Accept: text/markdown` do not.
 *
 * Used to pick the shape of a 404 body: humans get the styled page, agents get
 * Markdown they can act on.
 *
 * @param {string | null | undefined} header
 * @returns {boolean}
 */
export function explicitlyAcceptsHtml(header) {
  return parseAccept(header).some(
    (range) => range.type === 'text' && range.subtype === 'html' && range.q > 0
  );
}

/**
 * Path of the Markdown twin for a page route, or `null` when the path is not a
 * negotiable page (it already is the Markdown, or it carries a file extension
 * and is therefore an asset with exactly one representation).
 *
 * @param {string} pathname
 * @returns {string | null}
 */
export function markdownTwinPath(pathname) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (path === '' || path === '/') return '/index.md';
  if (/\.[a-z0-9]+$/i.test(path)) return null;
  return `${path}.md`;
}

/**
 * Merge a value into a comma-separated list header without duplicating an
 * entry that is already there. Cloudflare adds `Vary: Accept-Encoding` of its
 * own accord, so `Vary` has to be extended rather than overwritten.
 *
 * @param {string | null | undefined} existing
 * @param {string} value
 * @returns {string}
 */
export function appendToListHeader(existing, value) {
  const items = (existing ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.some((item) => item.toLowerCase() === '*')) return '*';
  if (items.some((item) => item.toLowerCase() === value.toLowerCase())) return items.join(', ');

  items.push(value);
  return items.join(', ');
}
