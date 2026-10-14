import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const SITE_URL = 'https://peritissimus.com';
const DIST = new URL('../../dist/', import.meta.url);
const SERVICES = [
  'applied-ai-engineering',
  'scalable-ai-infrastructure',
  'distributed-systems-reliability',
];
const ROUTES = ['/consulting', ...SERVICES.map((slug) => `/consulting/${slug}`)];
const read = (path) => readFileSync(new URL(path, DIST), 'utf8');

function decode(text) {
  const entities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };
  return text.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (_, entity) => {
    if (entity.startsWith('#')) {
      return String.fromCodePoint(
        entity[1].toLowerCase() === 'x'
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10)
      );
    }
    return entities[entity.toLowerCase()];
  });
}

const attribute = (tag, name) =>
  decode(tag.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1] ?? '');
const main = (html) => html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
const anchors = (html) => [...html.matchAll(/<a\b[^>]*>/g)].map(([tag]) => tag);
const plain = (text) =>
  decode(text)
    .replace(/<[^>]+>/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*`]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();

function schemaNodes(value) {
  if (Array.isArray(value)) return value.flatMap(schemaNodes);
  if (!value || typeof value !== 'object') return [];
  return [value, ...schemaNodes(value['@graph'])];
}

function assertNoPriceOrRating(value) {
  if (!value || typeof value !== 'object') return;
  const unsupported = new Set([
    'price',
    'priceCurrency',
    'aggregateRating',
    'ratingValue',
    'ratingCount',
    'reviewCount',
    'review',
  ]);
  for (const [key, nested] of Object.entries(value)) {
    assert.ok(!unsupported.has(key), `Unsubstantiated service price or rating field: ${key}`);
    assertNoPriceOrRating(nested);
  }
}

test('consulting routes are discoverable, indexable, and have matching Markdown twins', () => {
  const sitemap = [...read('sitemap-0.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
  const titles = new Set();
  for (const path of ROUTES) {
    const url = `${SITE_URL}${path}`;
    assert.ok(sitemap.includes(url), `Missing sitemap route: ${path}`);
    const html = read(`${path.slice(1)}.html`);
    const markdown = read(`${path.slice(1)}.md`);
    const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*>/)?.[0] ?? '';
    assert.equal(attribute(canonical, 'href'), url, path);
    assert.doesNotMatch(html, /name="robots" content="[^"]*noindex/, path);
    const title = decode(html.match(/<title>(.*?)<\/title>/)?.[1] ?? '');
    assert.ok(title && !titles.has(title), `Missing or duplicate consulting title: ${path}`);
    titles.add(title);
    const headings = [...main(html).matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
    assert.equal(headings.length, 1, path);
    assert.ok(plain(markdown).includes(plain(headings[0][1])), `Missing Markdown H1: ${path}`);
    for (const [, , attrs, copy] of main(html).matchAll(/<(h[1-3]|p)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
      if (/class="[^"]*page-kicker/.test(attrs)) continue;
      assert.ok(
        plain(markdown).includes(plain(copy)),
        `Missing Markdown copy in ${path}: ${plain(copy)}`
      );
    }
    const description = html.match(/<meta\b[^>]*name="description"[^>]*>/)?.[0] ?? '';
    assert.ok(attribute(description, 'content'), `Missing description: ${path}`);
    assert.ok(
      plain(markdown).includes(plain(attribute(description, 'content'))),
      `Missing Markdown description: ${path}`
    );
    const alternate = html.match(/<link\b[^>]*type="text\/markdown"[^>]*>/)?.[0] ?? '';
    assert.equal(attribute(alternate, 'href'), `${url}.md`, path);
    for (const tag of anchors(main(html))) {
      const href = attribute(tag, 'href');
      if (href.startsWith('/')) {
        assert.ok(markdown.includes(`](${SITE_URL}${href})`), `Missing Markdown link: ${href}`);
      }
    }
  }
});

test('the consulting hub links to every service and service proof links resolve', () => {
  const homepage = read('index.html');
  for (const element of ['header', 'footer']) {
    const navigation =
      homepage.match(new RegExp(`<${element}\\b[^>]*>([\\s\\S]*?)<\\/${element}>`))?.[1] ?? '';
    assert.ok(
      anchors(navigation).some((tag) => attribute(tag, 'href') === '/consulting'),
      `Missing consulting discovery link in ${element}`
    );
  }
  const hubLinks = anchors(main(read('consulting.html'))).map((tag) => attribute(tag, 'href'));
  for (const slug of SERVICES) {
    const path = `/consulting/${slug}`;
    assert.ok(hubLinks.includes(path), `Missing service discovery link: ${path}`);
    const links = anchors(main(read(`${path.slice(1)}.html`))).map((tag) => attribute(tag, 'href'));
    for (const prefix of ['/work/', '/blog/']) {
      const proof = links.filter((href) => href.startsWith(prefix));
      assert.ok(proof.length > 0, `Missing ${prefix} evidence: ${path}`);
      for (const href of proof) {
        const proofPath = new URL(href, SITE_URL).pathname;
        assert.ok(existsSync(new URL(`${proofPath.slice(1)}.html`, DIST)), href);
      }
    }
  }
});

test('service structured data identifies the service and its real provider without prices or ratings', () => {
  for (const slug of SERVICES) {
    const url = `${SITE_URL}/consulting/${slug}`;
    const html = read(`consulting/${slug}.html`);
    const blocks = [
      ...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
    ].flatMap(([, json]) => schemaNodes(JSON.parse(json)));
    const services = blocks.filter((block) => [block['@type']].flat().includes('Service'));
    assert.equal(services.length, 1, url);
    const service = services[0];
    assert.equal(service.url, url);
    assert.ok(service.name && service.description, `Missing service identity: ${url}`);
    assert.equal(service.provider?.['@id'], `${SITE_URL}/#person`, url);
    if (service.provider['@type']) {
      assert.ok([service.provider['@type']].flat().includes('Person'), url);
    }
    assertNoPriceOrRating(service);
  }
});

test('consulting contact links preserve the requested service and prefill an email or contact route', () => {
  for (const path of ROUTES) {
    const service = path === '/consulting' ? 'general' : path.split('/').at(-1);
    const ctas = anchors(main(read(`${path.slice(1)}.html`))).filter(
      (tag) => attribute(tag, 'data-consulting-service') === service
    );
    assert.ok(ctas.length > 0, `Missing service contact action: ${path}`);
    for (const tag of ctas) {
      const url = new URL(attribute(tag, 'href'), SITE_URL);
      if (url.protocol === 'mailto:') {
        assert.match(url.pathname, /@/, path);
        assert.ok(url.searchParams.get('subject')?.trim(), `Missing email subject: ${path}`);
        assert.ok(url.searchParams.get('body')?.trim(), `Missing email body: ${path}`);
      } else {
        assert.equal(url.origin, SITE_URL, path);
        assert.equal(url.pathname, '/contact', path);
        assert.equal(url.searchParams.get('service'), service, path);
      }
    }
  }
});
