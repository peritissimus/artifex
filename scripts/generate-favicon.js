#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const SIZES = [16, 32, 48];

/** Derive the ICO from the SVG without flattening its transparent corners. */
export function createFavicon(svg) {
  const frames = SIZES.map((size) => {
    const pixels = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().pixels;
    const colorBytes = size * size * 4;
    const maskStride = Math.ceil(size / 32) * 4;
    const bitmap = Buffer.alloc(40 + colorBytes + maskStride * size);

    bitmap.writeUInt32LE(40, 0);
    bitmap.writeInt32LE(size, 4);
    // ICO bitmaps store the color image followed by a one-bit transparency mask.
    bitmap.writeInt32LE(size * 2, 8);
    bitmap.writeUInt16LE(1, 12);
    bitmap.writeUInt16LE(32, 14);
    bitmap.writeUInt32LE(colorBytes + maskStride * size, 20);

    for (let row = 0; row < size; row++) {
      for (let x = 0; x < size; x++) {
        // DIB color and mask rows are bottom-up; Resvg returns top-down RGBA.
        const source = ((size - 1 - row) * size + x) * 4;
        const target = 40 + (row * size + x) * 4;
        bitmap[target] = pixels[source + 2];
        bitmap[target + 1] = pixels[source + 1];
        bitmap[target + 2] = pixels[source];
        bitmap[target + 3] = pixels[source + 3];

        // Keep the legacy AND mask consistent with the full alpha channel.
        if (pixels[source + 3] === 0) {
          bitmap[40 + colorBytes + row * maskStride + (x >> 3)] |= 0x80 >> (x & 7);
        }
      }
    }

    return { size, bitmap };
  });

  const directory = Buffer.alloc(6 + frames.length * 16);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(frames.length, 4);
  let offset = directory.length;

  for (const [index, { size, bitmap }] of frames.entries()) {
    const entry = 6 + index * 16;
    directory[entry] = size;
    directory[entry + 1] = size;
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(bitmap.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += bitmap.length;
  }

  return Buffer.concat([directory, ...frames.map(({ bitmap }) => bitmap)]);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const svg = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8');
  writeFileSync(new URL('../public/favicon.ico', import.meta.url), createFavicon(svg));
  console.log('Generated favicon.ico at 16, 32, and 48px with transparent corners.');
}
