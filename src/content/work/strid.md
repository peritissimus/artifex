---
title: Strid
company: Strid
kind: personal
role: Designer & Engineer
description: On-device PII detection and redaction for documents, with first-class support for Indian banking identifiers.
dateRange: '2026'
sortDate: 2026-03-14
location: Independent
order: 107
technologies: [Swift, SwiftUI, Apple NaturalLanguage, Vision, PDFKit, Python, Presidio]
achievements:
  - '**Private by design** — Detects and redacts sensitive information on-device instead of uploading documents to a service'
  - '**India-aware recognition** — Handles Aadhaar, PAN, IFSC, UPI IDs, bank accounts, MICR codes, and transaction references'
  - '**Reusable detection engine** — Packages recognition, overlap resolution, confidence scoring, and multiple redaction styles behind a small API'
externalUrl: https://github.com/peritissimus/strid
outcome: 'Strid explores how document privacy tools can feel native and trustworthy when the complete detection and redaction loop stays on the device.'
---

Strid began with a narrow question: can sensitive documents be made safe to share without first sending them somewhere else? The result is an on-device redaction toolkit and native SwiftUI application designed around that constraint.

The recognition engine combines Apple's Natural Language and data-detection frameworks with contextual recognizers for Indian financial identifiers. It resolves overlapping detections by confidence, then supports placeholder, asterisk, and character-fill redaction styles.

The app layer turns the engine into a practical document workflow: import or scan a document, review highlighted findings, redact selected entity types, and export the result. The architecture also leaves room for OCR and flattened PDF redaction without changing the core privacy model.
