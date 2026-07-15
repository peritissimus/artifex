#!/usr/bin/env node

/**
 * Home intro layer generator
 * Generates the HomeIntroVeil image layers via the OpenAI Images API.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/generate-intro-images.js          # all layers -> output/imagegen/<timestamp>/
 *   node scripts/generate-intro-images.js --only keyboard,drift          # regenerate specific layers
 *   node scripts/generate-intro-images.js --apply                        # write straight into public/
 *   node scripts/generate-intro-images.js --model gpt-image-2 --quality high
 *
 * Iterate by editing the PROMPTS block below, regenerating into output/,
 * and copying winners into public/ (or rerun with --apply).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const OUTPUT_DIR = path.join(ROOT_DIR, 'output/imagegen');

// ---------------------------------------------------------------------------
// Scene direction — edit these to iterate on the intro's look.
// Shared style keeps the four layers feeling like one illustration.
// ---------------------------------------------------------------------------

const STYLE = [
  'Painterly storybook illustration, soft gouache and watercolor texture,',
  'warm summer daylight, gentle film grain, muted warm cream highlights,',
  'cohesive palette of meadow greens, sky blues and warm cream (#f2debc).',
  'No text, no watermark, no people.',
].join(' ');

const LAYERS = {
  'sunny-bg': {
    file: 'home-intro-sunny-bg.webp',
    size: '1536x1024',
    transparent: false,
    prompt:
      `${STYLE} Wide establishing shot of rolling green meadow hills under a ` +
      'vivid blue summer sky with towering cumulus clouds, distant snow-capped ' +
      'mountains on the horizon, tall grass and tiny wildflowers in the lower ' +
      'third. Composition leaves the upper-middle sky open as negative space ' +
      'for a floating object.',
  },
  keyboard: {
    file: 'home-intro-keyboard.webp',
    size: '1024x1024',
    transparent: true,
    prompt:
      `${STYLE} A single cream-colored compact mechanical keyboard (65% layout) ` +
      'floating at a slight three-quarter tilt, viewed from below-front, soft ' +
      'warm sunlight on the keycaps, subtle painted shading. Isolated object ' +
      'on a fully transparent background, no shadow on the ground.',
  },
  drift: {
    file: 'home-intro-drift.webp',
    size: '1024x1024',
    transparent: true,
    prompt:
      `${STYLE} Scattered drifting leaves, petals and grass seeds caught in a ` +
      'breeze, varied sizes and rotations, loosely spread across the frame ' +
      'with generous empty space between them. Isolated elements on a fully ' +
      'transparent background.',
  },
  foreground: {
    file: 'home-intro-foreground.webp',
    size: '1536x1024',
    transparent: true,
    prompt:
      `${STYLE} Foreground framing layer: tall painterly grass blades and ` +
      'wildflower stems rising from the bottom edge only, soft-focus as if ' +
      'close to the camera lens, upper two thirds of the frame completely ' +
      'empty. Fully transparent background everywhere except the grass.',
  },
};

// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { only: null, apply: false, model: null, quality: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--apply') args.apply = true;
    else if (arg === '--only') args.only = argv[++i]?.split(',').map((s) => s.trim());
    else if (arg === '--model') args.model = argv[++i];
    else if (arg === '--quality') args.quality = argv[++i];
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: node scripts/generate-intro-images.js [--only a,b] [--apply] [--model id] [--quality low|medium|high]');
      process.exit(0);
    }
  }
  return args;
}

function loadDotEnv() {
  const envPath = path.join(ROOT_DIR, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
}

async function generateLayer(name, layer, { model, quality, apiKey }) {
  const body = {
    model,
    prompt: layer.prompt,
    size: layer.size,
    quality,
    output_format: 'webp',
    n: 1,
  };
  if (layer.transparent) body.background = 'transparent';

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${name}: API error ${res.status} — ${detail}`);
  }

  const json = await res.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error(`${name}: response contained no image data`);
  return Buffer.from(b64, 'base64');
}

async function main() {
  loadDotEnv();
  const args = parseArgs(process.argv.slice(2));

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Missing OPENAI_API_KEY (set it in the environment or a project .env file).');
    process.exit(1);
  }

  const model = args.model || process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
  // gpt-image-2 does not support background:transparent — alpha layers fall back to gpt-image-1.
  const transparentModel = process.env.OPENAI_IMAGE_MODEL_TRANSPARENT || 'gpt-image-1';
  const quality = args.quality || 'high';

  const names = args.only || Object.keys(LAYERS);
  const unknown = names.filter((n) => !LAYERS[n]);
  if (unknown.length) {
    console.error(`Unknown layer(s): ${unknown.join(', ')}. Available: ${Object.keys(LAYERS).join(', ')}`);
    process.exit(1);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outDir = args.apply ? PUBLIC_DIR : path.join(OUTPUT_DIR, stamp);
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`Model: ${model} (transparent layers: ${transparentModel}) | quality: ${quality} | output: ${path.relative(ROOT_DIR, outDir)}\n`);

  let failed = false;
  for (const name of names) {
    const layer = LAYERS[name];
    const layerModel = layer.transparent ? transparentModel : model;
    process.stdout.write(`Generating ${name} (${layerModel}, ${layer.size}${layer.transparent ? ', transparent' : ''})... `);
    try {
      const buffer = await generateLayer(name, layer, { model: layerModel, quality, apiKey });
      const dest = path.join(outDir, layer.file);
      fs.writeFileSync(dest, buffer);
      console.log(`ok — ${(buffer.length / 1024).toFixed(0)} KB -> ${path.relative(ROOT_DIR, dest)}`);
    } catch (err) {
      failed = true;
      console.log('FAILED');
      console.error(`  ${err.message}\n`);
    }
  }

  if (!args.apply && !failed) {
    console.log(`\nPreview the set, then copy winners into public/ or rerun with --apply.`);
  }
  process.exit(failed ? 1 : 0);
}

main();
