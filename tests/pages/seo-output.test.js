import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';

const dist = new URL('../../dist/', import.meta.url);
const read = (path) => readFileSync(new URL(path, dist), 'utf8');
const urls = [...read('sitemap-0.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

test('sitemap pages have unique titles, canonical URLs, and indexable HTML', () => {
  const titles = new Set();
  for (const url of urls) {
    const path = new URL(url).pathname;
    const html = read(path === '/' ? 'index.html' : `${path.slice(1)}.html`);
    assert.ok(
      html.includes(
        `rel="canonical" href="${url === 'https://peritissimus.com' ? `${url}/` : url}"`
      ),
      url
    );
    assert.doesNotMatch(html, /name="robots" content="[^"]*noindex/, url);
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    assert.ok(title && !titles.has(title), `Missing or duplicate title: ${url}`);
    titles.add(title);
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1, url);
  }
});

test('all published articles have valid discovery links, anchors, and social images', () => {
  for (const url of urls.filter((url) => new URL(url).pathname.startsWith('/blog/'))) {
    const path = new URL(url).pathname.slice(1);
    const html = read(`${path}.html`);
    const markdown = read(`${path}.md`);
    const related = html.match(
      /<nav[^>]*aria-labelledby="related-reading-title"[^>]*>([\s\S]*?)<\/nav>/
    )?.[1];
    assert.ok(related, `No reading path: ${url}`);
    for (const [, href] of related.matchAll(/href="(\/blog\/[^"#]+)"/g)) {
      assert.ok(existsSync(new URL(`${href.slice(1)}.html`, dist)), href);
      assert.ok(markdown.includes(href), `Missing Markdown twin link: ${href}`);
      assert.notEqual(`https://peritissimus.com${href}`, url);
    }
    for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) {
      assert.ok(html.includes(`id="${id}"`), `Broken anchor ${id} in ${url}`);
    }
    const image = html.match(
      /property="og:image" content="https:\/\/peritissimus.com\/([^"]+)"/
    )?.[1];
    assert.ok(image && existsSync(new URL(image, dist)), `Missing social image: ${url}`);
    assert.match(html, /max-image-preview:large/);
    for (const [, json] of html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
    ))
      JSON.parse(json);
  }
});

test('homepage exposes three recent articles with matching Markdown links', () => {
  const links = [
    ...read('index.html').matchAll(/class="home-list-item home-writing-item" href="([^"]+)"/g),
  ].map((match) => match[1]);
  assert.equal(links.length, 3);
  assert.equal(new Set(links).size, 3);
  for (const href of links) {
    assert.ok(read('index.md').includes(href));
    assert.ok(existsSync(new URL(`${href.slice(1)}.html`, dist)));
  }
});
