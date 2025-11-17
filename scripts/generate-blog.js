#!/usr/bin/env node

/**
 * Blog Generator Script
 * Converts markdown blog posts to HTML and updates the blog index
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const POSTS_DIR = path.join(__dirname, '../blog/posts');
const BLOG_OUTPUT_DIR = path.join(__dirname, '../blog');
const BLOG_INDEX_PATH = path.join(__dirname, '../blog.html');

/**
 * Parse markdown frontmatter and content
 */
function parseMarkdown(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    throw new Error('Invalid markdown format. Missing frontmatter.');
  }

  const frontmatter = {};
  const frontmatterContent = match[1];
  const markdownContent = match[2];

  // Parse frontmatter
  frontmatterContent.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      const value = valueParts.join(':').trim();
      // Handle arrays (tags)
      if (value.startsWith('[') && value.endsWith(']')) {
        frontmatter[key.trim()] = value
          .slice(1, -1)
          .split(',')
          .map((item) => item.trim());
      } else {
        frontmatter[key.trim()] = value;
      }
    }
  });

  return { frontmatter, content: markdownContent };
}

/**
 * Configure marked with custom renderer
 */
marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      if (depth === 2) {
        return `<h2>[${text}]</h2>\n`;
      } else if (depth === 3) {
        return `<h3>${text}</h3>\n`;
      }
      return `<h${depth}>${text}</h${depth}>\n`;
    },

    code({ text, lang }) {
      const language = lang ? lang.toUpperCase() : 'CODE';
      return `<div class="code-block">
  <div class="code-header">
    <span class="code-lang">[${language}]</span>
  </div>
  <pre><code>${text}</code></pre>
</div>\n`;
    },

    list({ ordered, items }) {
      const type = ordered ? 'ol' : 'ul';
      const className = ordered ? 'post-numbered-list' : 'post-list';
      const body = items.map(item => this.listitem(item)).join('');
      return `<${type} class="${className}">\n${body}</${type}>\n`;
    },

    listitem({ tokens }) {
      const text = this.parser.parseInline(tokens);
      return `  <li>${text}</li>\n`;
    },

    paragraph({ tokens }) {
      const text = this.parser.parseInline(tokens);
      return `<p>${text}</p>\n`;
    }
  }
});

/**
 * Convert markdown to HTML and wrap sections
 */
function markdownToHtml(markdown) {
  // Convert markdown to HTML
  let html = marked.parse(markdown);

  // Wrap h2 sections in post-section divs
  html = html.replace(/<h2>\[(.*?)\]<\/h2>\n([\s\S]*?)(?=<h2>\[|$)/g, (match, title, content) => {
    return `<div class="post-section">
  <h2>[${title}]</h2>
${content.trim()}
</div>\n\n`;
  });

  return html.trim();
}

/**
 * Generate HTML page from markdown
 */
function generateBlogPost(markdown, filename) {
  const { frontmatter, content } = parseMarkdown(markdown);
  const htmlContent = markdownToHtml(content);

  const slug = frontmatter.slug || filename.replace('.md', '');
  const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags.join(', ') : frontmatter.tags;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- SEO Meta Tags -->
    <title>${frontmatter.title} - Blog | Peritissimus</title>
    <meta name="description" content="${frontmatter.excerpt}" />
    <meta name="author" content="${frontmatter.author || 'Peritissimus'}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="https://peritissimus.com/blog/${slug}.html" />

    <!-- Theme Color -->
    <meta name="theme-color" content="#0f0f0f" />

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="alternate icon" href="/favicon.ico" />

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&family=Barlow+Semi+Condensed:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/src/styles/main.scss" />
  </head>
  <body>
    <div class="blueprint-grid"></div>
    <canvas id="world" class="world"></canvas>

    <div id="scroll-wrapper" class="scroll-wrapper">
      <div class="info-wrapper">
        <section class="content-section blog-post">
          <div class="section-inner">
            <div class="post-header">
              <div class="post-back">
                <a href="/blog.html">← Back to Blog</a>
              </div>

              <div class="post-meta-header">
                <span class="post-date">[${frontmatter.date}]</span>
                <span class="post-tag">[${frontmatter.category}]</span>
              </div>

              <h1 class="post-title">
                <span class="title-prefix">></span> ${frontmatter.title}
              </h1>

              <div class="post-info">
                <span class="post-author">AUTHOR: ${frontmatter.author || 'Kushal Patankar'}</span>
                <span class="meta-separator">|</span>
                <span class="post-read-time">READ_TIME: ${frontmatter.readTime}</span>
                <span class="meta-separator">|</span>
                <span class="post-topics">TAGS: ${tags}</span>
              </div>
            </div>

            <div class="post-content">
              ${htmlContent}

              <div class="post-footer-nav">
                <a href="/blog.html" class="nav-link">← All Posts</a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <header class="header">
      <div class="logo-wrapper">
        <a href="/" class="logo">peritissimus</a>
      </div>
      <nav class="menu">
        <a href="/blog.html" class="menu-item">Blog</a>
        <span class="menu-separator">//</span>
        <a href="/about.html" class="menu-item">About</a>
        <span class="menu-separator">//</span>
        <a href="/contact.html" class="menu-item">Contact</a>
      </nav>
    </header>

    <footer class="footer">
      <div class="footer-copy">PERITISSIMUS © 2025</div>
      <div class="footer-coords">LAT: 0.000° / LONG: 0.000°</div>
      <div class="mode-toggle">
        <a href="/" class="mode-btn">
          <span class="mode-indicator"></span>
          <span class="mode-label">HUMAN</span>
        </a>
        <a href="/ai.html" class="mode-btn">
          <span class="mode-indicator"></span>
          <span class="mode-label">MACHINE</span>
        </a>
      </div>
    </footer>

    <script type="module" src="/src/js/main.js"></script>
  </body>
</html>
`;

  return html;
}

/**
 * Update blog index with all posts
 */
function updateBlogIndex(posts) {
  const blogCardsHtml = posts
    .map(
      (post) => `
              <!-- Blog Post -->
              <article class="blog-card">
                <a href="/blog/${post.slug}.html" class="blog-card-link">
                  <div class="blog-card-header">
                    <span class="blog-date">[${post.date}]</span>
                    <span class="blog-tag">[${post.category}]</span>
                  </div>
                  <h3 class="blog-title">
                    > ${post.title}
                  </h3>
                  <p class="blog-excerpt">
                    ${post.excerpt}
                  </p>
                  <div class="blog-meta">
                    <span class="read-time">${post.readTime}</span>
                    <span class="meta-separator">|</span>
                    <span class="blog-topics">${Array.isArray(post.tags) ? post.tags.join(', ') : post.tags}</span>
                  </div>
                </a>
              </article>
`,
    )
    .join('\n');

  // Read current blog.html
  let blogIndexContent = fs.readFileSync(BLOG_INDEX_PATH, 'utf-8');

  // Update entry count
  blogIndexContent = blogIndexContent.replace(/(\d+) ENTRIES/, `${posts.length} ENTRIES`);

  // Replace blog grid content
  const blogGridRegex = /<div class="blog-grid">([\s\S]*?)<\/div>\s*<div class="blog-footer">/;
  blogIndexContent = blogIndexContent.replace(
    blogGridRegex,
    `<div class="blog-grid">${blogCardsHtml}
            </div>

            <div class="blog-footer">`,
  );

  fs.writeFileSync(BLOG_INDEX_PATH, blogIndexContent, 'utf-8');
  console.log('✓ Updated blog index');
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node generate-blog.js <markdown-file.md> | --all');
    process.exit(1);
  }

  // Ensure directories exist
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  if (args[0] === '--all') {
    // Process all markdown files (exclude README.md)
    const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md') && f !== 'README.md');

    if (files.length === 0) {
      console.log('No markdown files found in blog/posts/');
      return;
    }

    const posts = [];

    files.forEach((file) => {
      const mdPath = path.join(POSTS_DIR, file);
      const mdContent = fs.readFileSync(mdPath, 'utf-8');

      const { frontmatter } = parseMarkdown(mdContent);
      const slug = frontmatter.slug || file.replace('.md', '');

      const htmlContent = generateBlogPost(mdContent, file);
      const outputPath = path.join(BLOG_OUTPUT_DIR, `${slug}.html`);

      fs.writeFileSync(outputPath, htmlContent, 'utf-8');
      console.log(`✓ Generated: ${slug}.html`);

      posts.push({
        ...frontmatter,
        slug,
      });
    });

    // Sort posts by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Clean up orphaned HTML files (files without corresponding markdown)
    const existingHtmlFiles = fs.readdirSync(BLOG_OUTPUT_DIR).filter((f) => f.endsWith('.html'));
    const validSlugs = new Set(posts.map((p) => `${p.slug}.html`));

    existingHtmlFiles.forEach((htmlFile) => {
      if (!validSlugs.has(htmlFile)) {
        const htmlPath = path.join(BLOG_OUTPUT_DIR, htmlFile);
        fs.unlinkSync(htmlPath);
        console.log(`✓ Removed orphaned: ${htmlFile}`);
      }
    });

    // Update blog index
    updateBlogIndex(posts);

    console.log(`\n✓ Successfully generated ${posts.length} blog post(s)`);
  } else {
    // Process single file
    const filename = args[0];
    const mdPath = path.join(POSTS_DIR, filename);

    if (!fs.existsSync(mdPath)) {
      console.error(`Error: File not found: ${mdPath}`);
      process.exit(1);
    }

    const mdContent = fs.readFileSync(mdPath, 'utf-8');
    const { frontmatter } = parseMarkdown(mdContent);
    const slug = frontmatter.slug || filename.replace('.md', '');

    const htmlContent = generateBlogPost(mdContent, filename);
    const outputPath = path.join(BLOG_OUTPUT_DIR, `${slug}.html`);

    fs.writeFileSync(outputPath, htmlContent, 'utf-8');
    console.log(`✓ Generated: ${slug}.html`);

    // Regenerate index with all posts
    const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md') && f !== 'README.md');
    const posts = files.map((file) => {
      const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
      const { frontmatter } = parseMarkdown(content);
      return {
        ...frontmatter,
        slug: frontmatter.slug || file.replace('.md', ''),
      };
    });

    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    updateBlogIndex(posts);
  }
}

main();
