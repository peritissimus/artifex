#!/usr/bin/env node

/**
 * OG Image Generator for Astro
 * Generates Open Graph images for all pages using Satori + resvg
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const OG_OUTPUT_DIR = path.join(ROOT_DIR, 'public/og');

// OG Image dimensions (standard)
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

// Brand colors (matching styles)
const COLORS = {
  bg: '#0f0f0f',
  text: '#cfcecd',
  accent: '#a8a5a5',
  border: '#3a3a3a',
  textBright: '#ffffff',
};

// Page configurations
const PAGES = [
  { slug: 'home', title: 'Kushal', description: 'System Architect & Engineer', type: 'home' },
  {
    slug: 'about',
    title: 'About',
    description: 'Founding engineer with 4+ years of experience',
    type: 'default',
  },
  {
    slug: 'blog',
    title: 'Blog',
    description: 'Technical articles and engineering insights',
    type: 'default',
  },
  {
    slug: 'contact',
    title: 'Contact',
    description: 'Get in touch for collaboration opportunities',
    type: 'default',
  },
];

// Work pages
const WORK_PAGES = [
  {
    slug: 'zoca',
    title: 'Zoca',
    description: 'Sr Software Engineer building AI products',
    type: 'work',
  },
  {
    slug: 'brihaspati',
    title: 'Brihaspati',
    description: 'Founding Engineer - AI-powered mobile app',
    type: 'work',
  },
  {
    slug: 'dubverse',
    title: 'Dubverse',
    description: 'Founding Engineer - AI video dubbing platform',
    type: 'work',
  },
  {
    slug: 'simplesounds',
    title: 'SimpleSounds',
    description: 'Co-Founder - AI voice-over platform',
    type: 'work',
  },
];

// Blog posts (read from content directory)
function getBlogPosts() {
  const blogDir = path.join(ROOT_DIR, 'src/content/blog');
  if (!fs.existsSync(blogDir)) return [];

  const files = fs.readdirSync(blogDir).filter((f) => f.endsWith('.md'));
  return files.map((file) => {
    const content = fs.readFileSync(path.join(blogDir, file), 'utf-8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return null;

    const frontmatter = frontmatterMatch[1];
    const titleMatch = frontmatter.match(/title:\s*(.+)/);
    const descMatch = frontmatter.match(/description:\s*(.+)/);

    return {
      slug: file.replace('.md', ''),
      title: titleMatch ? titleMatch[1].trim() : file.replace('.md', ''),
      description: descMatch ? descMatch[1].trim() : '',
      type: 'blog',
    };
  }).filter(Boolean);
}

/**
 * Base OG Template
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
        // Blueprint grid background
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
                  children:
                    description.length > 120 ? description.substring(0, 120) + '...' : description,
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
async function generateOGImage(template, outputPath, fonts) {
  try {
    // Generate SVG using Satori
    const svg = await satori(template, {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      fonts,
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
 * Load fonts
 */
function loadFonts() {
  const fontsDir = path.join(ROOT_DIR, 'node_modules/@fontsource');

  return [
    {
      name: 'Barlow',
      data: fs.readFileSync(path.join(fontsDir, 'barlow/files/barlow-latin-400-normal.woff')),
      weight: 400,
      style: 'normal',
    },
    {
      name: 'Barlow',
      data: fs.readFileSync(path.join(fontsDir, 'barlow/files/barlow-latin-600-normal.woff')),
      weight: 600,
      style: 'normal',
    },
    {
      name: 'Barlow',
      data: fs.readFileSync(path.join(fontsDir, 'barlow/files/barlow-latin-700-normal.woff')),
      weight: 700,
      style: 'normal',
    },
    {
      name: 'Barlow Semi Condensed',
      data: fs.readFileSync(
        path.join(fontsDir, 'barlow-semi-condensed/files/barlow-semi-condensed-latin-600-normal.woff')
      ),
      weight: 600,
      style: 'normal',
    },
  ];
}

/**
 * Main
 */
async function main() {
  console.log('🖼️  Generating OG images...\n');

  const fonts = loadFonts();
  const blogPosts = getBlogPosts();

  // Generate main pages
  for (const page of PAGES) {
    const template = getBaseTemplate(page);
    const outputPath = path.join(OG_OUTPUT_DIR, `${page.slug}.png`);
    await generateOGImage(template, outputPath, fonts);
  }

  // Generate work pages
  for (const page of WORK_PAGES) {
    const template = getBaseTemplate(page);
    const outputPath = path.join(OG_OUTPUT_DIR, `work/${page.slug}.png`);
    await generateOGImage(template, outputPath, fonts);
  }

  // Generate blog pages
  for (const page of blogPosts) {
    const template = getBaseTemplate(page);
    const outputPath = path.join(OG_OUTPUT_DIR, `blog/${page.slug}.png`);
    await generateOGImage(template, outputPath, fonts);
  }

  const total = PAGES.length + WORK_PAGES.length + blogPosts.length;
  console.log(`\n✓ Generated ${total} OG images!`);
}

main().catch((error) => {
  console.error('Error generating OG images:', error);
  process.exit(1);
});
