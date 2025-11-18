#!/usr/bin/env node

/**
 * Sitemap Generator
 * Generates sitemap.xml from all HTML files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const BASE_URL = 'https://peritissimus.com';

// Get current date in ISO format
const currentDate = new Date().toISOString().split('T')[0];

/**
 * Get all HTML files recursively
 */
function getHtmlFiles(dir, baseDir = dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip dist, node_modules, and hidden directories
      if (entry.name === 'dist' || entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }
      files = files.concat(getHtmlFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      const relativePath = path.relative(baseDir, fullPath);
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * Determine priority based on URL
 */
function getPriority(url) {
  if (url === '/') return '1.0';
  if (url.startsWith('/blog/')) return '0.8';
  if (url === '/blog.html') return '0.9';
  if (url === '/about.html' || url === '/contact.html') return '0.7';
  if (url.startsWith('/work/')) return '0.6';
  if (url.startsWith('/ai/')) return '0.5';
  return '0.5';
}

/**
 * Determine change frequency based on URL
 */
function getChangeFreq(url) {
  if (url === '/') return 'weekly';
  if (url.startsWith('/blog/') || url === '/blog.html') return 'weekly';
  if (url === '/about.html' || url === '/contact.html') return 'monthly';
  if (url.startsWith('/work/')) return 'monthly';
  if (url.startsWith('/ai/')) return 'weekly';
  return 'monthly';
}

/**
 * Generate sitemap XML
 */
function generateSitemap() {
  console.log('🗺️  Generating sitemap...\n');

  const htmlFiles = getHtmlFiles(DIST_DIR);

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  const urls = [];

  htmlFiles.forEach((file) => {
    // Convert file path to URL
    let url = '/' + file.replace(/\\/g, '/');

    // Handle index.html
    if (url.endsWith('/index.html')) {
      url = url.replace('/index.html', '/');
    } else if (url === '/index.html') {
      url = '/';
    }

    const priority = getPriority(url);
    const changefreq = getChangeFreq(url);

    urls.push({
      loc: `${BASE_URL}${url}`,
      lastmod: currentDate,
      changefreq,
      priority,
    });
  });

  // Sort URLs by priority (highest first)
  urls.sort((a, b) => parseFloat(b.priority) - parseFloat(a.priority));

  // Generate XML for each URL
  urls.forEach(({ loc, lastmod, changefreq, priority }) => {
    xml += '  <url>\n';
    xml += `    <loc>${loc}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>';

  // Write sitemap
  const sitemapPath = path.join(ROOT_DIR, 'dist', 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml, 'utf-8');

  console.log(`✓ Generated sitemap with ${urls.length} URLs`);
  console.log(`✓ Saved to: dist/sitemap.xml\n`);

  // Display first few entries
  console.log('Top URLs:');
  urls.slice(0, 10).forEach(({ loc, priority }) => {
    console.log(`  ${loc} (${priority})`);
  });
}

generateSitemap();
