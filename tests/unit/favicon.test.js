import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Resvg } from '@resvg/resvg-js';
import { createFavicon } from '../../scripts/generate-favicon.js';

const svg = readFileSync(new URL('../../public/favicon.svg', import.meta.url), 'utf8');
const committed = readFileSync(new URL('../../public/favicon.ico', import.meta.url));

function frames(ico) {
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 3);

  return [16, 32, 48].map((size, index) => {
    const entry = 6 + index * 16;
    assert.equal(ico[entry], size);
    assert.equal(ico[entry + 1], size);
    assert.equal(ico.readUInt16LE(entry + 6), 32);
    const offset = ico.readUInt32LE(entry + 12);
    const length = ico.readUInt32LE(entry + 8);
    assert.ok(offset + length <= ico.length);
    const bitmap = ico.subarray(offset, offset + length);
    assert.equal(bitmap.readUInt32LE(0), 40);
    assert.equal(bitmap.readInt32LE(4), size);
    assert.equal(bitmap.readInt32LE(8), size * 2);
    return { size, bitmap };
  });
}

function pixel(bitmap, size, x, y) {
  const start = 40 + ((size - 1 - y) * size + x) * 4;
  return [bitmap[start + 2], bitmap[start + 1], bitmap[start], bitmap[start + 3]];
}

test('generated and committed favicons preserve every SVG pixel and alpha at each size', () => {
  const generated = frames(createFavicon(svg));
  const saved = frames(committed);
  for (const [index, { size }] of generated.entries()) {
    const expected = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().pixels;
    for (const { bitmap } of [generated[index], saved[index]]) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const start = (y * size + x) * 4;
          assert.deepEqual(pixel(bitmap, size, x, y), [...expected.subarray(start, start + 4)]);
        }
      }
    }
  }
});

test('committed favicon has transparent corners, a black circle, and a white diamond', () => {
  for (const { size, bitmap } of frames(committed)) {
    for (const [x, y] of [
      [0, 0],
      [size - 1, 0],
      [0, size - 1],
      [size - 1, size - 1],
    ]) {
      assert.equal(pixel(bitmap, size, x, y)[3], 0);
    }
    assert.deepEqual(pixel(bitmap, size, size / 2, size / 2), [0, 0, 0, 255]);
    let brightPixels = 0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const [r, g, b, alpha] = pixel(bitmap, size, x, y);
        // The original 1px stroke is antialiased to gray when scaled to 16px.
        if (r > 0 && r === g && g === b && alpha === 255) brightPixels++;
      }
    }
    assert.ok(brightPixels > 0, `Missing diamond at ${size}px`);
  }
});

test('ICO legacy transparency masks agree with the alpha channel', () => {
  for (const { size, bitmap } of frames(committed)) {
    const stride = Math.ceil(size / 32) * 4;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const mask = bitmap[40 + size * size * 4 + (size - 1 - y) * stride + (x >> 3)];
        assert.equal(Boolean(mask & (0x80 >> (x & 7))), pixel(bitmap, size, x, y)[3] === 0);
      }
    }
  }
});

test('both layouts use matching versioned SVG and ICO URLs', () => {
  for (const layout of ['Base', 'Terminal']) {
    const source = readFileSync(
      new URL(`../../src/layouts/${layout}.astro`, import.meta.url),
      'utf8'
    );
    const versions = ['svg', 'ico'].map((extension) => {
      const match = source.match(new RegExp(`href="/favicon\\.${extension}\\?v=([^"&]+)"`));
      assert.ok(match, `${layout} must refresh the ${extension} favicon URL`);
      return match[1];
    });
    assert.equal(versions[0], versions[1]);
  }
});
