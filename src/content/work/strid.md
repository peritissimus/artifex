---
title: Strid
company: Strid
kind: personal
role: Designer & Engineer
description: An on-device redaction engine and native document workflow with first-class support for Indian banking identifiers.
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

Redacting a document should not require uploading the unredacted original. Strid keeps the full detection and replacement loop on the device, with recognition designed for the identifiers that appear in Indian bank statements and financial documents.

**The privacy constraint came first.** I wanted a safer way to prepare statements and other sensitive documents for sharing. A cloud redaction service solves the visible problem by creating a more important one: the raw document has to leave the machine before it can be protected. Strid began as an engine that could remain useful without that upload.

**Generic detection misses local context.** Apple's Natural Language and data-detection frameworks cover common names, addresses, phone numbers, and payment details. Strid adds contextual recognizers for Aadhaar, PAN, IFSC, UPI IDs, bank-account numbers, MICR codes, customer IDs, branch codes, and transaction references. Format alone is not always enough, so nearby words can raise or lower confidence for ambiguous number sequences.

**Conflicts are resolved before text changes.** Multiple recognizers can claim the same characters. The engine filters by confidence, compares overlapping ranges, and keeps the stronger detection. Redaction then runs from the end of the text toward the beginning so earlier character offsets do not shift underneath later replacements.

**The output matches the purpose.** A placeholder such as `<IN_PAN>` keeps the document readable for analysis. Asterisks preserve a familiar masked appearance. Character-fill redaction preserves the original length when layout matters. The core API exposes detection and redaction separately, so a caller can review findings, select entity types, or apply a different presentation without rebuilding recognition.

**The engine and app remain separate.** StridKit packages entity models, recognizers, overlap resolution, and redaction behind a small Swift API. The SwiftUI app turns that engine into an import, review, redact, and export workflow. OCR and flattened PDF support can extend the document boundary later without moving detection off-device.

Strid is personal software because trust is the feature I need from it. The tool handles the documents I am least willing to send elsewhere, and its architecture makes that promise inspectable: recognition, review, and redaction all happen locally.
