---
title: ReelServer
company: ReelServer
kind: personal
role: Systems Engineer
description: A distributed Python service for reliable Reel downloads with workers, retries, and rate limiting.
dateRange: '2026'
sortDate: 2026-01-17
location: Private project
order: 109
technologies: [Python, Celery, Redis, Docker, SQLAlchemy, Turso, instagrapi]
achievements:
  - '**Distributed processing** — Uses Celery workers and Redis to queue, retry, and monitor parallel download jobs'
  - '**Failure-aware automation** — Handles session expiry, challenges, rate limits, proxy configuration, and exponential backoff'
  - '**Clean boundaries** — Separates domain entities, application use cases, infrastructure adapters, and presentation clients'
outcome: 'ReelServer turned a fragile one-off downloader into a durable background system with explicit operational limits and observable job state.'
---

ReelServer is a private systems experiment in making social-media downloads behave like production work rather than a brittle script. Jobs can be submitted individually or in batches, processed by distributed workers, and inspected asynchronously.

Its central concern is failure. Sessions expire, requests are throttled, accounts are challenged, and network identities change. ReelServer models those conditions directly through persistent sessions, randomized pacing, retry policies, proxy support, and structured job records.

The implementation follows clean-architecture boundaries so the Instagram client, database, task queue, and command-line interface can evolve independently. Docker Compose brings the workers, Redis broker, and monitoring dashboard up as one local stack.
