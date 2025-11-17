/**
 * High-performance CSV parser for browser environments
 * Handles quoted fields, escaped quotes, and different delimiters
 */

export class CSVParser {
  constructor(options = {}) {
    this.delimiter = options.delimiter || ','
    this.quote = options.quote || '"'
    this.escape = options.escape || '"'
    this.hasHeaders = options.hasHeaders !== false
    this.skipEmptyLines = options.skipEmptyLines !== false
  }

  /**
   * Parse CSV string to array of objects
   * @param {string} csvString - Raw CSV content
   * @returns {Array<Object>} Parsed data as array of objects
   */
  parse(csvString) {
    const lines = this.parseLines(csvString)

    if (lines.length === 0) {
      return []
    }

    if (this.hasHeaders) {
      const headers = lines[0]
      const data = lines.slice(1)

      return data.map((row) => {
        const obj = {}
        headers.forEach((header, index) => {
          obj[header] = this.parseValue(row[index] ?? '')
        })
        return obj
      })
    }

    // No headers - return array of arrays
    return lines.map((row) => row.map((value) => this.parseValue(value)))
  }

  /**
   * Parse CSV into array of arrays (rows)
   * @param {string} csvString - Raw CSV content
   * @returns {Array<Array<string>>} Parsed rows
   */
  parseLines(csvString) {
    const rows = []
    let currentRow = []
    let currentField = ''
    let inQuotes = false
    let i = 0

    while (i < csvString.length) {
      const char = csvString[i]
      const nextChar = csvString[i + 1]

      if (char === this.quote) {
        if (inQuotes && nextChar === this.escape) {
          // Escaped quote
          currentField += this.quote
          i += 2
          continue
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
          i++
          continue
        }
      }

      if (!inQuotes) {
        if (char === this.delimiter) {
          // End of field
          currentRow.push(currentField)
          currentField = ''
          i++
          continue
        }

        if (char === '\n' || (char === '\r' && nextChar === '\n')) {
          // End of row
          currentRow.push(currentField)

          if (!this.skipEmptyLines || currentRow.some((field) => field.trim() !== '')) {
            rows.push(currentRow)
          }

          currentRow = []
          currentField = ''
          i += char === '\r' ? 2 : 1
          continue
        }
      }

      currentField += char
      i++
    }

    // Handle last field and row
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField)
      if (!this.skipEmptyLines || currentRow.some((field) => field.trim() !== '')) {
        rows.push(currentRow)
      }
    }

    return rows
  }

  /**
   * Parse individual value to appropriate JavaScript type
   * @param {string} value - Field value
   * @returns {string|number|boolean|null} Parsed value
   */
  parseValue(value) {
    const trimmed = value.trim()

    // Empty string
    if (trimmed === '') {
      return ''
    }

    // Boolean
    if (trimmed.toLowerCase() === 'true') return true
    if (trimmed.toLowerCase() === 'false') return false

    // Null
    if (trimmed.toLowerCase() === 'null') return null

    // Number (including negative and decimals)
    if (/^-?\d+\.?\d*$/.test(trimmed)) {
      const num = Number(trimmed)
      if (!isNaN(num)) {
        return num
      }
    }

    // String
    return value
  }
}

/**
 * Quick CSV parse function
 * @param {string} csvString - CSV content
 * @param {Object} options - Parser options
 * @returns {Array<Object>} Parsed data
 */
export function parseCSV(csvString, options = {}) {
  const parser = new CSVParser(options)
  return parser.parse(csvString)
}
