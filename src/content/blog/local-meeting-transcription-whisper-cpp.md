---
title: "whisper.cpp Meeting Transcription: Fixing Echo, Hallucinations, and Loops"
date: 2026-09-17
updated: 2026-10-05
author: Kushal Patankar
category: AI/LLM
tags: [Whisper, whisper.cpp, Transcription, Whisper Hallucination, Echo Cancellation, Electron, Local AI]
description: How to transcribe meetings fully offline on a Mac with whisper.cpp — two audio tracks, echo cancellation with delay compensation, and how to stop Whisper hallucinating on silence or looping the same phrase.
readTime: 10 min read
---

The first meeting transcript my notes app produced had me saying things the other person had actually said.

I had taken the call without headphones. Their voice played out of my laptop speakers, went straight back into my microphone, and Whisper dutifully transcribed it under my name. The words were accurate, but the speaker labels made the transcript useless.

This post walks through how I built the meeting recorder in [Stone](/work/stone), a local-first note-taking app I build. The core constraint was simple: audio never leaves the machine. Getting Whisper running locally turned out to be straightforward; most of the actual engineering went into everything surrounding the model.

## The pipeline at a glance

```text
mic ──────────────┐
                  ├─> echo cancellation ─> Whisper ─┐
system audio ─────┤                                 ├─> merged transcript ─> summary
                  └──────────────────────> Whisper ─┘
```

Stone records two separate audio tracks. It uses the system audio track as a reference to clean speaker bleed out of the microphone track, transcribes each track independently, and then interleaves the segments by timestamp into a single transcript labelled "You" and "Others."

## Record two tracks, not one

If you record a call as a single mixed audio file, the transcription pipeline has to figure out who is speaking when. That problem is speaker diarization, and solving it requires extra models that bring their own failure modes.

For a simple split between me and everyone else on a call, I do not need a diarization model. The microphone captures me, and the system audio captures everyone else. Capturing those two streams as separate tracks gives you speaker labels for free.

Because Stone is an Electron app, it captures system audio using Chromium's display-media API with loopback audio. The app requests a screen-capture stream, immediately drops the video track, and keeps only the audio. (This is why macOS prompts for screen recording permission even though Stone never saves video.)

The catch is that these two tracks only stay separate if you wear headphones.

## Speakers leak into the microphone

When you take a call on laptop speakers, the remote audio plays into the room and right back into your microphone. Now your mic track contains both sides of the conversation, and every sentence from the other side shows up twice in the final transcript—once as "Others" and once as "You."

My first attempt at fixing this was a text heuristic that dropped mic segments whenever their words matched the system track. That fell apart as soon as two people spoke at the same time.

The proper fix is acoustic echo cancellation—the same signal processing every video-calling app runs during a call. Because we already have a clean digital copy of what the speakers played, we can subtract it from what the microphone picked up.

Stone does this with DTLN-aec, a small two-stage neural network running via ONNX Runtime. The first stage looks at both the mic signal and the system reference to predict a mask on the mic signal's frequency spectrum, and the second stage refines the output in the time domain. Because Stone cleans the audio after the meeting ends rather than during the call, the model runs offline on the recorded files without real-time latency constraints.

## Delay compensation is the part that makes it work

When I first wired up the echo canceller, it barely made a dent in the bleed, and it took me a while to figure out why.

System audio is captured before it reaches the speakers. The echo reaches the microphone later, after crossing the room and passing through the mic's buffers. The tracks can be out of sync by a few tens of milliseconds.

An echo canceller needs the reference lined up with the echo it caused. Without that alignment, it cannot subtract the right signal.

To fix this, Stone estimates the delay and aligns the tracks before running DTLN-aec:

1. Compute an energy envelope for both tracks at 10 ms resolution.
2. Cross-correlate those envelopes across a ±200 ms window.
3. If the peak correlation is strong enough, shift the reference track by that lag.

When the correlation is weak, it usually means the user is wearing headphones and there is no echo to align, so Stone leaves the reference track untouched.

Once the tracks are aligned, speaker bleed drops by roughly 14 dB while clean speech passes through intact. I verified my TypeScript implementation against a Python reference script that lives in the repository.

I also kept the entire echo-cancellation pass best-effort. If the ONNX model fails to load or the recording is too short to align, Stone simply falls back to the raw microphone audio. A rougher transcript is still better than no transcript.

## Choosing the Whisper runtime

My initial prototype ran Whisper in JavaScript using transformers.js inside a worker thread, paired with the `whisper-base.en` model. Keeping it all in JavaScript made it easy to ship.

Unfortunately, it was sluggish and limited to English.

I replaced it with whisper.cpp, compiled from source and bundled inside the app as a CLI binary. Its support for Metal and Accelerate on Apple hardware made a much larger model practical. Stone now uses `large-v3-turbo`, quantized down to roughly 547 MB, which the app downloads once on first use and runs completely offline from then on.

The larger model matters for real conversations. Unlike the small English-only model, it handles multiple languages and keeps up when speakers switch languages mid-sentence.

## Stopping Whisper from hallucinating on silence

Whisper expects speech, and if you feed it thirty seconds of dead air or keyboard clatter, it tends to invent phantom lines—classically things like "Thank you for watching."

Stone runs Silero VAD, or voice activity detection, first and sends only the regions identified as speech to Whisper. That removes most hallucinated lines and speeds up transcription by skipping pauses.

## Collapsing Whisper's repetition loops

Even with silence stripped out, Whisper occasionally gets stuck in a rut and repeats the exact same phrase, segment after segment, for a minute or more.

I added a small post-processing pass to catch these loops. Stone compares adjacent segments after normalizing case and punctuation; when consecutive segments contain identical text, it merges them into a single entry and records how many times the phrase repeated.

Only back-to-back duplicates are collapsed. If someone says "okay" three separate times during a meeting, all three stay in the transcript.

## A live draft while you record

Staring at a blank screen until a meeting ends makes a recorder feel broken, so Stone displays a rough live transcript while the call is still going.

If I spawned the whisper.cpp CLI binary every few seconds for new audio, it would have to reload the 547 MB model into memory on every chunk. Instead, Stone spins up the whisper.cpp HTTP server once at the start of the recording, keeps the model warm in memory, and sends short audio chunks to a port bound to localhost.

Three small adjustments kept this background server well-behaved during calls:

- **Two CPU threads.** Because the live transcriber runs alongside your video call, Stone caps it at two threads so it doesn't starve the meeting software.
- **Language pinning.** Left on auto-detect, Whisper re-identifies the spoken language on every single chunk. Once a chunk hits a confident language match, Stone locks that language in for the rest of the session, cutting the per-chunk work roughly in half.
- **A 20-second timeout.** If a chunk takes longer than the timeout, Stone assumes the server wedged and restarts it cleanly.

This live view is strictly a throwaway draft. As soon as you hit stop, Stone runs the full offline pipeline—echo cancellation, VAD, and final transcription—over the complete audio tracks and replaces the draft.

## Summaries that know what to distrust

A summary model can treat every transcript line as fact. If Whisper mishears a number, the summary can repeat the wrong number with confidence.

whisper.cpp reports a confidence score for each segment. Stone hangs onto those scores, pairs them with the repeat counts from the loop detector, and feeds that metadata straight into the summarization prompt. Segments with low confidence or collapsed repetition loops are explicitly flagged, and the prompt instructs the LLM to treat them with skepticism rather than turning them into decisions or action items.

This does not make summaries perfect, but it stops the worst failure: a garbled sentence turning into a fake task.

## The audio is yours to keep or delete

Meeting audio eats up disk space quickly and is inherently sensitive, so Stone lets you choose how long to keep the raw files:

- Keep the audio indefinitely (until you delete the meeting note).
- Delete the audio immediately once transcription finishes.
- Delete the audio automatically after a set window (30 days by default).

Regardless of what happens to the audio files, your text transcript and summary stay in your notes. As long as the audio is still on disk, you can play it back synced to the transcript or re-run transcription later when better models come along.

## Where this approach falls short

**It is macOS-first.** Capturing two separate tracks relies on system loopback audio, and so far I have only thoroughly tested this pipeline on a Mac.

**Others are one speaker.** Everyone on the remote end of the call gets grouped under a single "Others" label. Splitting out individual remote participants would require actual speaker diarization.

**It needs a capable machine.** Running `large-v3-turbo` locally feels great on Apple silicon, but it would be a slog on older hardware.

**In-person meetings get one track.** When everyone is sitting in the same physical room, everything comes through one microphone—there is no system audio track, and therefore no free speaker separation.

**Echo cancellation has limits.** If your speakers are cranked up so loud that the remote voices completely drown out your own voice at the microphone, the echo canceller won't be able to rescue your words.

## Frequently asked questions about local transcription

### Can Whisper run fully offline on a Mac?

Yes. whisper.cpp runs Whisper models natively on Apple hardware without touching the network. You only need an internet connection once to download the model weights; after that, nothing leaves your computer.

### Which Whisper model should I use for meetings?

On Apple silicon, `large-v3-turbo` hits the sweet spot: you get accuracy close to the full large model at a fraction of the compute cost, plus solid multilingual support. Quantizing it keeps the download right around 550 MB.

### How do I stop Whisper from hallucinating during silence?

Filter the audio through voice activity detection (VAD) beforehand and send only the regions it identifies as speech to Whisper. Follow that up by merging consecutive identical text segments, which cleans up the repetition loops that slip past VAD.

### Why does my transcript show the other person's words as mine?

Sound from your speakers is bleeding back into your microphone. Putting on headphones solves this immediately; if you want to use speakers, you have to run acoustic echo cancellation using the system audio stream as a reference signal.

### Do I need speaker diarization for call transcripts?

Not if you just want to separate yourself from everyone else on the call. Recording your microphone and your system output onto two separate tracks gives you two speaker labels without a diarization model.

Running the speech model turned out to be the easy part—open weights are already great, and whisper.cpp makes them fast on a Mac. The real work lived in the plumbing around it: capturing two clean streams, lining them up in time, and telling the summarizer which lines not to trust. You can browse the implementation at [github.com/peritissimus/stone-electron](https://github.com/peritissimus/stone-electron), or read more about the app itself in [Stone: a local-first Markdown note-taking app for Mac](/blog/stone-local-first-note-taking-app).
