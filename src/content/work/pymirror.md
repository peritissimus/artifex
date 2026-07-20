---
title: PyMirror
company: PyMirror
kind: personal
role: Early ML Experiment
description: An early call-analysis prototype combining speaker diarization, transcription, sentiment, and grammar scoring.
dateRange: 2019 - 2020
sortDate: 2019-05-27
location: Private archive
order: 111
technologies: [Python, Google Cloud Speech, Google Cloud Natural Language, pandas, seaborn, pydub]
achievements:
  - '**Speaker-aware transcription** — Separates two participants with diarization and produces color-coded call transcripts'
  - '**Conversation scoring** — Computes per-speaker sentiment summaries and flags low-confidence transcription segments'
  - '**Exploratory reporting** — Plots comparative caller and agent scores to make conversation quality easier to inspect'
outcome: 'PyMirror is kept as an honest early artifact: a rough but formative exploration of turning unstructured calls into measurable feedback.'
---

PyMirror was an early experiment in extracting useful feedback from recorded conversations. It transcribed phone-call audio, attributed words to two speakers, and assembled separate caller and agent streams for analysis.

Each stream was passed through sentiment analysis, with low-confidence transcription regions surfaced for review. Supporting experiments explored grammar feedback and visual comparisons of speaker scores using a small Python data-analysis stack.

The project predates the current generation of speech and language models, and its implementation is intentionally presented as an archive rather than a current product. Its value is historical: it marks an early attempt to connect speech recognition, language analysis, and practical quality feedback in one workflow.
