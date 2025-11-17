/**
 * Format parsers for XML and YAML
 * Converts various formats to JSON objects for TOON encoding
 */

/**
 * Parse XML to JSON object
 * @param {string} xmlString - XML content
 * @returns {Object} Parsed JSON object
 */
export function parseXML(xmlString) {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml')

  // Check for parsing errors
  const parserError = xmlDoc.querySelector('parsererror')
  if (parserError) {
    throw new Error('XML parsing error: ' + parserError.textContent)
  }

  return xmlToJson(xmlDoc.documentElement)
}

/**
 * Convert XML node to JSON object
 * @param {Element} xml - XML element
 * @returns {Object|string|Array} JSON representation
 */
function xmlToJson(xml) {
  const obj = {}

  // Handle attributes
  if (xml.attributes && xml.attributes.length > 0) {
    obj['@attributes'] = {}
    for (let i = 0; i < xml.attributes.length; i++) {
      const attr = xml.attributes[i]
      obj['@attributes'][attr.nodeName] = attr.nodeValue
    }
  }

  // Handle child nodes
  if (xml.hasChildNodes()) {
    const children = Array.from(xml.childNodes)

    // If only text content, return the text
    if (children.length === 1 && children[0].nodeType === 3) {
      const textContent = children[0].nodeValue.trim()
      if (textContent) {
        return parseXMLValue(textContent)
      }
    }

    for (let i = 0; i < children.length; i++) {
      const child = children[i]

      // Skip text nodes that are just whitespace
      if (child.nodeType === 3) {
        const text = child.nodeValue.trim()
        if (text) {
          obj['#text'] = text
        }
        continue
      }

      // Process element nodes
      if (child.nodeType === 1) {
        const nodeName = child.nodeName
        const childObj = xmlToJson(child)

        // Handle multiple elements with same name (arrays)
        if (obj[nodeName]) {
          if (!Array.isArray(obj[nodeName])) {
            obj[nodeName] = [obj[nodeName]]
          }
          obj[nodeName].push(childObj)
        } else {
          obj[nodeName] = childObj
        }
      }
    }
  }

  // If object only has attributes, simplify
  if (Object.keys(obj).length === 1 && obj['@attributes']) {
    return obj['@attributes']
  }

  return obj
}

/**
 * Parse XML text value to appropriate type
 * @param {string} value - Text value
 * @returns {string|number|boolean|null} Parsed value
 */
function parseXMLValue(value) {
  const trimmed = value.trim()

  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed === 'null') return null

  // Try parsing as number
  if (/^-?\d+\.?\d*$/.test(trimmed)) {
    const num = Number(trimmed)
    if (!isNaN(num)) {
      return num
    }
  }

  return value
}

/**
 * Simple YAML parser (supports basic YAML subset)
 * For production use, consider using js-yaml library
 * @param {string} yamlString - YAML content
 * @returns {Object} Parsed JSON object
 */
export function parseYAML(yamlString) {
  const lines = yamlString.split('\n')
  const stack = [{ indent: -1, value: {} }]
  let current = stack[0].value

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#')) {
      continue
    }

    const indent = line.search(/\S/)
    const trimmed = line.trim()

    // Pop stack to current indent level
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop()
    }
    current = stack[stack.length - 1].value

    // Array item
    if (trimmed.startsWith('- ')) {
      const content = trimmed.substring(2)

      if (!Array.isArray(current)) {
        console.warn('Expected array context for list item')
        continue
      }

      if (content.includes(':')) {
        // Object in array
        const obj = {}
        const [key, ...valueParts] = content.split(':')
        const value = valueParts.join(':').trim()
        obj[key.trim()] = parseYAMLValue(value)
        current.push(obj)
        stack.push({ indent, value: obj })
      } else {
        // Primitive in array
        current.push(parseYAMLValue(content))
      }
      continue
    }

    // Key-value pair
    if (trimmed.includes(':')) {
      const colonIndex = trimmed.indexOf(':')
      const key = trimmed.substring(0, colonIndex).trim()
      const valueStr = trimmed.substring(colonIndex + 1).trim()

      // Remove quotes from keys
      const cleanKey = key.replace(/^['"]|['"]$/g, '')

      if (!valueStr) {
        // Check next line to determine if it's object or array
        const nextLine = lines[i + 1]
        if (nextLine) {
          const nextIndent = nextLine.search(/\S/)
          const nextTrimmed = nextLine.trim()

          if (nextIndent > indent) {
            if (nextTrimmed.startsWith('- ')) {
              // Array
              current[cleanKey] = []
              stack.push({ indent: nextIndent, value: current[cleanKey] })
            } else {
              // Object
              current[cleanKey] = {}
              stack.push({ indent: nextIndent, value: current[cleanKey] })
            }
          }
        } else {
          current[cleanKey] = null
        }
      } else {
        // Inline value
        current[cleanKey] = parseYAMLValue(valueStr)
      }
    }
  }

  return stack[0].value
}

/**
 * Parse YAML value to appropriate JavaScript type
 * @param {string} value - YAML value string
 * @returns {string|number|boolean|null|Array|Object} Parsed value
 */
function parseYAMLValue(value) {
  if (!value) return null

  const trimmed = value.trim()

  // Null values
  if (trimmed === 'null' || trimmed === '~' || trimmed === '') {
    return null
  }

  // Boolean values
  if (trimmed === 'true' || trimmed === 'yes' || trimmed === 'on') {
    return true
  }
  if (trimmed === 'false' || trimmed === 'no' || trimmed === 'off') {
    return false
  }

  // Quoted strings
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }

  // Numbers
  if (/^-?\d+\.?\d*$/.test(trimmed)) {
    const num = Number(trimmed)
    if (!isNaN(num)) {
      return num
    }
  }

  // Arrays (inline format)
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      return JSON.parse(trimmed)
    } catch {
      // Fall through to return as string
    }
  }

  // Objects (inline format)
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      return JSON.parse(trimmed)
    } catch {
      // Fall through to return as string
    }
  }

  return value
}
