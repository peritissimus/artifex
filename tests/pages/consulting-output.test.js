import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const SITE_URL = 'https://peritissimus.com';
const DIST = new URL('../../dist/', import.meta.url);
const SERVICES = [
  {
    slug: 'applied-ai-engineering',
    name: 'Applied AI engineering',
    title: 'LLM Application Development Services',
    phrase: 'LLM application development',
  },
  {
    slug: 'scalable-ai-infrastructure',
    name: 'Scalable AI infrastructure',
    title: 'LLM Infrastructure Consulting',
    phrase: 'LLM infrastructure consulting',
  },
  {
    slug: 'distributed-systems-reliability',
    name: 'Distributed systems reliability',
    title: 'Distributed Systems Reliability Consulting',
  },
];
const CONTENT_SERVICES = {
  '/work/zoca': ['applied-ai-engineering', 'scalable-ai-infrastructure'],
  '/work/brihaspati': ['applied-ai-engineering'],
  '/work/dubverse': ['scalable-ai-infrastructure', 'distributed-systems-reliability'],
  '/blog/scaling-llm-applications': ['applied-ai-engineering', 'scalable-ai-infrastructure'],
  '/blog/celery-redis-media-pipeline': [
    'distributed-systems-reliability',
    'scalable-ai-infrastructure',
  ],
};
const REMOVED_ROUTES = ['/consulting', ...SERVICES.map(({ slug }) => `/consulting/${slug}`)];
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
    .replace(/<([a-z][\w:-]*)\b[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/\1>/gi, '')
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

function serviceDisclosure(html, slug) {
  const matches = [...main(html).matchAll(/<details\b([^>]*)>([\s\S]*?)<\/details>/g)].filter(
    ([, attrs]) => attribute(attrs, 'id') === slug
  );
  assert.equal(matches.length, 1, `Missing or duplicate service anchor: ${slug}`);
  return matches[0][2];
}

function serviceSchemas(html) {
  return [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .flatMap(([, json]) => schemaNodes(JSON.parse(json)))
    .filter((block) => [block['@type']].flat().includes('Service'));
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

test('consulting content has no separate routes, navigation item, or homepage section', () => {
  const sitemap = [...read('sitemap-0.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
  assert.ok(sitemap.includes(`${SITE_URL}/contact`));
  assert.ok(!sitemap.some((url) => new URL(url).pathname.startsWith('/consulting')));
  for (const path of REMOVED_ROUTES) {
    for (const extension of ['html', 'md']) {
      assert.ok(
        !existsSync(new URL(`${path.slice(1)}.${extension}`, DIST)),
        `Removed route is still built: ${path}.${extension}`
      );
    }
  }
  const homepage = read('index.html');
  for (const element of ['header', 'footer']) {
    const navigation =
      homepage.match(new RegExp(`<${element}\\b[^>]*>([\\s\\S]*?)<\\/${element}>`))?.[1] ?? '';
    assert.ok(
      !anchors(navigation).some((tag) => attribute(tag, 'href').startsWith('/consulting')),
      `Consulting is still a separate ${element} item`
    );
  }
  assert.doesNotMatch(homepage, /\bhome-consulting\b/);
  for (const document of [
    'index.html',
    'index.md',
    'contact.html',
    'contact.md',
    'about.html',
    'about.md',
  ]) {
    assert.doesNotMatch(
      read(document),
      /(?:href="|\]\()(?:https:\/\/peritissimus\.com)?\/consulting\b/,
      document
    );
  }
});

test('Contact remains indexable and its Markdown twin carries the visible service content and links', () => {
  const html = read('contact.html');
  const markdown = read('contact.md');
  const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*>/)?.[0] ?? '';
  assert.equal(attribute(canonical, 'href'), `${SITE_URL}/contact`);
  assert.doesNotMatch(html, /name="robots" content="[^"]*noindex/);
  const title = html.match(/<title>(.*?)<\/title>/)?.[1] ?? '';
  assert.ok(title);
  assert.equal([...main(html).matchAll(/<h1\b/g)].length, 1);
  assert.equal(plain(main(html).match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? ''), 'contact');
  for (const [, , attrs, copy] of main(html).matchAll(
    /<(h[1-3]|p|li|dt|dd)\b([^>]*)>([\s\S]*?)<\/\1>/g
  )) {
    if (/class="[^"]*page-kicker/.test(attrs)) continue;
    assert.ok(
      plain(markdown).includes(plain(copy)),
      `Missing Contact Markdown copy: ${plain(copy)}`
    );
  }
  const description = html.match(/<meta\b[^>]*name="description"[^>]*>/)?.[0] ?? '';
  assert.ok(attribute(description, 'content'));
  assert.ok(plain(markdown).includes(plain(attribute(description, 'content'))));
  const metadata = plain(`${title} ${attribute(description, 'content')}`);
  for (const { phrase } of SERVICES.filter((service) => service.phrase)) {
    assert.ok(metadata.includes(plain(phrase)), `Missing Contact metadata topic: ${phrase}`);
    assert.ok(
      plain(main(html)).includes(plain(phrase)),
      `Missing visible Contact topic: ${phrase}`
    );
    assert.ok(plain(markdown).includes(plain(phrase)), `Missing Markdown topic: ${phrase}`);
  }
  const alternate = html.match(/<link\b[^>]*type="text\/markdown"[^>]*>/)?.[0] ?? '';
  assert.equal(attribute(alternate, 'href'), `${SITE_URL}/contact.md`);
  for (const tag of anchors(main(html))) {
    const href = attribute(tag, 'href');
    if (href.startsWith('/')) {
      assert.ok(markdown.includes(`](${SITE_URL}${href})`), `Missing Markdown link: ${href}`);
    }
  }
});

test('Contact exposes three native service disclosures with valid project and article evidence', () => {
  const html = read('contact.html');
  const markdown = read('contact.md');
  for (const { slug, name, title } of SERVICES) {
    const content = serviceDisclosure(html, slug);
    const summary = content.match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/)?.[1] ?? '';
    assert.ok(plain(summary).includes(plain(name)), `Missing service summary: ${slug}`);
    assert.ok(plain(markdown).includes(plain(name)), `Missing Markdown service: ${slug}`);
    const summaryCopy = plain(summary).replace(plain(name), '');
    assert.ok(summaryCopy, `Missing descriptive service summary: ${slug}`);
    assert.ok(plain(markdown).includes(summaryCopy), `Missing Markdown summary: ${slug}`);
    const headings = [...content.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/g)].map(([, text]) =>
      plain(text)
    );
    assert.equal(
      headings.filter((heading) => heading === plain(title)).length,
      1,
      `The service title must be a visible heading: ${slug}`
    );
    assert.ok(plain(markdown).includes(plain(title)), `Missing Markdown service title: ${slug}`);
    const links = anchors(content).map((tag) => attribute(tag, 'href'));
    for (const prefix of ['/work/', '/blog/']) {
      const proof = links.filter((href) => href.startsWith(prefix));
      assert.ok(proof.length > 0, `Missing ${prefix} evidence: ${slug}`);
      for (const href of proof) {
        const proofPath = new URL(href, SITE_URL).pathname;
        assert.ok(existsSync(new URL(`${proofPath.slice(1)}.html`, DIST)), href);
      }
    }
  }
});

test('Contact service structured data points to real page anchors and the Person provider', () => {
  const html = read('contact.html');
  const services = serviceSchemas(html);
  assert.equal(services.length, SERVICES.length);
  for (const { slug, title } of SERVICES) {
    const url = `${SITE_URL}/contact#${slug}`;
    const matching = services.filter((service) => service.url === url);
    assert.equal(matching.length, 1, `Missing or duplicate Contact service schema: ${url}`);
    const service = matching[0];
    assert.ok(html.includes(`id="${slug}"`), `Missing schema target: ${url}`);
    assert.equal(service.name, title, `Schema must name the visible service: ${url}`);
    assert.ok(service.description, `Missing service description: ${url}`);
    assert.equal(service.provider?.['@id'], `${SITE_URL}/#person`, url);
    if (service.provider['@type']) {
      assert.ok([service.provider['@type']].flat().includes('Person'), url);
    }
    assertNoPriceOrRating(service);
  }
});

test('LLM services retain existing-model scope and qualified cost claims', () => {
  const html = read('contact.html');
  const schemas = serviceSchemas(html);
  for (const { slug, phrase } of SERVICES.filter((service) => service.phrase)) {
    const content = serviceDisclosure(html, slug);
    const introduction = content.match(/<p\b[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '';
    const description =
      schemas.find((service) => service.url === `${SITE_URL}/contact#${slug}`)?.description ?? '';
    for (const [label, text] of [
      ['introduction', introduction],
      ['schema description', description],
    ]) {
      assert.match(
        plain(text),
        /(?:existing|hosted)(?:ai)?models|modelapis/,
        `LLM application scope missing from ${slug} ${label}`
      );
    }
    assert.ok(
      plain(description).includes(plain(phrase)),
      `Missing service schema topic: ${phrase}`
    );
  }
  assert.match(
    plain(serviceDisclosure(html, 'applied-ai-engineering')),
    /notfoundation-modeltraining/
  );
  const infrastructure = plain(serviceDisclosure(html, 'scalable-ai-infrastructure'));
  assert.match(infrastructure, /doesnotoffergpu-fleetmanagement,distributedmodeltraining/);
  assert.match(infrastructure, /savingsdependonyourworkload|savingsarenotguaranteed/);
});

test('relevant engineering pages link to the matching Contact evidence with descriptive titles in both formats', () => {
  const contact = read('contact.html');
  for (const [path, slugs] of Object.entries(CONTENT_SERVICES)) {
    const html = read(`${path.slice(1)}.html`);
    const markdown = read(`${path.slice(1)}.md`);
    const related =
      main(html).match(
        /<aside\b[^>]*class="[^"]*\bcontact-related\b[^"]*"[^>]*>([\s\S]*?)<\/aside>/
      )?.[1] ?? '';
    assert.ok(related, `Missing contextual Contact links: ${path}`);
    const links = [...related.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
    assert.deepEqual(
      links.map(([, attrs]) => attribute(attrs, 'href')).sort(),
      slugs.map((slug) => `/contact#${slug}`).sort(),
      `Incorrect related services: ${path}`
    );
    const markdownLinks = [
      ...markdown.matchAll(/\[([^\]]+)\]\((https:\/\/peritissimus\.com\/contact#[^)]+)\)/g),
    ];
    for (const slug of slugs) {
      const service = SERVICES.find((item) => item.slug === slug);
      const target = `/contact#${slug}`;
      const label = links.find(([, attrs]) => attribute(attrs, 'href') === target)?.[2] ?? '';
      assert.equal(plain(label).replace(/[→↗]/g, ''), plain(service.title), path);
      assert.ok(
        markdownLinks.some(
          ([, label, href]) =>
            href === `${SITE_URL}${target}` &&
            plain(label).replace(/[→↗]/g, '') === plain(service.title)
        ),
        `Missing descriptive Markdown Contact link: ${path} → ${slug}`
      );
      const evidence = anchors(serviceDisclosure(contact, slug)).map((tag) =>
        attribute(tag, 'href')
      );
      assert.ok(
        evidence.includes(path),
        `Contact must point back to its evidence: ${slug} → ${path}`
      );
    }
  }
});

test('Contact has a general draft and distinct prefilled service options', () => {
  const html = read('contact.html');
  const picker =
    html.match(/<select\b[^>]*id="consulting-service"[^>]*>([\s\S]*?)<\/select>/)?.[1] ?? '';
  const options = [...picker.matchAll(/<option\b[^>]*>/g)].map(([tag]) => tag);
  assert.deepEqual(
    options.map((tag) => attribute(tag, 'value')),
    ['general', ...SERVICES.map(({ slug }) => slug)]
  );
  const drafts = new Set();
  for (const tag of options) {
    const key = attribute(tag, 'value');
    const href = attribute(tag, 'data-email');
    const url = new URL(href);
    assert.equal(url.protocol, 'mailto:', key);
    assert.match(url.pathname, /@/, key);
    assert.ok(url.searchParams.get('subject')?.trim(), `Missing email subject: ${key}`);
    assert.ok(url.searchParams.get('body')?.trim(), `Missing email body: ${key}`);
    assert.ok(!drafts.has(href), `Repeated email draft: ${key}`);
    drafts.add(href);
  }
  const cta = anchors(main(html)).find((tag) => attribute(tag, 'id') === 'contact-project-email');
  assert.ok(cta, 'Missing project email action');
  assert.equal(attribute(cta, 'data-consulting-service'), 'general');
  assert.equal(attribute(cta, 'href'), attribute(options[0], 'data-email'));
});
