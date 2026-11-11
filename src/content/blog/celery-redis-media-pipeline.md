---
title: "Processing 2,000 Hours of Media a Day with Celery and Redis"
date: 2026-07-26
updated: 2026-10-17
author: Kushal Patankar
category: Infrastructure
tags: [Celery, Redis, Distributed Systems, Python, Architecture, Queues, acks_late, Visibility Timeout]
description: What a video dubbing pipeline at 2K hours of daily content taught me about Celery, Redis, safe retries, and a workload-specific 50% reduction in generation time.
readTime: 11 min read
---

When we were processing 2,000 hours of media a day, our most expensive failures were never the jobs that crashed outright. They were the ones that stopped halfway through.

A crash is obvious: a worker dies, the job vanishes from the dashboards, and someone notices. A half-finished job is quiet. The audio separates, the translation finishes, synthesis starts, and then a deploy restarts the container. From the user's side, their project sits at 60% forever, and the only clue is a single log line nobody ever reads.

At [Dubverse](/work/dubverse), our video dubbing platform eventually processed 600K+ hours of content for 1M+ users. Moving that pipeline onto Celery and Redis cut content generation time by 50%. The speedup was great, but making the work durable mattered much more. Here is what I wish I knew before building that system the first time.

This architecture also overlaps with [production LLM application infrastructure](/blog/scaling-llm-applications). Whether you run inference locally or hit an external API, translation and analysis calls still need durable job state, bounded execution times, and clean failure recovery. Queue settings alone will not make an external model call safe to retry—your application still has to handle duplicate work and side effects on its own.

## Media work arrives faster than it processes

The basic math of media processing dictates almost every design decision downstream.

Two thousand hours of media a day works out to roughly 83 hours of new content arriving every hour. If a single worker processes video at twice real-time speed, it clears 2 hours of media per hour. That means you need about 42 workers running non-stop just to keep up. Any hour you dip below that rate leaves a backlog that rolls straight into the next hour.

This is the first major difference between media pipelines and typical web APIs. When a 200 ms web request fails, you lose 200 ms. When a 40-minute dubbing job fails at minute 38, you lose 38 minutes of compute, and retrying it burns that compute all over again. With content arriving continuously, wasted work quickly piles up into a backlog you cannot drain.

The second difference is job duration. Once a unit of work takes longer than your deploy cycle, processes will get killed mid-job as part of normal operations. It happens on every single deploy, so the architecture has to expect it from day one.

## A media job is a pipeline, not a task

The natural first instinct is to write one big `process_video` task and let it run end to end. That works fine until one step misbehaves, and you realize you have bundled four or five completely different failure modes into a single failure domain.

A dubbing job actually breaks down into stages that share almost nothing in common:

- **Ingest** — pulling source media over the network, limited by bandwidth and remote host availability.
- **Extraction** — splitting audio from video, limited by local disk and CPU.
- **Transcription and translation** — model calls, limited by an external provider's rate limits.
- **Synthesis** — generating new audio, limited by GPU capacity or provider throughput.
- **Assembly** — muxing the final tracks back together, limited by CPU and disk again.

The stages need different retry policies, concurrency, and hardware. A network download should retry four times with backoff because the remote host may recover in five minutes. A 40-minute transcode should almost never retry without someone checking why it failed: that costs another 40 minutes, and the input is unlikely to have improved.

Putting everything inside a single task forces one policy across all five steps. You end up retrying your most expensive compute stages just because a cheap network step was flaky.

## Stages with different constraints belong on different queues

Once you split the stages into separate tasks, you can route them based on their actual bottlenecks. Here is how that looks in [ReelServer](/work/reelserver), a smaller media pipeline of mine where the same pattern is public:

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

There are three dedicated queues here for three distinct bottlenecks: downloads get rate-limited by remote hosts, transcription runs locally on the CPU in parallel, and analysis calls an external model provider with its own API quota.

Separating them gives each queue its own worker pool so you can scale whichever step is actually falling behind. If transcription backs up, you spin up more CPU-heavy transcription workers without increasing download concurrency and getting throttled. On a shared queue, a traffic spike in one stage starves everything else, and your only lever—adding more general workers—just hammers the rate-limited stages harder.

You can express those same stage constraints directly in the task decorators:

```python
@app.task(name="tasks.transcribe_reel", max_retries=0, rate_limit=None)   # local CPU, run flat out
@app.task(name="tasks.analyze_transcript", max_retries=2, rate_limit="60/m")  # provider quota
@app.task(name="tasks.download_reel_by_url", max_retries=3, default_retry_delay=300)
```

Transcription runs flat out with zero retries because nothing external throttles it, and if it fails, the media file itself is usually bad. Analysis is capped at 60 requests per minute to stay under the provider's quota. Downloads retry up to three times, spaced five minutes apart, to ride out temporary network issues.

The exact numbers will vary from system to system, of course. What matters is tuning each stage around its real-world limits instead of settling for one compromise setting across the board.

## The unit of work is a job, not a request

Breaking a pipeline into discrete tasks introduces a new coordination problem: something has to track where each piece of media sits in the workflow. Celery's built-in task results are the wrong tool for this. Task results expire, and knowing a Python function returned cleanly does not tell you whether a user's video is ready to watch.

Instead, model the job state explicitly in your own database:

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

Giving every stage its own awaiting, in-progress, finished, and failed states looks verbose compared to a generic `status` column. That verbosity pays for itself the first time things go sideways and you need to answer basic operational questions:

- Which jobs are marked in-progress even though their worker died? Those are your half-finished jobs, and now you can actually find and recover them.
- Which specific stage is building up a backlog right now?
- How do we resume a failed job from the broken step instead of starting over from scratch?

Being able to resume mid-pipeline justifies the entire schema on its own. When a job fails during audio synthesis, restarting at synthesis takes a few minutes. Restarting all the way back at ingest throws away every minute of compute spent so far—a brutal penalty when 83 hours of new media are showing up every hour.

Putting the database and queues together gives you a straightforward handoff flow:

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

The API inserts a job row and returns an ID. From there, each worker handles a single stage, updates the database row, and enqueues the next step. Individual stages never need to know how the rest of the pipeline works.

## Acknowledgment settings decide what a worker death costs

Acknowledgment and worker settings determine what happens when a process dies. This configuration comes from another project of mine, [Birdbrain](/work/birdbrain):

```python
celery_app.conf.update(
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)
```

`task_acks_late=True` delays acknowledgment until the task finishes. With early acknowledgment, a worker can die after telling the broker the message was handled, losing the job. With late acknowledgment, the message returns to the queue for another worker. For a 40-minute job, that determines whether interrupted work can be retried.

`worker_prefetch_multiplier=1` stops a worker from reserving a batch of messages it has not started. Prefetching helps short tasks, but it can leave long tasks waiting on a busy worker while others sit idle beside a queue that looks empty. If that worker dies with six unstarted jobs reserved, it takes all six down with it.

For media workloads specifically, two more settings round out the configuration:

```python
task_reject_on_worker_lost=True   # requeue when the process dies, not just on exception
worker_max_tasks_per_child=50     # recycle the process before it leaks
```

Recycling worker processes is unglamorous, and it saved us repeatedly. Audio and video libraries allocate huge native buffers that do not always get freed cleanly; memory usage that looks completely fine after 5 tasks can look disastrous after 500. Recycling worker processes after a fixed number of jobs turns a slow memory leak into a routine, harmless restart.

Enabling late acknowledgments does introduce one hard requirement: your tasks have to be safe to run more than once. When a dead worker's job gets requeued, the next worker may repeat steps that partially succeeded before the crash. You need to write files to deterministic output paths, keep database updates idempotent, and check whether a stage's output already exists before doing the heavy work again.

## The Redis visibility timeout redelivers long tasks

If you run Celery with `task_acks_late=True` on top of Redis, there is a hidden timer that is very easy to miss. Because Redis lists do not have native message acknowledgments, Celery emulates them using a `visibility_timeout` (which defaults to one hour). If a delivered message is not acknowledged before that timer runs out, Celery assumes the worker died and hands the message to someone else.

With late acknowledgments turned on, a message stays unacknowledged for the entire duration of the task. That means if a heavy transcode takes 70 minutes, Redis will quietly redeliver it at the 60-minute mark while the first worker is still crunching away. Suddenly you have two workers burning CPU on the exact same job even though nothing failed.

To prevent duplicate runs, set the visibility timeout comfortably higher than your longest task, with room to spare:

```python
celery_app.conf.broker_transport_options = {
    "visibility_timeout": 6 * 60 * 60,  # longer than the slowest job
}
```

Raising this timeout creates a trade-off in the other direction, though. When a worker is killed outright, the broker will not redeliver its unacknowledged task until the full six hours expire. This is another place where tracking job state in your own database pays off: you can run a lightweight sweeper job that spots tasks stuck in progress well past their expected runtime and requeues them in minutes, rather than waiting hours for Redis to time out.

Keep in mind that tasks scheduled in the future with `eta` or `countdown` share this exact same visibility timer. Any task scheduled further out than the visibility timeout will get redelivered early and execute multiple times.

## Where the 50% reduction in generation time came from

When I say moving to this setup cut generation time by 50%, it is easy to assume we optimized our media processing code or sped up model inference. For the most part, we didn't.

Almost all of that speedup came from fixing workflow bottlenecks, in roughly this order:

**Stages stopped waiting in line behind each other.** When the whole pipeline lived inside one monolithic task, every step ran sequentially in a single process, making total runtime the sum of every step plus idle waits. Splitting stages onto separate queues with independent worker pools meant one job's transcription could start immediately while other jobs were still downloading. Throughput jumped because workers stopped sitting idle, even though individual steps took the exact same time.

**Failed jobs stopped starting over from zero.** Tracking state per stage meant a failure in stage four resumed right at stage four. Whenever you have a noticeable failure rate on multi-step jobs, cutting out repeated work pulls down average completion times fast.

**Rate-limited stages stopped stalling parallel work.** Moving external API calls onto isolated queues meant a slow model provider only backed up its own queue, instead of clogging the workers needed for fast local CPU tasks.

Only after clearing those three structural bottlenecks did optimizing individual stages really move the needle. If you are staring at a slow media pipeline today, I would check those three things long before profiling any single step.

## The approaches that stop working first

Looking back, a few common shortcuts consistently break down first once traffic picks up.

### One queue for every kind of task

Putting everything on the default queue is the fastest way to ship a prototype and the first thing to fall over under load. Because stages have competing limits, a shared queue forces the strictest rate limit onto everything while letting a burst of cheap tasks starve your heavy workers.

### Retrying everything with the same policy

Slapping a global `autoretry_for=(Exception,)` with three retries onto every task makes sense for flaky network requests, and hurts badly when a 40-minute transcode fails on a corrupt upload. Retry rules belong on individual stages, and expensive deterministic tasks should usually fail fast on the first error.

### Putting media in the message

Redis is a great message broker and a terrible file store. Queue payloads should only carry database IDs and storage paths, while raw media bytes go straight to object storage. Passing files through Redis ties your broker's memory footprint directly to user upload sizes—the last thing you want in the component coordinating your entire backend.

### Trusting the result backend as your source of truth

Celery's result backend is meant for internal plumbing, not product state. Results expire, and knowing a Python task finished does not tell you whether a user's project is complete. Keep your real state machine in your application database where you control the schema and retention.

### Treating worker memory as someone else's problem

Audio and video libraries allocate memory aggressively and often hold onto it. If you skip `worker_max_tasks_per_child`, those gradual leaks eventually show up days later as mysterious OOM kills right in the middle of peak traffic.

## Where this architecture breaks down

Adding queues never makes the underlying work faster; it just makes slow, failure-prone work manageable at the cost of extra moving parts. Instead of one background process, you are now operating a broker, multiple worker pools, and an explicit state machine that requires database migrations whenever your pipeline steps change.

It is also worth keeping Dubverse's 50% speedup in context. We started from a pipeline where stages ran sequentially inside one process. If your pipeline stages already run concurrently, splitting queues the same way will not give you that kind of jump. Treat that number as evidence that isolating stages helped in this workload, rather than a benchmark.

Celery also has limits. Its scheduling is not designed for strict fairness between tenants, so one customer submitting a thousand jobs can crowd out others unless you add admission control. Long tasks can clash with autoscaling designed for short ones. With `acks_late` enabled, a task that repeatedly kills its worker can keep returning to the queue unless you detect and quarantine it.

## Frequently asked questions about Celery media pipelines

### How many Celery workers do I need?

Divide your hourly media arrival rate by what a single worker can clear in an hour. For example, 2,000 hours of incoming media per day, with a worker that processes 2 hours per hour, requires roughly 42 workers to keep up, plus extra capacity to absorb traffic spikes and retries. Calculate this separately for every queue, since CPU-heavy transcoding and rate-limited API calls scale completely differently.

### Should Redis be the broker for large media jobs?

Redis works well as both broker and result backend for large media pipelines, as long as you keep the messages tiny. Only pass database IDs and object storage keys through the queue—never the media files themselves. If you outgrow Redis because you need stricter delivery guarantees or per-tenant fairness, that is the point to evaluate RabbitMQ or a managed queue instead.

### What is the difference between `acks_late` and `task_reject_on_worker_lost`?

`acks_late` delays acknowledgment until the task completes, so an unfinished message returns to the queue. `task_reject_on_worker_lost` covers the case where the worker process dies outright rather than raising an exception. Enable both for long-running work; either one alone leaves a gap.

### Why does my long-running Celery task run twice on Redis?

Your task ran longer than Redis's `visibility_timeout`, which defaults to one hour. Because `acks_late` keeps the message unacknowledged while the job runs, passing the one-hour mark tricks Celery into thinking the worker died, so it hands a second copy to another worker. Set `visibility_timeout` inside `broker_transport_options` well above your longest task runtime, and write your tasks so duplicate runs do not corrupt outputs.

### When should a pipeline stage get its own queue?

Give a stage its own queue whenever it has a bottleneck or resource profile its neighbors do not share—like an external API rate limit, a GPU requirement, or a runtime ten times longer than adjacent steps. If two stages run on the same hardware, fail for the same reasons, and scale together, keeping them on one queue is simpler.

### How do I make a media task safe to retry?

Generate output file paths deterministically from the job ID and stage name instead of using timestamps or random UUIDs, check whether the output already exists in storage before re-running expensive work, and update your database state as the final step of the task. That way, if a retry re-runs the task, it cleanly overwrites the same path and lands in the exact same state.

Building a reliable media pipeline mostly comes down to deciding what happens when jobs get interrupted halfway through. When people talk about video products, they usually focus on model calls, transcoding, and voice synthesis, yet those steps rarely dictate whether the system holds up under load. Clear stage boundaries, careful acknowledgment settings, and a queryable state machine in your database are what keep things running. Once that foundation is solid, swapping out the heavy media steps later becomes straightforward.
