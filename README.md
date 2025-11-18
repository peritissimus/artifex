# Artifex

> Personal portfolio of Kushal Patankar — Founder, Engineer, Creative Coder

A modern, high-performance portfolio website featuring WebGL visualizations, dual content modes (human/machine-readable), and automated content generation.

[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF?style=flat&logo=vite)](https://vitejs.dev)
[![Three.js](https://img.shields.io/badge/Three.js-v0.180-000000?style=flat&logo=three.js)](https://threejs.org)
[![Lighthouse Score](https://img.shields.io/badge/Lighthouse-95%2B-success?style=flat&logo=lighthouse)](https://developers.google.com/web/tools/lighthouse)

## Features

### 🎨 **Visual Design**
- **3D WebGL Particle Grid** - Interactive particle system using Three.js (2000 particles, mouse-following)
- **Blueprint Grid Background** - 20×20px grid with fade masks and smooth animations
- **Scroll-Based Effects** - Dynamic glow effects on vertical/horizontal lines
- **Dark Theme** - WCAG AA compliant color palette (`#0f0f0f`, `#cfcecd`, `#a8a5a5`)
- **Custom Typography** - Barlow & Barlow Semi Condensed from Google Fonts

### 🤖 **Dual Mode System**
- **HUMAN Mode** - Rich visual experience with 3D effects and styling
- **MACHINE Mode** - Clean, plain-text versions for AI/search engines
- Auto-generates machine-readable versions of all pages
- URL structure: `/` vs `/ai/`

### 📝 **Blog System**
- **Markdown-based** - Write posts in `/data/blog/posts/*.md`
- **Auto-generation** - Converts markdown → HTML with custom styling
- **Frontmatter Support** - title, date, author, category, tags, excerpt, readTime
- **Custom Renderer** - Bracket-style headings `[Title]`, styled code blocks
- **Orphaned Cleanup** - Removes HTML files without markdown source

### 🖼️ **OG Image Generation**
- **Satori + Sharp** - Generate Open Graph images (1200×630)
- **Brand-Matched** - Uses Barlow fonts and blueprint grid styling
- **Custom Per Type** - Different designs for blog posts, work pages, homepage
- **Static Assets** - Generated locally, committed to repo (no CI/CD overhead)

### 🗺️ **SEO & Performance**
- **Auto-Sitemap** - Generates `sitemap.xml` with proper priorities
- **Smart Priorities** - Homepage (1.0) → Blog (0.9/0.8) → Work (0.6) → AI (0.5)
- **Code Splitting** - Three.js, WebGL, and vendor chunks separated
- **Asset Optimization** - Inline < 4KB, minification, sourcemaps
- **Mobile Optimized** - Reduced particle count, disabled antialiasing

## Tech Stack

### Core
- **[Vite 6.3](https://vitejs.dev)** - Build tool with HMR
- **[Three.js 0.180](https://threejs.org)** - 3D graphics library
- **[SASS 1.93](https://sass-lang.com)** - CSS preprocessing

### Content Generation
- **[Marked 17.0](https://marked.js.org)** - Markdown parser
- **[Satori 0.18](https://github.com/vercel/satori)** - JSX to SVG (OG images)
- **[Sharp 0.34](https://sharp.pixelplumbing.com)** - Image processing
- **[@resvg/resvg-js](https://github.com/yisibl/resvg-js)** - SVG to PNG conversion
- **[@mozilla/readability](https://github.com/mozilla/readability)** - Content extraction

### Development
- **[Prettier](https://prettier.io)** - Code formatting
- **[Lighthouse](https://developers.google.com/web/tools/lighthouse)** - Performance auditing
- **[Semantic Release](https://semantic-release.gitbook.io)** - Automated versioning

## Project Structure

```
artifex/
├── src/
│   ├── pages/              # All HTML source files
│   │   ├── index.html      # Homepage
│   │   ├── about.html      # About page
│   │   ├── blog.html       # Blog index
│   │   ├── contact.html    # Contact page
│   │   ├── ai.html         # AI mode entry
│   │   ├── blog/           # Generated blog posts (gitignored)
│   │   └── work/           # Work portfolio pages
│   ├── js/                 # JavaScript
│   │   ├── main.js         # Entry point
│   │   ├── mode-toggle.js  # HUMAN/MACHINE mode switching
│   │   ├── webgl/
│   │   │   └── ParticleGrid.js  # Three.js particle system
│   │   └── effects/
│   │       └── ScrollGlow.js    # Scroll effects
│   └── styles/
│       └── main.scss       # Global styles
│
├── data/
│   └── blog/posts/         # Markdown blog posts (source)
│
├── public/
│   ├── og/                 # Generated OG images (committed)
│   ├── favicon.svg
│   └── robots.txt
│
├── scripts/                # Build automation
│   ├── generate-blog.js        # Markdown → HTML
│   ├── generate-ai-pages.js    # Create AI versions
│   ├── generate-og-images.js   # Generate OG images
│   └── generate-sitemap.js     # Create sitemap.xml
│
└── dist/                   # Build output (gitignored)
    ├── *.html              # Built pages
    ├── blog/               # Generated blog HTML
    ├── work/               # Work pages
    ├── ai/                 # AI mode versions
    ├── assets/             # Bundled JS/CSS
    └── sitemap.xml         # Generated sitemap
```

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/peritissimus/artifex.git
cd artifex

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The site will be available at `http://localhost:3000`

## Development Workflow

### Running Locally
```bash
pnpm dev          # Start dev server with HMR
pnpm preview      # Preview production build
```

### Building
```bash
pnpm build        # Full production build
```

**Build pipeline:**
1. Generate blog posts from markdown
2. Build with Vite (HTML, JS, CSS)
3. Generate AI-mode pages
4. Generate sitemap

### Content Management

#### Create a New Blog Post
```bash
# 1. Create markdown file
touch data/blog/posts/my-new-post.md

# 2. Add frontmatter
cat > data/blog/posts/my-new-post.md << 'EOF'
---
title: My New Post
date: 2025-11-19
author: Kushal Patankar
category: Tech
tags: [JavaScript, WebDev]
excerpt: A brief description of the post
readTime: 5 min read
slug: my-new-post
---

## Introduction
Your content here...
EOF

# 3. Generate blog HTML
pnpm blog:build

# 4. Generate OG image
pnpm og:generate

# 5. Commit changes
git add data/blog/posts/my-new-post.md public/og/blog/my-new-post.png
git commit -m "feat: add new blog post"
```

#### Regenerate Content
```bash
pnpm blog:build          # Regenerate all blog posts
pnpm ai:generate         # Regenerate AI mode pages
pnpm og:generate         # Regenerate OG images
pnpm sitemap:generate    # Regenerate sitemap
```

### Code Quality
```bash
pnpm format              # Format code with Prettier
pnpm format:check        # Check formatting
```

### Performance Auditing
```bash
pnpm lighthouse          # Desktop performance audit
pnpm lighthouse:mobile   # Mobile performance audit
```

## Scripts Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server (port 3000) |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm blog:new` | Generate single blog post |
| `pnpm blog:build` | Generate all blog posts |
| `pnpm ai:generate` | Generate AI-mode pages |
| `pnpm og:generate` | Generate OG images |
| `pnpm sitemap:generate` | Generate sitemap.xml |
| `pnpm format` | Format code |
| `pnpm lighthouse` | Run Lighthouse audit (desktop) |
| `pnpm lighthouse:mobile` | Run Lighthouse audit (mobile) |

## Configuration

### Vite Config
- **Root**: `src/pages` - All HTML files auto-discovered
- **Output**: `dist/` - Build output directory
- **Code Splitting**: Three.js, WebGL, and vendor chunks
- **Asset Inlining**: Files < 4KB inlined automatically

### Colors (SCSS Variables)
```scss
$bg-primary: #0f0f0f;      // Background
$text-primary: #cfcecd;    // Primary text
$accent-color: #a8a5a5;    // Accent
$border-color: #3a3a3a;    // Borders/grid
$text-bright: #ffffff;     // Bright text
```

### Fonts
- **Primary**: Barlow (sans-serif)
- **Monospace**: Barlow Semi Condensed

## Deployment

### Static Hosting
Build and deploy the `dist/` folder to any static hosting:

```bash
pnpm build
# Deploy dist/ folder
```

Compatible with:
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages
- AWS S3 + CloudFront

### CI/CD Notes
- OG images are pre-generated and committed (no generation needed in CI)
- Blog posts generated during build
- AI pages generated after Vite build
- Total build time: ~5-10 seconds

## Performance

- **Lighthouse Score**: 95+ (Desktop & Mobile)
- **First Contentful Paint**: < 1s
- **Time to Interactive**: < 2s
- **Total Bundle Size**: ~475KB (Three.js: 469KB, App: ~6KB)
- **Code Splitting**: Automatic with route-based chunks

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- WebGL required for particle effects

## Contributing

This is a personal portfolio, but feedback and suggestions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See [LICENSE](LICENSE) for details

## Contact

**Kushal Patankar**
- Website: [peritissimus.com](https://peritissimus.com)
- Email: [Contact via website](https://peritissimus.com/contact.html)

---

Built with ❤️ using Vite, Three.js, and modern web technologies
