import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  appendToListHeader,
  explicitlyAcceptsHtml,
  markdownTwinPath,
  matchQuality,
  negotiate,
  parseAccept,
} from '../../src/lib/content-negotiation.js';

describe('parseAccept', () => {
  it('reads media ranges, weights, and specificity', () => {
    assert.deepEqual(parseAccept('text/markdown;q=0.9, text/*;q=0.5, */*;q=0.1'), [
      { type: 'text', subtype: 'markdown', q: 0.9, specificity: 3 },
      { type: 'text', subtype: '*', q: 0.5, specificity: 2 },
      { type: '*', subtype: '*', q: 0.1, specificity: 1 },
    ]);
  });

  it('defaults a missing or unparseable weight to 1', () => {
    assert.equal(parseAccept('text/html')[0].q, 1);
    assert.equal(parseAccept('text/html;q=banana')[0].q, 1);
  });

  it('clamps weights to the 0..1 range', () => {
    assert.equal(parseAccept('text/html;q=7')[0].q, 1);
    assert.equal(parseAccept('text/html;q=-3')[0].q, 0);
  });

  it('ignores entries that are not media ranges', () => {
    assert.deepEqual(parseAccept('garbage, , text/html'), [
      { type: 'text', subtype: 'html', q: 1, specificity: 3 },
    ]);
  });

  it('returns nothing for a missing header', () => {
    assert.deepEqual(parseAccept(null), []);
    assert.deepEqual(parseAccept(''), []);
  });
});

describe('matchQuality', () => {
  it('prefers the most specific range even when a broader one scores higher', () => {
    const ranges = parseAccept('text/html;q=0.2, */*;q=0.9');
    assert.deepEqual(matchQuality(ranges, 'text/html'), { q: 0.2, specificity: 3 });
  });

  it('treats a q=0 match as unacceptable', () => {
    assert.equal(matchQuality(parseAccept('text/html;q=0'), 'text/html'), null);
  });

  it('returns null when nothing matches', () => {
    assert.equal(matchQuality(parseAccept('image/png'), 'text/html'), null);
  });
});

describe('negotiate', () => {
  it('serves Markdown when the client names it', () => {
    assert.equal(negotiate('text/markdown'), 'markdown');
    assert.equal(negotiate('text/x-markdown'), 'markdown');
    assert.equal(negotiate('text/markdown, text/html;q=0.5'), 'markdown');
    assert.equal(negotiate('text/html;q=0.4, text/markdown;q=0.8'), 'markdown');
  });

  it('serves HTML to browsers', () => {
    assert.equal(
      negotiate('text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'),
      'html'
    );
  });

  it('breaks a wildcard tie in favour of HTML', () => {
    // `curl` with no flags, link previewers, feed readers: nothing changes for them.
    assert.equal(negotiate('*/*'), 'html');
    assert.equal(negotiate('text/*'), 'html');
    assert.equal(negotiate(null), 'html');
  });

  it('breaks an equal-weight tie by specificity', () => {
    assert.equal(negotiate('text/markdown, */*'), 'markdown');
    assert.equal(negotiate('text/html, text/*'), 'html');
  });

  it('ignores a representation the client refused outright', () => {
    assert.equal(negotiate('text/markdown, text/html;q=0'), 'markdown');
    assert.equal(negotiate('text/markdown;q=0, text/html'), 'html');
  });

  it('reports that neither representation is acceptable', () => {
    assert.equal(negotiate('application/json'), 'none');
    assert.equal(negotiate('image/png, image/webp'), 'none');
  });

  it('does not substring-match a type that merely contains "markdown"', () => {
    assert.equal(negotiate('application/markdown+json'), 'none');
  });
});

describe('explicitlyAcceptsHtml', () => {
  it('is true only when text/html is named', () => {
    assert.equal(explicitlyAcceptsHtml('text/html,application/xhtml+xml,*/*;q=0.8'), true);
    assert.equal(explicitlyAcceptsHtml('*/*'), false);
    assert.equal(explicitlyAcceptsHtml('text/*'), false);
    assert.equal(explicitlyAcceptsHtml('text/markdown'), false);
    assert.equal(explicitlyAcceptsHtml('text/html;q=0'), false);
    assert.equal(explicitlyAcceptsHtml(null), false);
  });
});

describe('markdownTwinPath', () => {
  it('maps page routes to their .md sibling', () => {
    assert.equal(markdownTwinPath('/'), '/index.md');
    assert.equal(markdownTwinPath('/about'), '/about.md');
    assert.equal(markdownTwinPath('/work/stone'), '/work/stone.md');
    assert.equal(markdownTwinPath('/about/'), '/about.md');
  });

  it('leaves anything carrying an extension alone', () => {
    assert.equal(markdownTwinPath('/about.md'), null);
    assert.equal(markdownTwinPath('/rss.xml'), null);
    assert.equal(markdownTwinPath('/llms.txt'), null);
    assert.equal(markdownTwinPath('/_astro/index.abc123.css'), null);
    assert.equal(markdownTwinPath('/og/home.png'), null);
  });
});

describe('appendToListHeader', () => {
  it('adds a value to an existing list', () => {
    assert.equal(appendToListHeader('Accept-Encoding', 'Accept'), 'Accept-Encoding, Accept');
  });

  it('does not duplicate a value already present', () => {
    assert.equal(
      appendToListHeader('accept, Accept-Encoding', 'Accept'),
      'accept, Accept-Encoding'
    );
  });

  it('starts a new list when there is nothing to append to', () => {
    assert.equal(appendToListHeader(null, 'Accept'), 'Accept');
    assert.equal(appendToListHeader('', 'Accept'), 'Accept');
  });

  it('leaves a `*` list alone — it already varies on everything', () => {
    assert.equal(appendToListHeader('*', 'Accept'), '*');
  });
});
