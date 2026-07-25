---
title: "Processing 2,000 Hours of Media a Day with Celery and Redis"
date: 2026-07-26
author: Kushal Patankar
category: Infrastructure
tags: [Celery, Redis, Distributed Systems, Python, Architecture, Queues]
description: What running a video dubbing pipeline at 2K hours of daily content taught me about queue design, worker acknowledgment, and where a 50% speedup actually comes from.
readTime: 11 min read
---

At 2,000 hours of media a day, the failures that cost us the most were never the ones that crashed. They were the jobs that half-finished.

A crash is loud. A worker dies, the job disappears from every dashboard, and someone notices. A half-finished job is quiet: the audio separated, the translation completed, the synthesis started, and then the container restarted during a deploy. The user sees a project stuck at 60% forever, and the only evidence lives in a log line nobody read.

At [Dubverse](/work/dubverse), the video dubbing platform grew to 600K+ hours of processed content across 1M+ users. Moving that work onto Celery and Redis cut content generation time by 50%. The speedup mattered, but the durability mattered more. This is what I would tell myself before building that pipeline again.

## Media work arrives faster than it processes

Start with the arithmetic, because it sets every other decision.

Two thousand hours of media per day is roughly 83 hours of new content arriving every hour. If a single worker processes media at twice real time, one worker clears 2 hours of content per hour, and you need about 42 of them running continuously just to break even. Any hour spent below that rate becomes a backlog that the next hour inherits.

This is the first way media pipelines differ from ordinary API workloads. A web request that takes 200 ms and fails costs you 200 ms. A dubbing job that takes 40 minutes and fails at minute 38 costs you 38 minutes of compute, and it costs them again on the retry. At this arrival rate, wasted work compounds into a queue you cannot drain.

The second difference is duration. When a unit of work outlives the deploy cycle, the process that owns it will be killed mid-flight as a matter of routine. Not occasionally — every deploy, forever. The architecture has to assume it.

## A media job is a pipeline, not a task

The instinct is to write one task called `process_video` and let it run. It works until any single stage misbehaves, and then you discover you have built one failure domain with four different failure modes inside it.

A dubbing job decomposes into stages that have almost nothing in common:

- **Ingest** — pulling source media over a network, bound by bandwidth and remote availability.
- **Extraction** — separating audio from video, bound by disk and CPU.
- **Transcription and translation** — model calls, bound by an external provider's rate limit.
- **Synthesis** — generating audio, bound by GPU or provider throughput.
- **Assembly** — muxing the result back together, bound by CPU and disk again.

These stages want different retry policies, different concurrency, and different hardware. A network fetch should retry four times with backoff, because the remote host is probably fine in five minutes. A 40-minute transcode should retry approximately never without a human deciding why it failed, because a retry costs 40 more minutes and the input is unlikely to have improved.

Collapsing them into one task forces one policy onto all five. You end up retrying the expensive stage because the cheap stage is flaky.

## Stages with different constraints belong on different queues

Once the stages are separate tasks, the routing follows from what constrains each one. Here is the shape, from [ReelServer](/work/reelserver) — a smaller media pipeline of mine where the same pattern is public:

```python
task_queues = (
    Queue("default"),
    Queue("downloads"),
    Queue("transcriptions"),
    Queue("analysis"),
)

task_routes = {
    "tasks.download_reel_by_url": {"queue": "downloads"},
    "tasks.transcribe_reel": {"queue": "transcriptions"},
    "tasks.analyze_transcript": {"queue": "analysis"},
}
```

Three queues, three reasons. Downloads are rate-limited by a remote service. Transcription is local CPU work that can run fully parallel. Analysis calls a model provider with its own quota.

The payoff is that each queue gets its own worker pool, and you scale the one that is actually behind. When transcription backs up, you add transcription workers on CPU-heavy machines without adding download concurrency that would get you throttled. With a single queue, a burst of one stage starves every other stage, and your only lever is "more workers," which makes the rate-limited stage worse.

The per-task settings express the same reasoning:

```python
@app.task(name="tasks.transcribe_reel", max_retries=0, rate_limit=None)   # local CPU, run flat out
@app.task(name="tasks.analyze_transcript", max_retries=2, rate_limit="60/m")  # provider quota
@app.task(name="tasks.download_reel_by_url", max_retries=3, default_retry_delay=300)
```

Transcription has no rate limit and no retries: nothing external can throttle it, and a failure means the media is bad. Analysis is capped at 60 calls per minute because the provider says so. Downloads retry three times, five minutes apart, because remote failures are usually temporary.

None of these numbers are universal. The point is that each one answers a question about that specific stage, and a single global setting cannot.

## The unit of work is a job, not a request

Splitting the pipeline into stages creates a new problem: something has to know where a piece of media is. Celery's task result is not that thing. Results expire, and "the task succeeded" tells you nothing about whether the media is ready for a user.

Model the state explicitly, in your own database:

```python
class ReelState(str, Enum):
    AWAITING_DOWNLOAD = "AWAITING_DOWNLOAD"
    DOWNLOAD_IN_PROGRESS = "DOWNLOAD_IN_PROGRESS"
    DOWNLOAD_FINISHED = "DOWNLOAD_FINISHED"
    DOWNLOAD_FAILED = "DOWNLOAD_FAILED"
    AWAITING_TRANSCRIPTION = "AWAITING_TRANSCRIPTION"
    TRANSCRIPTION_IN_PROGRESS = "TRANSCRIPTION_IN_PROGRESS"
    TRANSCRIPTION_FINISHED = "TRANSCRIPTION_FINISHED"
    TRANSCRIPTION_FAILED = "TRANSCRIPTION_FAILED"
```

Every stage gets an awaiting, in-progress, finished, and failed state. It looks verbose next to a single `status` column, and it earns that verbosity the first time you need to answer an operational question:

- Which jobs are stuck in progress with no live worker? Those are the half-finished ones, and they are recoverable.
- Which stage is accumulating a backlog right now?
- Where do we resume this job instead of restarting it from ingest?

That last question is worth the entire schema. If a job fails at synthesis, resuming from synthesis costs minutes. Restarting from ingest costs everything the job has already spent, at 83 hours of arriving content per hour.

The flow that results looks like this:

```text
                  +--------------------+
API -> job row -> |  downloads queue   | -> worker -> media store
   (AWAITING)     +--------------------+     |
                                             v
                  +--------------------+   state: DOWNLOAD_FINISHED
                  | transcription queue| <---+
                  +--------------------+ -> worker -> ...
                            |
                            +-------> job row (state, error, timing)
```

The API writes a row and returns an identifier. Each worker owns exactly one stage, advances the state, and enqueues the next stage. No stage knows how the others are implemented.

## Acknowledgment settings decide what a worker death costs

This is the part that separates a pipeline that survives deploys from one that quietly loses work, and it comes down to four settings. From [Birdbrain](/work/birdbrain):

```python
celery_app.conf.update(
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)
```

`task_acks_late=True` tells Celery to acknowledge a message *after* the task finishes rather than when it starts. Without it, a worker that dies mid-job has already told the broker the message was handled, and the job is gone. With it, the message returns to the queue and another worker picks it up. For a 40-minute job, this is the difference between losing the work and retrying it.

`worker_prefetch_multiplier=1` stops each worker from reserving a batch of messages it has not started. The default prefetch is a throughput optimization built for short tasks. For long ones it is a liability: a worker holding six unstarted jobs takes all six down with it, and meanwhile idle workers sit next to a queue that looks empty.

Two more settings matter for media specifically:

```python
task_reject_on_worker_lost=True   # requeue when the process dies, not just on exception
worker_max_tasks_per_child=50     # recycle the process before it leaks
```

The second one is unglamorous and saved us repeatedly. Media libraries allocate large buffers, and memory usage that looks fine at task 5 looks different at task 500. Recycling the worker process on a fixed task count converts a slow leak into a scheduled, harmless restart.

Late acknowledgment has a consequence worth stating plainly: your tasks must be safe to run twice. A requeued job will re-execute work that may have partially completed. Write outputs to deterministic paths, make database writes idempotent, and check whether a stage's output already exists before redoing it.

## Where the 50% actually came from

I want to be precise about this number, because "we made it 50% faster" invites the assumption that we optimized the slow parts. We mostly did not.

The gain came from three places, in descending order:

**Stages stopped waiting on each other.** In a single-task pipeline, every stage runs sequentially inside one process, and total time is the sum of all stages. Once stages became separate queues with separate pools, a job's transcription could start while another job was still downloading. Throughput rose because the pipeline stopped idling, not because any step got faster.

**Failed work stopped restarting from zero.** With explicit per-stage state, a failure at stage four resumed at stage four. At any meaningful failure rate, this alone moves the average completion time significantly.

**The rate-limited stages stopped blocking the parallel ones.** Isolating provider-bound work onto its own queue meant a provider slowdown created a backlog in one place instead of stalling every stage behind it.

Only after those three did per-stage tuning matter. If you are looking at a slow pipeline, check for these in this order before optimizing any individual step.

## The approaches that stop working first

### One queue for every kind of task

It is the fastest thing to build and the first thing to break. Different stages have different constraints, and a shared queue applies the tightest one to everything while letting any burst starve the rest.

### Retrying everything with the same policy

A blanket `autoretry_for=(Exception,)` with three retries is reasonable for network calls and expensive for a 40-minute transcode that failed because the input file is corrupt. Retry policy belongs to the stage, and some stages should fail loudly on the first attempt.

### Putting media in the message

Redis is a good broker and a bad file store. Messages should carry identifiers and paths; the bytes belong in object storage. A queue holding payloads has memory characteristics that change with your traffic, which is exactly what you do not want from the component coordinating everything else.

### Trusting the result backend as your source of truth

Task results expire, and they answer "did this function return" rather than "is this media ready." Keep job state in your own database with your own schema. The result backend is for plumbing.

### Treating worker memory as someone else's problem

Media processing allocates aggressively. Without `worker_max_tasks_per_child`, the failure arrives days later as an OOM kill during peak traffic, and it looks like a mystery.

## Where this architecture breaks down

Queues do not make anything faster. They make slow, unreliable work manageable, and they charge you for it in operational surface area. You now run a broker, several worker pools, and a state machine that needs migrations when the pipeline changes shape.

The 50% improvement at Dubverse also came from a specific starting point: a pipeline where stages ran sequentially in one process. If your stages already run in parallel, the same restructuring will not produce the same number. Treat it as evidence that stage isolation pays, not as a benchmark.

Celery itself has limits worth knowing before you commit. Its scheduling is not designed for strict fairness between tenants, so one customer submitting a thousand jobs can crowd out everyone behind them unless you add your own admission control. Long tasks interact badly with autoscaling that assumes short ones. And with `acks_late` enabled, a task that reliably kills its worker will requeue forever unless something detects the pattern and quarantines it.

## Frequently asked questions about Celery media pipelines

### How many Celery workers do I need?

Compute the arrival rate and the per-worker throughput, then divide. If 2,000 hours arrive daily and one worker handles 2 hours per hour, you need about 42 workers to break even and headroom above that for bursts and failures. Size each queue separately, since a CPU-bound stage and a rate-limited stage have unrelated answers.

### Should Redis be the broker for large media jobs?

Redis works well as the broker and result backend for this workload, provided messages stay small. Pass object storage keys and database identifiers, never the media itself. If you need stronger delivery guarantees or per-tenant fairness, that is the point to evaluate RabbitMQ or a managed queue instead.

### What is the difference between `acks_late` and `task_reject_on_worker_lost`?

`acks_late` delays acknowledgment until the task completes, so an unfinished message returns to the queue. `task_reject_on_worker_lost` covers the case where the worker process dies outright rather than raising an exception. Enable both for long-running work; either one alone leaves a gap.

### When should a pipeline stage get its own queue?

When it has a constraint the other stages do not share — an external rate limit, a hardware requirement, or a duration an order of magnitude different from its neighbors. If two stages would always scale together and fail together, they can share a queue.

### How do I make a media task safe to retry?

Write outputs to paths derived from the job identifier and stage rather than from timestamps or random names, check for an existing output before recomputing it, and make the state transition the last thing a task does. Then a duplicate run overwrites the same bytes and reaches the same state.

A media pipeline is mostly an exercise in deciding what happens when something stops halfway. The model call, the transcode, the synthesis step — those are the parts people describe when they explain the product, and they are rarely the parts that determine whether it works at scale. Stage boundaries, acknowledgment semantics, and a state machine you can query decide that. Get those right early, and the expensive parts become replaceable.
