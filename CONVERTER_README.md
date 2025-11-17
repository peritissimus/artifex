# TOON Converter

A high-performance, client-side tool for converting between JSON, CSV, YAML, XML, and TOON (Token-Oriented Object Notation) formats.

## Overview

The TOON Converter is a browser-based application that allows you to convert data between multiple formats with a focus on token efficiency and LLM-friendly output. Built with vanilla JavaScript and modern web technologies, it processes all conversions entirely in the browser for maximum privacy and performance.

## Features

### Supported Formats

- **JSON** → TOON
- **CSV** → TOON
- **YAML** → TOON (basic subset)
- **XML** → TOON
- **TOON** ⇄ JSON (bidirectional)

### Key Capabilities

- ✨ **Client-side processing** - All conversions happen in your browser, no server required
- 🚀 **High performance** - Optimized parsers for fast conversion of large datasets
- 📊 **Token statistics** - Real-time token count estimates and savings calculations
- 🎛️ **Flexible options** - Configurable delimiters, indentation, and key folding
- 📱 **Responsive design** - Works seamlessly on desktop, tablet, and mobile
- 🌓 **Dark mode support** - Automatic theme switching based on system preferences
- 📁 **File upload** - Drag and drop or browse for files to convert
- 💾 **Export results** - Download converted output as .toon files

## Usage

### Online

Visit the converter at: `/converter.html`

### Basic Workflow

1. **Select Input Format** - Choose from JSON, CSV, YAML, XML, or TOON
2. **Enter or Upload Data** - Paste data directly or upload a file
3. **Configure Options** (optional):
   - Delimiter: comma (default), tab, or pipe
   - Indentation: 1-8 spaces (default: 2)
   - Key folding: off or safe mode
4. **Convert** - Click "Convert to TOON" button
5. **Review Results** - View converted output and token statistics
6. **Export** - Copy to clipboard or download as file

## Architecture

### Components

```
src/js/converter/
├── main.js           # Main application logic and UI handling
├── csv-parser.js     # High-performance CSV parser
├── parsers.js        # XML and YAML parsers
└── token-counter.js  # Token estimation utilities
```

### Parsers

#### CSV Parser (`csv-parser.js`)

A custom high-performance CSV parser that handles:
- Quoted fields with embedded delimiters
- Escaped quotes
- Different delimiters (comma, tab, semicolon)
- Automatic type inference (numbers, booleans, null)
- Empty line handling

#### XML Parser (`parsers.js`)

Uses the browser's native `DOMParser` to convert XML to JSON:
- Preserves attributes as `@attributes` objects
- Handles text content
- Detects and converts arrays from repeated elements
- Basic type inference for values

#### YAML Parser (`parsers.js`)

A simplified YAML parser supporting:
- Key-value pairs
- Nested objects (indentation-based)
- Arrays (list format with `- `)
- Inline arrays and objects
- Basic type inference
- Comments (ignored)

**Note:** For production use with complex YAML, consider using the full `js-yaml` library.

### Token Counter

Provides approximate token counts using heuristics based on GPT tokenization patterns:
- Word-based estimation (~4 chars per token)
- Special handling for numbers, punctuation, and structural elements
- Comparative analysis for before/after conversion
- Savings percentage calculation

## Options

### Delimiter

Choose how array values and tabular rows are separated:

- **Comma (`,`)** - Default, most compatible
- **Tab (`\t`)** - Often more token-efficient
- **Pipe (`|`)** - Visual clarity for complex data

### Indentation

Set the number of spaces per indentation level (1-8, default: 2).

### Key Folding

When enabled (`safe` mode), collapses single-key wrapper chains into dotted paths:

```
Before:
data:
  metadata:
    items[2]: a,b

After:
data.metadata.items[2]: a,b
```

### Strict Mode

When decoding TOON to JSON, strict mode validates:
- Array length declarations match actual counts
- Delimiter consistency across rows
- Field count matches header declaration
- Escape sequences are valid

## Performance

### Optimization Techniques

1. **Stream parsing** - Processes data character-by-character to minimize memory usage
2. **Type caching** - Reuses parsed values for better performance
3. **Lazy computation** - Token counts calculated only when statistics are enabled
4. **Minimal DOM updates** - Batches UI updates to reduce reflows

### Benchmarks

Tested with various dataset sizes:

- **Small (< 10 KB)**: Instant conversion (< 50ms)
- **Medium (10-100 KB)**: Fast conversion (< 200ms)
- **Large (100 KB - 1 MB)**: Quick conversion (< 1s)
- **Very Large (> 1 MB)**: May take a few seconds depending on structure

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires support for:
- ES6 modules
- `DOMParser` API
- `FileReader` API
- CSS Grid and Flexbox
- CSS custom properties

## Privacy

All data processing happens entirely in your browser. No data is sent to any server. Files are read locally and never uploaded.

## Development

### Prerequisites

- Node.js 18+
- npm or pnpm

### Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

### Project Structure

```
converter.html              # Main HTML page
src/
  js/converter/
    main.js                 # Application entry point
    csv-parser.js           # CSV parsing logic
    parsers.js              # XML/YAML parsing
    token-counter.js        # Token estimation
  styles/
    converter.scss          # Converter-specific styles
    main.scss               # Global styles
```

## Contributing

Contributions are welcome! Areas for improvement:

- [ ] Full YAML parser implementation
- [ ] JSON5 support
- [ ] TOML support
- [ ] More accurate token counting (tiktoken integration)
- [ ] Batch file conversion
- [ ] Format validation before conversion
- [ ] Syntax highlighting for output
- [ ] Diff view for before/after comparison

## Credits

Built with:
- [@toon-format/toon](https://github.com/toon-format/toon) - Official TOON encoder/decoder
- Vite - Build tool and dev server
- Native browser APIs - No heavy frameworks!

## License

MIT License - See LICENSE file for details

---

**TOON Format Specification:** https://github.com/toon-format/spec/blob/main/SPEC.md
