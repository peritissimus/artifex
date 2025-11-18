#!/usr/bin/env node

/**
 * AI Pages Generator
 * Creates AI versions of all HTML pages in the ai/ directory
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const AI_DIR = path.join(ROOT_DIR, 'ai');

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
 * Extract text content from HTML elements
 */
function extractTextContent(html) {
  // Remove script and style tags
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Extract title
  const titleMatch = text.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1].replace(' - Artifex | Peritissimus', '') : '';

  // Remove HTML tags but preserve structure with newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#039;/g, "'");

  // Clean up whitespace
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n'); // Remove multiple blank lines
  text = text.replace(/^\s+|\s+$/gm, ''); // Trim lines

  return { title, content: text.trim() };
}

/**
 * Transform HTML content to machine-readable format
 */
function transformToAiMode(htmlContent, originalPath) {
  const { title, content } = extractTextContent(htmlContent);

  // Determine human URL
  let humanUrl = '/';
  if (originalPath !== 'index.html') {
    humanUrl = `/${originalPath}`;
  }

  // Create simple, machine-readable HTML
  const aiHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <title>${title} - Machine Readable</title>
  <style>
    body {
      font-family: monospace;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
      background: #000;
      color: #0f0;
    }
    a {
      color: #0ff;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .header {
      border-bottom: 1px solid #0f0;
      padding-bottom: 20px;
      margin-bottom: 40px;
    }
    .content {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #0f0;
      font-size: 0.9em;
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

  <div class="content">
${content}
  </div>

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
  const blogDir = path.join(ROOT_DIR, 'blog');
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
  const workDir = path.join(ROOT_DIR, 'work');
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
    const sourcePath = path.join(ROOT_DIR, page);
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
