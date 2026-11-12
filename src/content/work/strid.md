---
title: Strid
company: Strid
kind: personal
role: Designer & Engineer
description: 'An on-device document redaction tool with recognition for Indian banking identifiers.'
seoTitle: 'Strid – On-Device Document Redaction for Indian Banking IDs'
dateRange: '2026'
sortDate: 2026-03-14
location: Independent
order: 107
technologies: [Swift, SwiftUI, Apple NaturalLanguage, Vision, PDFKit, Python, Presidio]
achievements:
  - '**Detection** — On-device recognition with additional Indian banking identifiers'
  - '**Review** — Separate detection and redaction APIs, with confidence-based overlap resolution'
  - '**Replacement** — Entity labels, asterisks, or character-count-preserving fill'
externalUrl: https://github.com/peritissimus/strid
updated: 2026-11-12
---

I wanted to remove sensitive information from statements before sharing them, without first uploading the originals to a redaction service. Strid detects and replaces that information on the device, with extra recognition for identifiers used in Indian banking documents.

## Recognizing identifiers

Apple's frameworks cover common information such as names, addresses, and phone numbers. Strid adds recognizers for Aadhaar, PAN, IFSC, UPI IDs, bank accounts, MICR codes, and transaction references.

A number's format is not always enough to identify it. Nearby words help the engine decide how confident to be. If two recognizers match overlapping characters, the engine compares their confidence and keeps the stronger detection.

## Reviewing and replacing text

Detection and redaction are separate API calls, so the app can show findings for review before changing the document. A caller can select which types to redact and how to replace them: a label such as `<IN_PAN>`, asterisks, or a fill that preserves character count.

Replacements run from the end of the text toward the beginning. That keeps each earlier match's position valid as later text changes length.

## Separating the engine from the app

StridKit contains the recognition and replacement logic in a Swift API. A SwiftUI app provides the import, review, redact, and export workflow. The repository also includes a Python command-line implementation built on Presidio, with recognizers for Indian identifiers.

OCR and flattened PDF support are possible extensions, rather than capabilities I assume from text detection alone.

Keeping processing local addresses where the document goes. Detection quality still matters, which is why reviewing the findings is part of the workflow.
