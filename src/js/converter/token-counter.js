/**
 * Approximate token counter for text
 * Uses a simplified estimation based on GPT tokenization patterns
 * For accurate counts, consider using tiktoken or gpt-tokenizer
 */

/**
 * Estimate token count for a given text
 * This is an approximation based on common patterns:
 * - ~4 characters per token for English text
 * - Punctuation and whitespace affect tokenization
 * - Numbers and special characters may tokenize differently
 *
 * @param {string} text - Text to count tokens for
 * @returns {number} Estimated token count
 */
export function estimateTokens(text) {
  if (!text) return 0

  // Split on common token boundaries
  const words = text.split(/\s+/).filter((w) => w.length > 0)

  let tokenCount = 0

  for (const word of words) {
    // Short words (1-4 chars) typically = 1 token
    if (word.length <= 4) {
      tokenCount += 1
      continue
    }

    // Longer words: estimate based on length
    // Average: ~4 characters per token
    tokenCount += Math.ceil(word.length / 4)

    // Adjust for special patterns
    if (word.includes(',') || word.includes('.') || word.includes(':')) {
      // Punctuation often creates additional tokens
      tokenCount += (word.match(/[,.:;]/g) || []).length * 0.5
    }
  }

  // Account for structural tokens (brackets, braces, quotes)
  const structuralChars = text.match(/[\[\]{}()""'']/g) || []
  tokenCount += structuralChars.length * 0.3

  // Newlines and indentation
  const newlines = (text.match(/\n/g) || []).length
  tokenCount += newlines * 0.5

  return Math.ceil(tokenCount)
}

/**
 * Calculate token savings between two texts
 * @param {string} originalText - Original text
 * @param {string} convertedText - Converted text
 * @returns {Object} Token statistics
 */
export function calculateSavings(originalText, convertedText) {
  const originalTokens = estimateTokens(originalText)
  const convertedTokens = estimateTokens(convertedText)
  const saved = originalTokens - convertedTokens
  const percentage = originalTokens > 0 ? ((saved / originalTokens) * 100).toFixed(1) : 0

  return {
    original: originalTokens,
    converted: convertedTokens,
    saved,
    percentage: parseFloat(percentage),
  }
}

/**
 * More accurate token estimation using character-based analysis
 * This approximates the GPT-5 o200k_base tokenizer
 * @param {string} text - Text to analyze
 * @returns {number} Estimated token count
 */
export function estimateTokensAccurate(text) {
  if (!text) return 0

  let tokens = 0

  // Handle whitespace and newlines
  const lines = text.split('\n')

  for (const line of lines) {
    if (!line.trim()) {
      tokens += 1 // Newline token
      continue
    }

    // Tokenize line content
    let i = 0
    while (i < line.length) {
      // Skip whitespace
      if (/\s/.test(line[i])) {
        i++
        continue
      }

      // Numbers (including decimals and negatives)
      if (/[\d-]/.test(line[i])) {
        let num = ''
        while (i < line.length && /[\d.\-e]/.test(line[i])) {
          num += line[i]
          i++
        }
        tokens += Math.max(1, Math.ceil(num.length / 3))
        continue
      }

      // Punctuation and special chars
      if (/[^\w\s]/.test(line[i])) {
        tokens += 1
        i++
        continue
      }

      // Words and identifiers
      let word = ''
      while (i < line.length && /\w/.test(line[i])) {
        word += line[i]
        i++
      }

      if (word.length > 0) {
        // Common words might be single tokens
        if (word.length <= 4) {
          tokens += 1
        } else {
          // Longer words: ~4 chars per token
          tokens += Math.ceil(word.length / 4)
        }
      }
    }

    // Account for line ending
    tokens += 0.5
  }

  return Math.ceil(tokens)
}
