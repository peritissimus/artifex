/**
 * TOON Converter - Main application logic
 * Handles UI interactions and format conversions
 */

import { encode, decode } from '@toon-format/toon'
import { parseCSV } from './csv-parser.js'
import { parseXML, parseYAML } from './parsers.js'
import { calculateSavings, estimateTokensAccurate } from './token-counter.js'

// Sample data for demonstration
const SAMPLE_DATA = {
  json: JSON.stringify(
    {
      users: [
        { id: 1, name: 'Alice Johnson', role: 'admin', active: true, salary: 95000 },
        { id: 2, name: 'Bob Smith', role: 'developer', active: true, salary: 85000 },
        { id: 3, name: 'Carol White', role: 'developer', active: false, salary: 80000 },
        { id: 4, name: 'David Brown', role: 'designer', active: true, salary: 75000 },
      ],
      metadata: {
        generatedAt: '2025-01-15T10:30:00Z',
        version: '1.0',
        recordCount: 4,
      },
    },
    null,
    2
  ),

  csv: `id,name,role,active,salary
1,Alice Johnson,admin,true,95000
2,Bob Smith,developer,true,85000
3,Carol White,developer,false,80000
4,David Brown,designer,true,75000`,

  yaml: `users:
  - id: 1
    name: Alice Johnson
    role: admin
    active: true
    salary: 95000
  - id: 2
    name: Bob Smith
    role: developer
    active: true
    salary: 85000
  - id: 3
    name: Carol White
    role: developer
    active: false
    salary: 80000
  - id: 4
    name: David Brown
    role: designer
    active: true
    salary: 75000`,

  xml: `<?xml version="1.0"?>
<users>
  <user>
    <id>1</id>
    <name>Alice Johnson</name>
    <role>admin</role>
    <active>true</active>
    <salary>95000</salary>
  </user>
  <user>
    <id>2</id>
    <name>Bob Smith</name>
    <role>developer</role>
    <active>true</active>
    <salary>85000</salary>
  </user>
  <user>
    <id>3</id>
    <name>Carol White</name>
    <role>developer</role>
    <active>false</active>
    <salary>80000</salary>
  </user>
  <user>
    <id>4</id>
    <name>David Brown</name>
    <role>designer</role>
    <active>true</active>
    <salary>75000</salary>
  </user>
</users>`,

  toon: `users[4]{id,name,role,active,salary}:
  1,Alice Johnson,admin,true,95000
  2,Bob Smith,developer,true,85000
  3,Carol White,developer,false,80000
  4,David Brown,designer,true,75000`,
}

class ConverterApp {
  constructor() {
    this.inputText = document.getElementById('input-text')
    this.outputText = document.getElementById('output-text')
    this.inputFormat = document.getElementById('input-format')
    this.convertBtn = document.getElementById('convert-btn')
    this.reverseBtn = document.getElementById('reverse-btn')
    this.errorMessage = document.getElementById('error-message')
    this.outputStats = document.getElementById('output-stats')

    // Options
    this.delimiter = document.getElementById('delimiter')
    this.indent = document.getElementById('indent')
    this.keyFolding = document.getElementById('key-folding')
    this.showStats = document.getElementById('show-stats')
    this.strictMode = document.getElementById('strict-mode')

    // Controls
    this.loadSampleBtn = document.getElementById('load-sample')
    this.clearInputBtn = document.getElementById('clear-input')
    this.fileInput = document.getElementById('file-input')
    this.copyOutputBtn = document.getElementById('copy-output')
    this.downloadOutputBtn = document.getElementById('download-output')

    // Stats
    this.inputSize = document.getElementById('input-size')
    this.inputLines = document.getElementById('input-lines')
    this.toonTokens = document.getElementById('toon-tokens')
    this.jsonTokens = document.getElementById('json-tokens')
    this.tokenSavings = document.getElementById('token-savings')

    this.initEventListeners()
    this.updateInputStats()
  }

  initEventListeners() {
    // Main actions
    this.convertBtn.addEventListener('click', () => this.convert())
    this.reverseBtn.addEventListener('click', () => this.reverse())

    // Input controls
    this.loadSampleBtn.addEventListener('click', () => this.loadSample())
    this.clearInputBtn.addEventListener('click', () => this.clearInput())
    this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e))

    // Output controls
    this.copyOutputBtn.addEventListener('click', () => this.copyOutput())
    this.downloadOutputBtn.addEventListener('click', () => this.downloadOutput())

    // Input tracking
    this.inputText.addEventListener('input', () => this.updateInputStats())

    // Format change
    this.inputFormat.addEventListener('change', () => this.onFormatChange())

    // Options change
    this.showStats.addEventListener('change', () => this.toggleStats())

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Enter') {
          e.preventDefault()
          this.convert()
        }
      }
    })
  }

  onFormatChange() {
    // Update reverse button visibility
    const isToon = this.inputFormat.value === 'toon'
    this.reverseBtn.style.display = isToon ? 'block' : 'none'
    this.convertBtn.textContent = isToon ? 'Convert to JSON' : 'Convert to TOON'
  }

  loadSample() {
    const format = this.inputFormat.value
    this.inputText.value = SAMPLE_DATA[format] || SAMPLE_DATA.json
    this.updateInputStats()
    this.hideError()
  }

  clearInput() {
    this.inputText.value = ''
    this.outputText.textContent = ''
    this.updateInputStats()
    this.hideError()
  }

  async handleFileUpload(event) {
    const file = event.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      this.inputText.value = text

      // Auto-detect format from file extension
      const ext = file.name.split('.').pop().toLowerCase()
      const formatMap = {
        json: 'json',
        csv: 'csv',
        yaml: 'yaml',
        yml: 'yaml',
        xml: 'xml',
        toon: 'toon',
      }

      if (formatMap[ext]) {
        this.inputFormat.value = formatMap[ext]
        this.onFormatChange()
      }

      this.updateInputStats()
      this.hideError()
    } catch (error) {
      this.showError('Error reading file: ' + error.message)
    }
  }

  updateInputStats() {
    const text = this.inputText.value
    const chars = text.length
    const lines = text ? text.split('\n').length : 0

    this.inputSize.textContent = `${chars.toLocaleString()} characters`
    this.inputLines.textContent = `${lines.toLocaleString()} lines`
  }

  convert() {
    const inputText = this.inputText.value.trim()
    if (!inputText) {
      this.showError('Please enter some data to convert')
      return
    }

    try {
      const format = this.inputFormat.value
      let data

      // Parse input based on format
      switch (format) {
        case 'json':
          data = JSON.parse(inputText)
          break

        case 'csv':
          data = parseCSV(inputText)
          break

        case 'yaml':
          data = parseYAML(inputText)
          break

        case 'xml':
          data = parseXML(inputText)
          break

        case 'toon':
          // For TOON input, decode to JSON first
          data = decode(inputText, {
            strict: this.strictMode.checked,
            indent: parseInt(this.indent.value) || 2,
          })
          break

        default:
          throw new Error('Unsupported format: ' + format)
      }

      // Get conversion options
      const options = {
        indent: parseInt(this.indent.value) || 2,
        delimiter: this.delimiter.value === '\\t' ? '\t' : this.delimiter.value,
        keyFolding: this.keyFolding.value,
      }

      // Convert to TOON
      const toonOutput = encode(data, options)
      this.outputText.textContent = toonOutput

      // Update statistics
      if (this.showStats.checked) {
        this.updateTokenStats(inputText, toonOutput)
      }

      this.hideError()
    } catch (error) {
      this.showError('Conversion error: ' + error.message)
      console.error('Conversion error:', error)
    }
  }

  reverse() {
    const inputText = this.inputText.value.trim()
    if (!inputText) {
      this.showError('Please enter TOON data to convert')
      return
    }

    try {
      const options = {
        strict: this.strictMode.checked,
        indent: parseInt(this.indent.value) || 2,
        expandPaths: this.keyFolding.value,
      }

      // Decode TOON to JSON
      const data = decode(inputText, options)
      const jsonOutput = JSON.stringify(data, null, 2)
      this.outputText.textContent = jsonOutput

      // Update statistics
      if (this.showStats.checked) {
        const stats = calculateSavings(jsonOutput, inputText)
        this.toonTokens.textContent = stats.converted.toLocaleString()
        this.jsonTokens.textContent = stats.original.toLocaleString()
        this.tokenSavings.textContent = `${stats.saved.toLocaleString()} tokens (${stats.percentage}%)`
        this.tokenSavings.className =
          'stats-value ' + (stats.percentage > 0 ? 'savings' : 'increase')
        this.outputStats.style.display = 'block'
      }

      this.hideError()
    } catch (error) {
      this.showError('Decoding error: ' + error.message)
      console.error('Decoding error:', error)
    }
  }

  updateTokenStats(originalText, toonText) {
    // For non-JSON formats, first convert to JSON for fair comparison
    let jsonText = originalText

    if (this.inputFormat.value !== 'json') {
      try {
        const data = this.parseInput(originalText, this.inputFormat.value)
        jsonText = JSON.stringify(data, null, 2)
      } catch {
        // If conversion fails, use original text
        jsonText = originalText
      }
    }

    const stats = calculateSavings(jsonText, toonText)

    this.toonTokens.textContent = stats.converted.toLocaleString()
    this.jsonTokens.textContent = stats.original.toLocaleString()

    const savingsText =
      stats.saved > 0
        ? `${stats.saved.toLocaleString()} tokens saved (${stats.percentage}%)`
        : `${Math.abs(stats.saved).toLocaleString()} tokens more (${Math.abs(stats.percentage)}%)`

    this.tokenSavings.textContent = savingsText
    this.tokenSavings.className = 'stats-value ' + (stats.percentage > 0 ? 'savings' : 'increase')

    this.outputStats.style.display = 'block'
  }

  parseInput(text, format) {
    switch (format) {
      case 'json':
        return JSON.parse(text)
      case 'csv':
        return parseCSV(text)
      case 'yaml':
        return parseYAML(text)
      case 'xml':
        return parseXML(text)
      case 'toon':
        return decode(text)
      default:
        throw new Error('Unsupported format')
    }
  }

  toggleStats() {
    if (this.showStats.checked && this.outputText.textContent) {
      this.outputStats.style.display = 'block'
    } else {
      this.outputStats.style.display = 'none'
    }
  }

  async copyOutput() {
    const text = this.outputText.textContent
    if (!text) {
      this.showError('Nothing to copy')
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      this.showSuccess('Copied to clipboard!')
    } catch (error) {
      this.showError('Failed to copy: ' + error.message)
    }
  }

  downloadOutput() {
    const text = this.outputText.textContent
    if (!text) {
      this.showError('Nothing to download')
      return
    }

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'output.toon'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  showError(message) {
    this.errorMessage.textContent = message
    this.errorMessage.style.display = 'block'
    this.errorMessage.className = 'error-message'
  }

  showSuccess(message) {
    this.errorMessage.textContent = message
    this.errorMessage.style.display = 'block'
    this.errorMessage.className = 'success-message'

    setTimeout(() => {
      this.hideError()
    }, 2000)
  }

  hideError() {
    this.errorMessage.style.display = 'none'
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ConverterApp())
} else {
  new ConverterApp()
}
