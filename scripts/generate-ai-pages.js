#!/usr/bin/env node

/**
 * AI Pages Generator
 * Creates AI versions of all HTML pages in the ai/ directory
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const SRC_PAGES_DIR = path.join(ROOT_DIR, 'src/pages');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const AI_DIR = path.join(DIST_DIR, 'ai');

// Pages to generate AI versions for
const PAGES = ['index.html', 'blog.html', 'about.html', 'contact.html'];

// Directories that might contain HTML files
const SUBDIRS = ['work', 'blog'];

/**
 * Ensure AI directory structure exists
 */
function ensureAiDirectories() {
  if (!fs.existsSync(AI_DIR)) {
    fs.mkdirSync(AI_DIR, { recursive: true });
  }

  SUBDIRS.forEach((subdir) => {
    const aiSubdir = path.join(AI_DIR, subdir);
    if (!fs.existsSync(aiSubdir)) {
      fs.mkdirSync(aiSubdir, { recursive: true });
    }
  });
}

/**
 * Extract and structure content from HTML using Mozilla Readability
 */
function extractTextContent(html) {
  // Parse HTML with linkedom
  const { document } = parseHTML(html);

  // Extract title
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1].replace(' - Artifex | Peritissimus', '').replace(' | Peritissimus', '') : '';

  // Use Readability to extract main content
  const reader = new Readability(document);
  const article = reader.parse();

  if (!article) {
    // Fallback: extract main or content section
    const main = document.querySelector('main, .content-section, .info-wrapper');
    return {
      title,
      htmlContent: main ? main.innerHTML : document.body.innerHTML,
    };
  }

  // Return the HTML content directly from Readability (it preserves structure)
  return {
    title,
    htmlContent: article.content
  };
}

/**
 * Transform HTML content to machine-readable format
 */
function transformToAiMode(htmlContent, originalPath) {
  const { title, htmlContent: content } = extractTextContent(htmlContent);

  // Determine human URL
  let humanUrl = '/';
  if (originalPath !== 'index.html') {
    humanUrl = `/${originalPath}`;
  }

  // Create simple, machine-readable HTML with semantic structure
  const aiHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <title>${title} - Machine Readable</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.7;
      background: #ffffff;
      color: #333333;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 600;
      line-height: 1.3;
    }
    h1 { font-size: 2em; border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }
    p { margin: 1em 0; }
    ul, ol { margin: 1em 0; padding-left: 2em; }
    li { margin: 0.5em 0; }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .header {
      border-bottom: 2px solid #eee;
      padding-bottom: 20px;
      margin-bottom: 40px;
    }
    .header h1 {
      margin: 0;
      border: none;
      font-size: 2.5em;
    }
    .header nav {
      margin-top: 1em;
      font-size: 0.9em;
    }
    .content {
      font-size: 16px;
    }
    .content img {
      max-width: 100%;
      height: auto;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #eee;
      font-size: 0.9em;
      color: #666;
    }
    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    pre {
      background: #f5f5f5;
      padding: 1em;
      border-radius: 5px;
      overflow-x: auto;
    }
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 1em;
      margin-left: 0;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <nav>
      <a href="/ai/">Home</a> |
      <a href="/ai/blog.html">Blog</a> |
      <a href="/ai/about.html">About</a> |
      <a href="/ai/contact.html">Contact</a>
    </nav>
  </div>

  <article class="content">
${content}
  </article>

  <div class="footer">
    <p><a href="${humanUrl}">← Switch to Human Mode</a></p>
    <p>Machine-readable version | Peritissimus © 2025</p>
  </div>
</body>
</html>`;

  return aiHtml;
}

/**
 * Generate AI version of a single page
 */
function generateAiPage(pagePath, outputPath, relativePath = null) {
  const htmlContent = fs.readFileSync(pagePath, 'utf-8');
  const fileName = relativePath || path.basename(pagePath);
  const transformedContent = transformToAiMode(htmlContent, fileName);

  fs.writeFileSync(outputPath, transformedContent, 'utf-8');
  console.log(`✓ Generated: ${outputPath.replace(ROOT_DIR, '')}`);
}

/**
 * Generate AI versions of blog posts
 */
function generateAiBlogPosts() {
  const blogDir = path.join(SRC_PAGES_DIR, 'blog');
  const aiBlogDir = path.join(AI_DIR, 'blog');

  if (!fs.existsSync(blogDir)) {
    return;
  }

  const blogFiles = fs.readdirSync(blogDir).filter((f) => f.endsWith('.html'));

  blogFiles.forEach((file) => {
    const sourcePath = path.join(blogDir, file);
    const destPath = path.join(aiBlogDir, file);
    const relativePath = `blog/${file}`;
    generateAiPage(sourcePath, destPath, relativePath);
  });
}

/**
 * Generate AI versions of work pages
 */
function generateAiWorkPages() {
  const workDir = path.join(SRC_PAGES_DIR, 'work');
  const aiWorkDir = path.join(AI_DIR, 'work');

  if (!fs.existsSync(workDir)) {
    return;
  }

  const workFiles = fs.readdirSync(workDir).filter((f) => f.endsWith('.html'));

  workFiles.forEach((file) => {
    const sourcePath = path.join(workDir, file);
    const destPath = path.join(aiWorkDir, file);
    const relativePath = `work/${file}`;
    generateAiPage(sourcePath, destPath, relativePath);
  });
}

/**
 * Main function
 */
function main() {
  console.log('🤖 Generating AI mode pages...\n');

  // Ensure directories exist
  ensureAiDirectories();

  // Generate main pages
  PAGES.forEach((page) => {
    const sourcePath = path.join(SRC_PAGES_DIR, page);
    const destPath = path.join(AI_DIR, page);

    if (fs.existsSync(sourcePath)) {
      generateAiPage(sourcePath, destPath);
    } else {
      console.warn(`⚠ Warning: ${page} not found, skipping...`);
    }
  });

  // Generate blog posts
  generateAiBlogPosts();

  // Generate work pages
  generateAiWorkPages();

  console.log('\n✓ AI mode pages generated successfully!');
  console.log('\nAI pages are now available at:');
  console.log('  /ai/index.html');
  console.log('  /ai/blog.html');
  console.log('  /ai/about.html');
  console.log('  /ai/contact.html');
  console.log('  /ai/blog/*.html');
  console.log('  /ai/work/*.html');
}

main();
