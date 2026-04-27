/**
 * Custom remark/rehype plugins to transform blog post HTML
 * Matches the original blog styling with:
 * - [BRACKETS] around h2 headings
 * - .post-section wrappers around each section
 * - .code-block with .code-header for code blocks
 * - .post-list and .post-numbered-list for lists
 */

import { visit } from 'unist-util-visit';
import { h } from 'hastscript';

// Store language info from markdown before Shiki processes it
const codeLangs = new Map();

const ACRONYMS = new Set([
  'AI',
  'API',
  'APIS',
  'AWS',
  'B2B',
  'B2C',
  'D7',
  'LLM',
  'LLMS',
  'UI',
  'UX',
]);

function humanizeHeading(text) {
  const cleaned = text.trim().replace(/^\[(.*)\]$/, '$1');
  if (cleaned !== cleaned.toUpperCase()) {
    return cleaned;
  }

  return cleaned
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      const plain = word.replace(/[^a-z0-9]/gi, '').toUpperCase();
      if (ACRONYMS.has(plain)) {
        return word.replace(/[a-z0-9]+/i, plain);
      }

      return word.replace(/[a-z]/i, (letter) => letter.toUpperCase());
    })
    .join(' ');
}

/**
 * Remark plugin to capture code block languages before Shiki processes them
 */
export function remarkCaptureCodeLang() {
  return (tree) => {
    let codeIndex = 0;
    visit(tree, 'code', (node) => {
      if (node.lang) {
        codeLangs.set(codeIndex, node.lang.toUpperCase());
      }
      codeIndex++;
    });
  };
}

/**
 * Rehype plugin to transform the HTML output
 */
export function rehypeBlogTransform() {
  return (tree) => {
    // Normalize markdown headings for the human-facing article layout.
    visit(tree, 'element', (node) => {
      if (node.tagName === 'h2') {
        const textNode = node.children.find((child) => child.type === 'text');
        if (textNode) {
          textNode.value = humanizeHeading(textNode.value);
        }
      }
    });

    // Transform ul to have .post-list class
    visit(tree, 'element', (node) => {
      if (node.tagName === 'ul') {
        node.properties = node.properties || {};
        node.properties.className = ['post-list'];
      }
    });

    // Transform ol to have .post-numbered-list class
    visit(tree, 'element', (node) => {
      if (node.tagName === 'ol') {
        node.properties = node.properties || {};
        node.properties.className = ['post-numbered-list'];
      }
    });

    // Transform code blocks (pre > code) to custom structure
    let codeIndex = 0;
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'pre' && parent) {
        // Get language - try multiple sources
        let lang = 'CODE';

        // First try: our captured language from remark
        if (codeLangs.has(codeIndex)) {
          lang = codeLangs.get(codeIndex);
        }
        // Second try: data-language attribute (kebab-case in properties)
        else if (node.properties?.['data-language']) {
          lang = node.properties['data-language'].toUpperCase();
        }
        // Third try: dataLanguage (camelCase)
        else if (node.properties?.dataLanguage) {
          lang = node.properties.dataLanguage.toUpperCase();
        }
        // Fourth try: check code element class
        else {
          const codeNode = node.children.find(
            (child) => child.type === 'element' && child.tagName === 'code'
          );
          if (codeNode) {
            const className = codeNode.properties?.className || [];
            const langClass = Array.isArray(className)
              ? className.find((c) => typeof c === 'string' && c.startsWith('language-'))
              : null;
            if (langClass) {
              lang = langClass.replace('language-', '').toUpperCase();
            }
          }
        }

        codeIndex++;

        // Create new structure
        const codeBlock = h('div', { className: ['code-block'] }, [
          h('div', { className: ['code-header'] }, [h('span', { className: ['code-lang'] }, lang)]),
          node,
        ]);

        // Replace pre with code-block wrapper
        parent.children[index] = codeBlock;
      }
    });

    // Clear the language cache for next file
    codeLangs.clear();

    // Wrap sections (h2 + following content until next h2) in .post-section divs
    if (tree.children) {
      const newChildren = [];
      let currentSection = null;

      tree.children.forEach((node) => {
        if (node.type === 'element' && node.tagName === 'h2') {
          // Save previous section if exists
          if (currentSection) {
            newChildren.push(currentSection);
          }
          // Start new section
          currentSection = h('div', { className: ['post-section'] }, [node]);
        } else if (currentSection) {
          // Add to current section
          currentSection.children.push(node);
        } else {
          // No section yet, add directly
          newChildren.push(node);
        }
      });

      // Don't forget last section
      if (currentSection) {
        newChildren.push(currentSection);
      }

      tree.children = newChildren;
    }
  };
}
