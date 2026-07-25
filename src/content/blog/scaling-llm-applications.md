---
title: "Scaling LLM Applications: Context, Queues, and the Cost of Personalization"
date: 2025-01-15
author: Kushal Patankar
category: AI/LLM
tags: [LLM, Production, Architecture, Context, Message Queues]
description: What 100K+ daily requests and AI workflows for 1,000+ businesses taught me about context selection, asynchronous execution, cost, and quality.
readTime: 9 min read
---

At 100K+ requests per day, our hardest LLM failures rarely looked like model failures. They looked like missing context, duplicate jobs, growing queue latency, and prompts whose cost increased faster than their usefulness.

At [Brihaspati](/work/brihaspati), context-aware personalization helped improve D7 retention by 20%. At [Zoca](/work/zoca), AI content and website-generation systems grew to serve more than 1,000 businesses. Those products had different users and stacks, but they taught me the same lesson: an LLM application scales when the model call becomes one bounded step in a larger system.

## Scaling an LLM application means controlling everything around the model

Model throughput is only one constraint. A production system must also decide which context belongs in a request, when work should leave the request-response cycle, how retries avoid duplicate output, and what quality means after the response arrives.

I now think about four separate budgets:

1. **Context budget:** how much relevant information the model receives.
2. **Latency budget:** how long the user can reasonably wait.
3. **Cost budget:** how many tokens and model calls the feature can spend.
4. **Quality budget:** how much uncertainty or inconsistency the workflow can tolerate.

These budgets compete. More context can improve relevance but increase latency and cost. A larger model can handle difficult cases but makes retries expensive. Aggressive caching reduces spend but can return stale or incorrectly personalized output.

The architecture has to make those trade-offs explicit.

## More context is not the same as better context

The first version of an LLM feature often sends everything available: conversation history, profile data, documents, and several paragraphs of instructions. This works in a demo because the history is short.

It degrades in production. The prompt becomes expensive, important facts get buried, and old details conflict with the current request.

A better context pipeline separates three kinds of information:

- **Immediate context:** the current request and the state needed to answer it.
- **Working memory:** recent interactions that preserve continuity.
- **Retrieved memory:** older facts selected because they are relevant now.

Retrieval is a ranking problem, not a database feature. Semantic similarity helps find related material, but similarity alone does not tell you whether a fact is current, trustworthy, or useful for this task. Recency, source, user scope, and domain rules belong in the ranking decision too.

At Brihaspati, dynamic prompts and context-aware memory retrieval made personalization useful enough to affect retention. The important part was not storing more memory. It was selecting a small set of relevant memories for each generation.

## Long-running generations should not own an HTTP request

An API request is a poor container for work that depends on a model provider, retrieval, external data, and post-processing. Any one of those steps can slow down or fail.

The synchronous version looks simple:

```text
client -> API -> retrieve context -> call model -> save output -> response
```

The failure modes are less simple. A gateway can time out while the model keeps running. The client retries, creating a second generation. The first generation eventually completes, and now two valid outputs compete for the same record.

At Zoca, moving AI workflows behind a message queue and workers separated user-facing requests from generation work:

```text
                         +-------------------+
client -> NestJS API ->  |   message queue   | -> worker -> LLM provider
            |            +-------------------+      |
            |                                       |
            +---------- job status <---------- durable job store
```

The API creates a job and returns its identifier. A worker owns the generation lifecycle. The client polls or subscribes to status changes.

This adds machinery, but it gives the system a place to enforce the rules that matter:

- An idempotency key prevents duplicate work.
- Retry limits distinguish temporary provider errors from bad inputs.
- Queue age exposes capacity problems before users report them.
- Job state makes cancellation and recovery possible.
- Deployments no longer need to keep long HTTP requests alive.

The queue does not make generation faster. It makes slow and unreliable work manageable.

## Prompts need versions, schemas, and token budgets

Prompts behave like code but often receive less discipline. A sentence changes, output quality shifts, and nobody can connect the regression to a deployed version.

Production prompts should have:

- A version stored with every generated result.
- A defined input contract.
- A machine-readable output schema where the workflow needs structured data.
- A token budget for instructions, retrieved context, and output.
- A fallback path when parsing or validation fails.

Dynamic prompting should assemble known components rather than concatenate arbitrary strings. The system can choose a template, retrieve context, apply user preferences, and record the final prompt inputs without scattering prompt logic across controllers and background tasks.

This also makes model changes safer. If the prompt contract stays stable, a routing layer can send ordinary work to a smaller model and reserve a larger model for requests that need it.

## Cache inputs and intermediate work before caching personalized answers

Caching an LLM response is tempting because model calls dominate cost. It is also easy to get wrong.

Two prompts that look similar can belong to different users, contain different permissions, or depend on data that changed five minutes ago. A broad cache key can turn a cost optimization into a privacy bug.

The safer targets are often earlier in the pipeline:

- Normalized source documents.
- Scraped and cleaned business data.
- Embeddings for unchanged content.
- Retrieval results with a short lifetime.
- Deterministic transformations and validation.

If the final response is cacheable, its key should include every input that affects the answer, including prompt version, model, user scope, and source-data version. The more personalized the output, the less likely a shared response cache is the right tool.

## Measure user value separately from system health

Token usage and latency tell you whether the system is operating efficiently. They do not tell you whether the generated result helped anyone.

At Brihaspati, the useful product signal was D7 retention, not the number of generations. At Zoca, the test is whether a business can use the generated content or website change with little correction.

I track the two groups separately.

**System metrics**

- Queue age and job duration.
- p50 and p95 model latency.
- Tokens and cost per completed job.
- Retry, timeout, and parse-failure rates.
- Context size by prompt version.

**Product metrics**

- Acceptance or edit rate.
- Time from request to usable output.
- Repeat usage after the first generation.
- User correction patterns.
- Retention for users who receive personalized output.

A prompt can reduce latency while making the product worse. A more expensive model can be justified if it reduces rework. You need both sets of metrics to see the trade.

## The approaches that stop working first

Several choices are reasonable at small scale and expensive later:

### Sending the full conversation every time

It preserves continuity until the history becomes large, contradictory, and costly. Working memory plus retrieval gives the system a deliberate forgetting mechanism.

### Running generation inside the API process

It avoids queue infrastructure but couples provider latency to web capacity and makes retries hard to reason about.

### Using the largest model for every request

It simplifies routing but spends the highest price on ordinary work. Start with the smallest model that meets the quality threshold, then escalate difficult cases.

### Treating provider failure as the only failure

A successful model response can still contain invalid JSON, outdated context, unsupported claims, or content that a user rewrites completely. Validation and product feedback belong in the definition of success.

## A practical production checklist

Before increasing traffic to an LLM feature, I want clear answers to these questions:

1. Can the same request safely run twice?
2. Can a user cancel or resume the work?
3. Which context sources can enter the prompt, and how are they ranked?
4. Is every result traceable to a prompt version, model, and source-data version?
5. What happens when the provider times out or returns invalid output?
6. Which metric represents user value rather than model activity?
7. What is the maximum acceptable cost per useful result?
8. Can we replace the model or queue without rewriting the product workflow?

If those answers live only in an engineer's head, the system is not ready to scale.

## Where this architecture still breaks down

Queues and retrieval do not solve every LLM problem. They introduce their own operational cost. Workers need capacity planning, job schemas need migrations, and retrieval quality can drift as the knowledge base changes.

The 20% retention improvement at Brihaspati also does not prove that memory retrieval alone caused the result. Personalization was part of a broader product experience. The number is evidence that the system contributed value, not a universal benchmark for context-aware applications.

LLM providers and model economics also change quickly. Architecture should isolate provider-specific code, but abstraction has limits. Different models interpret instructions, schemas, and context differently, so switching models still requires evaluation.

## Frequently asked questions about scaling LLM applications

### When should an LLM call move to a background worker?

Move it when the work can exceed your normal API latency budget, needs retries, calls multiple external services, or should survive a deployment. Keep synchronous calls for short interactions where the user needs an immediate response and duplicate execution is harmless.

### How much conversation history should an LLM receive?

There is no useful fixed number. Keep the recent turns needed for coherence, summarize older working context, and retrieve specific long-term memories for the current task. Measure whether each additional context source improves the output.

### Should every LLM application use a vector database?

No. Start with the smallest retrieval system that fits the data. Full-text search, structured filters, and recent records may be enough. Add semantic retrieval when users ask for information that keyword or relational queries consistently miss.

### What is the most important production metric?

Cost per useful result is more informative than cost per model call. Define “useful” through a product signal such as acceptance, low edit distance, task completion, or repeat use, then measure system cost against it.

The model call is the visible part of an LLM feature, but it is rarely the part that determines whether the product survives real traffic. Context selection, job ownership, prompt contracts, and measurement do that work. Build those boundaries early, and the model can change without taking the rest of the product with it.
