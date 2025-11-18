#!/usr/bin/env node

/**
 * OG Image Generator
 * Generates Open Graph images for all pages using Satori + Sharp
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import satori from 'satori';
import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const SRC_PAGES_DIR = path.join(ROOT_DIR, 'src/pages');
const OG_OUTPUT_DIR = path.join(ROOT_DIR, 'public/og');

// OG Image dimensions (standard)
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

// Brand colors (matching main.scss)
const COLORS = {
  bg: '#0f0f0f',        // $bg-primary
  text: '#cfcecd',      // $text-primary
  accent: '#a8a5a5',    // $accent-color
  border: '#3a3a3a',    // $border-color
  textBright: '#ffffff', // $text-bright
};

/**
 * Extract metadata from HTML file
 */
function extractMetadata(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf-8');

  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  let title = titleMatch ? titleMatch[1].split(' - ')[0].trim() : 'Peritissimus';

  const descMatch = html.match(/<meta name="description" content="(.*?)"/);
  const description = descMatch ? descMatch[1] : '';

  // Determine page type
  let type = 'default';
  if (htmlPath.includes('/work/')) type = 'work';
  else if (htmlPath.includes('/blog/') && !htmlPath.endsWith('blog.html')) type = 'blog';
  else if (htmlPath.endsWith('index.html')) type = 'home';

  // Use "Kushal" for homepage
  if (type === 'home') {
    title = 'Kushal';
  }

  return { title, description, type };
}

/**
 * Base OG Template (JSX-like structure)
 */
function getBaseTemplate({ title, description, type }) {
  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: COLORS.bg,
        padding: '80px',
        fontFamily: 'Barlow',
        position: 'relative',
      },
      children: [
        // Blueprint grid background (matching .blueprint-grid)
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                linear-gradient(90deg, ${COLORS.border} 1px, transparent 1px),
                linear-gradient(0deg, ${COLORS.border} 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              opacity: 0.3,
            },
          },
        },
        // Left vertical line
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: '80px',
              width: '2px',
              height: '100%',
              backgroundColor: COLORS.border,
              opacity: 0.5,
            },
          },
        },
        // Right vertical line
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              right: '80px',
              width: '2px',
              height: '100%',
              backgroundColor: COLORS.border,
              opacity: 0.5,
            },
          },
        },
        // Content
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '40px',
              zIndex: 1,
            },
            children: [
              // Title
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: type === 'home' ? '96px' : '72px',
                    fontWeight: 'bold',
                    color: COLORS.text,
                    lineHeight: 1.1,
                    maxWidth: '1000px',
                  },
                  children: type === 'blog' || type === 'work' ? `[${title}]` : title,
                },
              },
              // Description
              description && {
                type: 'div',
                props: {
                  style: {
                    fontSize: '32px',
                    color: COLORS.accent,
                    lineHeight: 1.4,
                    maxWidth: '900px',
                  },
                  children: description.length > 120 ? description.substring(0, 120) + '...' : description,
                },
              },
            ].filter(Boolean),
          },
        },
        // Footer
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 1,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '32px',
                    color: COLORS.textBright,
                    fontFamily: 'Barlow Semi Condensed',
                    fontWeight: '600',
                    letterSpacing: '0.05em',
                  },
                  children: 'peritissimus',
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '24px',
                    color: COLORS.border,
                    textTransform: 'uppercase',
                    fontFamily: 'Barlow Semi Condensed',
                    letterSpacing: '0.2em',
                  },
                  children: type.toUpperCase(),
                },
              },
            ],
          },
        },
      ],
    },
  };
}

/**
 * Generate OG image from template
 */
async function generateOGImage(template, outputPath) {
  try {
    // Generate SVG using Satori with Barlow fonts
    const svg = await satori(template, {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      fonts: [
        {
          name: 'Barlow',
          data: fs.readFileSync(path.join(ROOT_DIR, 'node_modules/@fontsource/barlow/files/barlow-latin-400-normal.woff')),
          weight: 400,
          style: 'normal',
        },
        {
          name: 'Barlow',
          data: fs.readFileSync(path.join(ROOT_DIR, 'node_modules/@fontsource/barlow/files/barlow-latin-600-normal.woff')),
          weight: 600,
          style: 'normal',
        },
        {
          name: 'Barlow',
          data: fs.readFileSync(path.join(ROOT_DIR, 'node_modules/@fontsource/barlow/files/barlow-latin-700-normal.woff')),
          weight: 700,
          style: 'normal',
        },
        {
          name: 'Barlow Semi Condensed',
          data: fs.readFileSync(path.join(ROOT_DIR, 'node_modules/@fontsource/barlow-semi-condensed/files/barlow-semi-condensed-latin-600-normal.woff')),
          weight: 600,
          style: 'normal',
        },
      ],
    });

    // Convert SVG to PNG using resvg
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: OG_WIDTH,
      },
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write PNG file
    fs.writeFileSync(outputPath, pngBuffer);
    console.log(`✓ Generated: ${outputPath.replace(ROOT_DIR, '')}`);
  } catch (error) {
    console.error(`✗ Failed to generate ${outputPath}:`, error.message);
  }
}

/**
 * Generate OG images for all pages
 */
async function main() {
  console.log('🖼️  Generating OG images...\n');

  const pages = [
    { path: path.join(SRC_PAGES_DIR, 'index.html'), output: 'home.png' },
    { path: path.join(SRC_PAGES_DIR, 'about.html'), output: 'about.png' },
    { path: path.join(SRC_PAGES_DIR, 'blog.html'), output: 'blog.png' },
    { path: path.join(SRC_PAGES_DIR, 'contact.html'), output: 'contact.png' },
  ];

  // Add work pages
  const workDir = path.join(SRC_PAGES_DIR, 'work');
  if (fs.existsSync(workDir)) {
    const workFiles = fs.readdirSync(workDir).filter((f) => f.endsWith('.html'));
    workFiles.forEach((file) => {
      pages.push({
        path: path.join(workDir, file),
        output: `work/${file.replace('.html', '.png')}`,
      });
    });
  }

  // Add blog posts
  const blogDir = path.join(SRC_PAGES_DIR, 'blog');
  if (fs.existsSync(blogDir)) {
    const blogFiles = fs.readdirSync(blogDir).filter((f) => f.endsWith('.html'));
    blogFiles.forEach((file) => {
      pages.push({
        path: path.join(blogDir, file),
        output: `blog/${file.replace('.html', '.png')}`,
      });
    });
  }

  // Generate images
  for (const page of pages) {
    if (fs.existsSync(page.path)) {
      const metadata = extractMetadata(page.path);
      const template = getBaseTemplate(metadata);
      const outputPath = path.join(OG_OUTPUT_DIR, page.output);
      await generateOGImage(template, outputPath);
    }
  }

  console.log(`\n✓ Generated ${pages.length} OG images!`);
  console.log('\nOG images are available at:');
  console.log('  /og/home.png');
  console.log('  /og/about.png');
  console.log('  /og/blog.png');
  console.log('  /og/contact.png');
  console.log('  /og/work/*.png');
  console.log('  /og/blog/*.png');
}

main().catch((error) => {
  console.error('Error generating OG images:', error);
  process.exit(1);
});
