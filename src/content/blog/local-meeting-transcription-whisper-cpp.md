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

The first transcript my notes app produced had me saying things the other person said.

I was on a call without headphones. Their voice came out of my laptop speakers, went straight back into the microphone, and Whisper transcribed it faithfully — as me. The transcript was accurate and useless.

This is the story of the meeting recorder in [Stone](/work/stone), a local-first note-taking app I build. The constraint was simple: audio never leaves the machine. Most of the work was in everything around the model.

## The pipeline at a glance

```text
mic ──────────────┐
                  ├─> echo cancellation ─> Whisper ─┐
system audio ─────┤                                 ├─> merged transcript ─> summary
                  └──────────────────────> Whisper ─┘
```

Two tracks are recorded. The mic track is cleaned using the system track as a reference. Each track is transcribed on its own, and the results are interleaved by timestamp into one transcript labelled "You" and "Others."

## Record two tracks, not one

A single mixed recording forces the model to work out who is speaking. That is speaker diarization, and it is a hard problem with its own models and its own errors.

On a call, I do not need it. Everything from my microphone is me. Everything from the system output is everyone else. Recording those as two separate tracks gives speaker labels for free.

Stone is an Electron app, so the system track comes from Chromium's display-media capture with loopback audio. The app requests a screen-capture stream, drops the video, and keeps only the audio. This is why macOS asks for screen recording permission even though no video is saved.

The catch is that the tracks are only separate if you wear headphones.

## Speakers leak into the microphone

On laptop speakers, the far side of the call plays into the room and the mic picks it up. Now the "You" track contains both voices, and every remote sentence appears twice in the transcript — once under each speaker.

My first fix was a heuristic: drop mic segments whose text matched the system track. It broke as soon as two people talked at once.

The real fix is acoustic echo cancellation, the same technique every video-call app uses. You have a clean copy of what the speakers played. Subtract it from what the mic heard.

Stone uses DTLN-aec, a small two-stage neural model, run through ONNX Runtime. Stage one predicts a mask on the mic signal's spectrum using both the mic and the reference. Stage two refines the result in the time domain. It runs offline on the recorded tracks after the meeting ends, so it does not need to keep up with real time.

## Delay compensation is the part that makes it work

The first version of the canceller did almost nothing, and it took me a while to see why.

The system audio is captured digitally, before it reaches the speakers. The echo in the mic arrives later, after the sound has left the speakers, crossed the room, and passed through the mic's own buffering. The two tracks are out of sync by a few tens of milliseconds. A canceller cannot subtract a reference that is not lined up with the echo it caused.

So before running the model, Stone estimates the lag:

1. Compute an energy envelope for each track at 10 ms resolution.
2. Cross-correlate the envelopes over a window of ±200 ms.
3. If the best correlation is strong enough, shift the reference by that lag.

If the correlation is weak, there is probably no echo to align — the user is on headphones — and the reference is left alone.

With alignment in place, real speaker bleed is reduced by about 14 dB, and clean speech passes through unchanged. I validated the TypeScript implementation against a Python reference kept in the repository.

The whole step is best-effort. If the model fails to load or the audio is too short, Stone falls back to the raw mic track. A slightly worse transcript is better than no transcript.

## Choosing the Whisper runtime

The first version ran Whisper through transformers.js inside a worker thread, using the `whisper-base.en` model. It worked, and it was easy to ship because it was all JavaScript.

It was also slow, and English only.

I moved to whisper.cpp, built from source and bundled with the app as a command-line binary. It uses Metal and Accelerate on Apple hardware, which made a much larger model practical. Stone now runs `large-v3-turbo`, quantized to about 547 MB. The model is downloaded once on first use and then runs offline.

The larger model matters for the way people really talk. It handles multiple languages and speakers who switch between them mid-sentence, which the small English model could not.

## Stopping Whisper from hallucinating on silence

Whisper is trained on speech. Give it thirty seconds of silence or keyboard noise and it invents something — often a phrase like "Thank you for watching."

Stone runs Silero VAD first to find the regions that contain a voice, and only those reach Whisper. This removes most hallucinated lines and also makes transcription faster, since long meetings are full of pauses.

## Collapsing Whisper's repetition loops

Even with voice detection, Whisper sometimes gets stuck. It repeats one phrase, segment after segment, for a minute or more.

The fix is deliberately small. If consecutive segments have the same text after normalizing case and punctuation, Stone merges them into one segment, keeps the text once, and records how many times it repeated.

Only back-to-back duplicates are merged. Someone saying "okay" three times across a meeting is real, and it stays.

## A live draft while you record

Waiting until the end of a meeting to see any text feels broken, so Stone shows a rough draft while recording.

Spawning the command-line binary for each few seconds of audio would reload the 547 MB model every time. Instead, Stone starts whisper.cpp's server once, keeps the model in memory, and posts short audio chunks to it over a local HTTP port bound to localhost.

Three details kept it stable:

- **Two CPU threads.** The live draft runs for the whole meeting, so it is capped to leave room for the call itself.
- **Language pinning.** Automatic language detection re-runs for every chunk. Once a chunk detects a language with enough confidence, Stone pins it for the session, which roughly halves the work.
- **A 20-second timeout.** If a chunk takes longer, the server is assumed stuck and is restarted.

The live draft is disposable. When you stop recording, the full pipeline runs again on the complete tracks and replaces it.

## Summaries that know what to distrust

A summary model treats every line of a transcript as fact. If Whisper misheard a number, the summary states the wrong number with full confidence.

whisper.cpp reports how confident it was in each segment. Stone keeps that score, along with the repeat count from the loop detector, and passes both to the summary prompt. Low-confidence lines and collapsed loops are marked, and the prompt tells the model to discount them instead of presenting them as decisions.

It does not make summaries perfect. It does stop the worst failure, where a garbled line becomes an action item.

## The audio is yours to keep or delete

Recordings are large and sensitive, so retention is a setting:

- Keep the audio until you delete the meeting.
- Delete it immediately after transcription.
- Delete it after a set number of days. The default is 30.

The transcript and summary are always kept. While the audio exists, you can replay it with the transcript following along, or re-transcribe it later with a better model.

## Where this approach falls short

**It is macOS-first.** The two-track capture depends on system loopback audio, and I have only tested it properly on a Mac.

**Others are one speaker.** Everyone on the far side of the call shares one label. Telling remote participants apart would need real diarization.

**It needs a capable machine.** `large-v3-turbo` is comfortable on Apple silicon. It would be painful on old hardware.

**In-person meetings get one track.** With everyone in the same room, there is no system audio, and no free speaker separation.

**Echo cancellation has limits.** If the far-end audio is much louder than your own voice in the mic, your words can be buried beyond recovery.

## Frequently asked questions about local transcription

### Can Whisper run fully offline on a Mac?

Yes. whisper.cpp runs Whisper models natively on Apple hardware with no network connection. The model file has to be downloaded once, and after that nothing leaves the machine.

### Which Whisper model should I use for meetings?

`large-v3-turbo` is a good default on Apple silicon: close to the accuracy of the full large model at a fraction of the cost, with strong multilingual support. A quantized build keeps it near 550 MB.

### How do I stop Whisper from hallucinating during silence?

Run voice activity detection first and send only speech regions to the model. Then collapse consecutive identical segments, which catches the repetition loops that voice detection misses.

### Why does my transcript show the other person's words as mine?

Their voice is playing through your speakers and being picked up by your microphone. Wearing headphones fixes it. If that is not an option, you need acoustic echo cancellation with the system audio as the reference signal.

### Do I need speaker diarization for call transcripts?

Not for a simple you-versus-them split. Recording the microphone and the system audio as separate tracks gives you two speaker labels without a diarization model.

The model was the easy part. A good open model exists, and whisper.cpp makes it fast. What took the time was the audio around it: getting two clean tracks, lining them up, and being honest about which lines to trust. The code is open at [github.com/peritissimus/stone-electron](https://github.com/peritissimus/stone-electron), and the product overview is in [Stone: a local-first Markdown note-taking app for Mac](/blog/stone-local-first-note-taking-app).
