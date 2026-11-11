---
title: "Scaling LLM Applications: Context, Queues, and the Cost of Personalization"
date: 2025-01-15
updated: 2026-11-12
author: Kushal Patankar
category: AI/LLM
tags: [LLM, Production, Architecture, Context, Message Queues]
description: What 100K+ daily requests and AI workflows for 1,000+ businesses taught me about context selection, asynchronous execution, cost, and quality.
readTime: 11 min read
---

At 100K+ requests per day, our hardest LLM failures rarely looked like model problems. They look like missing context, duplicate jobs, climbing queue latency, and prompts whose cost grows much faster than their usefulness.

At [Brihaspati](/work/brihaspati), context-aware personalization helped lift D7 retention by 20%. At [Zoca](/work/zoca), our AI content and website-generation systems grew to serve more than 1,000 businesses. Those products had different users and stacks, but they taught me the same lesson: an LLM application scales when the model call is treated as one bounded step inside a larger system.

## Scaling an LLM application means controlling everything around the model

Model throughput is only one constraint. A production system also has to decide what context goes into a request, when work should move out of the request-response cycle, how retries avoid creating duplicate output, and how to judge quality once a response comes back.

When I say LLM application infrastructure, I mean the services wrapped around inference: APIs, retrieval, queues, workers, job state, and monitoring. Everything in this post lives at that layer. Hosting model weights, scheduling GPU fleets, and training models bring a different set of capacity and hardware problems, even when they power the same product.

To keep that application layer predictable, I break the design down into four competing budgets:

1. **Context budget:** how much relevant information the model receives.
2. **Latency budget:** how long the user can reasonably wait.
3. **Cost budget:** how many tokens and model calls the feature can spend.
4. **Quality budget:** how much uncertainty or inconsistency the workflow can tolerate.

Pushing on one budget usually squeezes another. Adding context can improve relevance, but it drives up latency and cost. Routing to a larger model helps with hard edge cases, yet it makes retries expensive. Caching aggressively cuts spend, at the risk of serving stale or badly personalized answers. Good architecture forces these trade-offs out into the open instead of letting them happen by accident.

## More context is not the same as better context

The first version of an LLM feature often sends everything available: full conversation history, user profile data, reference documents, and several paragraphs of instructions. That works fine in a demo when the history is short.

That gets harder to sustain as the history grows. Prompts get expensive, key facts get buried in the middle, and older details start contradicting what the user is asking for right now.

A healthier context pipeline separates inputs into three distinct buckets:

- **Immediate context:** the current request and the exact state needed to answer it.
- **Working memory:** recent turns that keep the interaction coherent.
- **Retrieved memory:** older facts pulled in specifically because they matter to the current task.

Pulling that third bucket together is a ranking problem, not just a database query. Vector similarity is useful for finding related text, but similarity alone cannot tell you whether a fact is current, trustworthy, or relevant to the task at hand. Recency, source authority, user scope, and domain rules all belong in the ranking logic.

At Brihaspati, pairing dynamic prompts with context-aware memory retrieval made personalization good enough to move retention. What mattered wasn't storing more memory—it was filtering down to a small set of relevant memories for each generation.

## Long-running generations should not own an HTTP request

An open HTTP request is a fragile place to run work that depends on an external model provider, a retrieval step, third-party data, and post-processing. Any one of those steps can stall or fail.

On paper, keeping it synchronous looks straightforward:

```text
client -> API -> retrieve context -> call model -> save output -> response
```

In practice, the failure modes get messy fast. Your API gateway can time out while the model is still generating tokens upstream. Seeing a timeout, the client retries and kicks off a second generation. Then the first call finally finishes, and suddenly you have two valid outputs racing to overwrite the same database record.

At Zoca, putting AI workflows behind a message queue and background workers cleanly separated user-facing HTTP traffic from the actual generation work:

```text
                         +-------------------+
client -> NestJS API ->  |   message queue   | -> worker -> LLM provider
            |            +-------------------+      |
            |                                       |
            +---------- job status <---------- durable job store
```

Now the API just creates a job record and returns an ID. A worker owns the generation lifecycle from start to finish, while the client polls or subscribes to status updates.

This adds moving parts, but it gives the system a place to enforce rules that are awkward to manage inside a long HTTP request:

- Idempotency keys stop duplicate runs before they hit the provider.
- Retry policies can separate transient provider hiccups from bad inputs that will never succeed.
- Queue age surfaces capacity bottlenecks before users start complaining.
- Durable job state makes it possible to cancel or recover in-flight work.
- Deployments can cycle web servers without dropping long-running HTTP connections.

A queue doesn't make the model generate tokens any faster. It just makes slow, unreliable work manageable.

For the same problem in a different workload, my post on the [Celery and Redis media pipeline](/blog/celery-redis-media-pipeline) digs into what acknowledgment settings and message redelivery actually mean for long-running jobs.

## Prompts need versions, schemas, and token budgets

The code around a model call needs discoverable rules too. In [frameworks for AI coding](/blog/frameworks-for-ai-coding), I use an administrator-only export to ask how an agent finds the permissions an ordinary change must preserve.

A prompt change can cause a regression just as a code change can. If prompts have no version, it is hard to connect a drop in output quality to the sentence that changed.

In production, every prompt should come with a clear contract:

- An explicit version saved alongside every generated result.
- A defined input contract.
- A machine-readable output schema whenever downstream code expects structured data.
- Token budgets for instructions, retrieved context, and completion length.
- A fallback path for when output parsing or validation fails.

Instead of concatenating raw strings across controllers and background jobs, dynamic prompting should assemble well-defined components in one place. Your prompt builder can pick a template, slot in retrieved context, apply user preferences, and log the exact inputs used for that run.

Treating prompts as versioned contracts also makes model upgrades much less stressful. When inputs and output schemas stay fixed, a routing layer can send routine tasks to a smaller model and reserve a larger one for harder requests.

## Cache inputs and intermediate work before caching personalized answers

Model calls often dominate cost, which makes caching their answers tempting. The difficulty is knowing when an answer is safe to reuse.

Two prompts that look nearly identical might belong to different tenants, operate under different permission scopes, or rely on underlying records updated five minutes ago. Get the cache key slightly too broad, and a cost optimization quietly turns into a data leak.

Earlier stages are often safer places to cache:

- Normalized source documents.
- Scraped and cleaned business data.
- Embeddings for content that hasn't changed.
- Short-lived retrieval results.
- Deterministic data transformations and validation checks.

If you do cache final completions, the cache key needs to include every input that affects the answer: prompt version, model ID, user or tenant scope, and source-data version. As a rule of thumb, the more tailored an output is to a specific user, the less likely a shared response cache is to fit.

## Measure user value separately from system health

Dashboards full of token counts and latency percentiles tell you whether your infrastructure is running smoothly. They tell you nothing about whether the generated text actually helped the user.

At Brihaspati, the metric that mattered was D7 retention, not raw generation volume. At Zoca, the real test is whether a business owner can publish generated content or a website update with little correction.

Because infrastructure health and product usefulness can move in opposite directions, I track them separately.

**System metrics**

- Queue age and total job duration.
- p50 and p95 model latency.
- Token usage and cost per completed job.
- Retry, timeout, and schema parse-failure rates.
- Context size broken down by prompt version.

**Product metrics**

- Output acceptance rate or user edit distance.
- Wall-clock time from user request to usable output.
- Repeat usage after the first generation.
- Common patterns in manual user edits.
- Retention among users receiving personalized output.

A prompt change can reduce latency and still make the output less useful. A more expensive model may be worth using if it saves enough correction. Looking at system and product metrics together lets you judge that trade-off.

## Establish a cost, latency, and quality baseline before optimizing

Before swapping in a cheaper model or building a new caching layer, I would lock down a versioned evaluation set of representative tasks and define upfront what counts as an acceptable result. In a content-generation pipeline, "acceptable" might require accurate business details, valid structured output, and copy a customer can publish with minimal editing. The comparison below is a proposed measurement plan, not another measured result from these products.

| Measure | What to record for the same set of tasks |
| --- | --- |
| Cost per accepted result | Model charges plus allocated retrieval and worker costs, including failed attempts and retries, divided by the number of accepted results. State how shared infrastructure costs were allocated. |
| End-to-end latency | p50 and p95 time from accepting a request to usable output. Record queue wait and provider time separately so moving work into a queue does not hide the user's wait. |
| Quality | Accepted results divided by attempted tasks, using the same acceptance rule. Keep failure categories such as wrong business facts, invalid output, and corrections needed. |

Don't filter out failed, timed-out, or cancelled jobs when compiling these numbers. Report failure rates right alongside completed-job latency so a flaky optimization doesn't look artificially fast. And if zero outputs pass your acceptance bar on a test run, the cost per accepted result is undefined—not zero.

For every benchmark run, log the exact model ID, prompt version, source-data snapshot, token counts, concurrency level, cache state, and the pricing table used at that date. Run multiple trials per task to capture generation variance, and always include the sample size. If production payloads contain sensitive customer data, run replays against redacted or synthetic inputs instead.

Once that baseline is recorded, change one variable at a time—like retrieval ranking or model routing—and re-run the exact same task set. When testing a cache, split hit and miss metrics rather than blending them together. I would only count an experiment as a win if it holds the quality bar while cutting either real cost or user-facing wait time. Lowering your token bill isn't an optimization if users end up fixing the output by hand.

## The approaches that stop working first

Plenty of shortcuts make total sense when you are shipping an MVP, then turn painful once traffic picks up:

### Sending the full conversation every time

Appending every message preserves continuity early on, right up until threads get long, contradictory, and expensive to process. Combining working memory with targeted retrieval gives your application a controlled way to forget.

### Running generation inside the API process

Skipping a queue keeps your initial setup simple, but it ties web worker capacity directly to third-party model latency and turns client retries into a race-condition factory.

### Using the largest model for every request

Sending everything to a frontier model spares you from building routing logic, at the cost of paying top dollar for routine tasks. Start with the smallest model that clears your quality bar, and escalate only the requests that fall short or need heavier reasoning.

### Treating provider failure as the only failure

A successful model response can still contain invalid JSON, outdated context, unsupported claims, or text the user has to rewrite. Schema validation and downstream user signals belong right inside your definition of job success.

## A practical production checklist

Before ramping up traffic on any LLM feature, I want concrete answers to eight questions:

1. Can the same request safely run twice?
2. Can a user cleanly cancel or resume an in-flight job?
3. Which data sources are allowed into the prompt, and how are they ranked?
4. Can we trace every saved output back to its exact prompt version, model, and source-data state?
5. What happens step by step when the provider times out or returns malformed output?
6. Which metric tells us users got value, rather than just telling us the model ran?
7. What is our ceiling on total cost per useful result?
8. Can we swap out the underlying model or queue broker without rewriting product logic?

If those answers only exist in one engineer's head, the feature isn't ready for real load.

## Where this architecture still breaks down

Queues and retrieval bring their own work. You have to plan worker capacity, migrate job schemas when they change, and watch for retrieval quality drifting as the knowledge base changes.

The 20% D7 retention improvement at Brihaspati does not prove that memory retrieval alone caused it. Personalization was part of a broader product experience. The number is evidence that the system contributed value, rather than a benchmark other context-aware applications should expect to match.

Finally, model capabilities and API pricing move fast. Wrapping provider SDKs behind clean internal interfaces helps, but abstractions only go so far. Different models read instructions, formatting rules, and retrieved context differently—meaning a model swap still demands a fresh evaluation pass, even if your code barely changes.

## Frequently asked questions about scaling LLM applications

### When should an LLM call move to a background worker?

Move it out of the request cycle whenever generation might blow past your normal API timeout budget, requires automated retries, stitches together multiple external calls, or needs to survive a server deploy. Keep calls synchronous only for quick, low-latency turns where the user is actively waiting on screen and an occasional duplicate run won't hurt anything.

### How much conversation history should an LLM receive?

There is no magic turn count. Pass the last few turns verbatim so the conversation flows naturally, summarize older session state if needed, and rely on retrieval to pull in specific older facts relevant to the current prompt. Then test whether each slice of context actually improves completions instead of assuming more is better.

### Should every LLM application use a vector database?

No. Start with the simplest retrieval tool that fits your data shape. Standard full-text search, structured filters, and recent records may be enough. Reach for embeddings and vector search only when users ask questions that keyword matching and relational queries keep missing.

### What is the most important production metric?

Cost per useful result tells you much more than raw cost per API call. First, anchor "useful" to a concrete product signal—like user acceptance, low edit distance, task completion, or repeat usage—and then divide your total infrastructure and token spend by the outputs that actually clear that bar.

The model call gets most of the attention when you build an LLM feature, yet it is rarely what decides whether the system holds up under real traffic. Context ranking, durable job ownership, prompt contracts, and measurement carry that weight. Put those boundaries in place early, and you can upgrade or swap models later without tearing up the rest of your application.
