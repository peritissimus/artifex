import { CONTACT_EMAIL } from './schema';

export interface ConsultingService {
  slug: string;
  name: string;
  title: string;
  description: string;
  summary: string;
  introduction: string;
  question: string;
  problems: Array<{ title: string; detail: string }>;
  approach: Array<{ title: string; detail: string }>;
  deliverables: string[];
  scope: string;
  evidence: Array<{ title: string; path: string; detail: string }>;
  questions: Array<{ question: string; answer: string }>;
}

export const consultingWorkingStyle =
  'I like to start with a concrete question: what should the system do, what is it doing instead, and what would make the difference measurable? From there, we can agree on a small, useful piece of work—an architecture review, an implementation, or a focused investigation.';
export const inquiryDescription =
  'A few sentences about the product, the constraint you’re running into, and the kind of help you need are enough to start. Include your stack and timeline if you know them. Please leave out credentials and confidential customer data.';

// Work areas live in Contact, not separate landing pages. Shared data keeps
// the expandable HTML sections, Markdown copy, and inquiry topics aligned.
export const consultingServices: ConsultingService[] = [
  {
    slug: 'applied-ai-engineering',
    name: 'Applied AI engineering',
    title: 'Applied AI Engineering Consulting',
    description:
      'Applied AI engineering consulting for teams moving LLM prototypes into useful products: retrieval, model integration, evaluation, and production workflows.',
    summary: 'Turn a promising AI prototype into a useful, maintainable product.',
    introduction:
      'An AI demo can work beautifully once and still be difficult to ship. I help connect the model to the rest of the product: the data it can use, the actions it can take, the output a user can trust, and the backend that keeps the workflow running.',
    question: 'What needs to work before this becomes a real product?',
    problems: [
      {
        title: 'The prototype works, but the workflow is unfinished.',
        detail:
          'A model response still needs input validation, useful product states, persistence, error handling, and a way for the user to correct or reject it. Those boundaries are part of the feature, not cleanup after the demo.',
      },
      {
        title: 'The answer is only as useful as the context.',
        detail:
          'For retrieval-augmented generation (RAG) and personalization, I look at source quality, relevance, freshness, and user scope before adding more context or another database. Full-text search and structured filters may be enough; semantic retrieval should earn its place.',
      },
      {
        title: 'A prompt or model change is hard to judge.',
        detail:
          'Define a useful result with representative examples, output contracts, and user feedback. For agentic workflows, check the resulting state and tool actions as well as the final answer. Keep quality separate from token usage and latency.',
      },
    ],
    approach: [
      {
        title: 'Understand the task.',
        detail:
          'Map the user’s workflow, available data, and the failure cases that matter. Decide where AI helps and where ordinary code is the better fit.',
      },
      {
        title: 'Build one end-to-end path.',
        detail:
          'Connect retrieval, model calls, validation, and product state around a bounded use case. Keep provider-specific behavior behind explicit interfaces.',
      },
      {
        title: 'Make changes testable.',
        detail:
          'Agree on representative cases and acceptance criteria. Record prompt and model versions, inspect failures, and leave a practical route for iteration and handover.',
      },
    ],
    deliverables: [
      'A scoped product and architecture plan with explicit data boundaries.',
      'An implemented workflow or focused integration in your existing codebase.',
      'Representative evaluation cases and output validation for the agreed task.',
      'Operational notes covering failures, measurement, and the next iteration.',
    ],
    scope:
      'This is application engineering around existing models, not foundation-model training or a promise that every task needs an autonomous agent. The implementation and evaluation scope depend on the product and the evidence available.',
    evidence: [
      {
        title: 'AI content and website workflows at Zoca',
        path: '/work/zoca',
        detail:
          'In my role at Zoca, I built content generation for 1,000+ businesses, config-driven website generation, and queue-backed AI workflows.',
      },
      {
        title: 'Context-aware personalization at Brihaspati',
        path: '/work/brihaspati',
        detail:
          'Dynamic prompting and memory retrieval inside an AI-powered mobile product, with a Django and PostgreSQL backend.',
      },
      {
        title: 'Context, queues, and the cost of personalization',
        path: '/blog/scaling-llm-applications',
        detail:
          'A first-hand account of context selection, prompt contracts, asynchronous execution, and measuring a useful result.',
      },
      {
        title: 'A retrieval system built with SQLite',
        path: '/blog/markdown-notes-sqlite-search-index',
        detail:
          'A practical example of combining full-text and semantic search without starting with a separate vector database.',
      },
    ],
    questions: [
      {
        question: 'Can you work with an existing prototype?',
        answer:
          'Yes. The first step is to understand what already works, what users need, and which missing boundaries prevent a release. A focused integration may be more useful than a rewrite.',
      },
      {
        question: 'Do we need RAG or an AI agent?',
        answer:
          'Not necessarily. Retrieval is useful when relevant information is missing from the model’s context. An agent is useful when the task needs a sequence of actions with clear limits. Neither is a default requirement.',
      },
      {
        question: 'What should I send in an inquiry?',
        answer:
          'Describe the user’s task, what you have built, and one example of where it fails. Share the stack, data constraints, and timeline if available. A sanitized example is more useful than confidential data.',
      },
    ],
  },
  {
    slug: 'scalable-ai-infrastructure',
    name: 'Scalable AI infrastructure',
    title: 'Scalable AI Infrastructure Consulting',
    description:
      'Scalable AI infrastructure consulting for production LLM applications: queues, distributed workers, capacity, observability, and cost-aware architecture.',
    summary:
      'Give an existing AI application room to grow without losing control of cost or latency.',
    introduction:
      'Scaling an AI application is rarely just a matter of calling a faster model. It means deciding who owns a job, how much work can run at once, what happens when a provider slows down, and how cost changes with traffic. I work on those application and infrastructure boundaries.',
    question: 'Where does the system reach its limit?',
    problems: [
      {
        title: 'Long generations are tying up the API.',
        detail:
          'Separate user-facing requests from work that needs to survive timeouts and deployments. Design queue and worker boundaries around durable job state, cancellation, and observable progress.',
      },
      {
        title: 'More workers are not fixing queue latency.',
        detail:
          'Inspect queue age, workload mix, concurrency, provider limits, and slow stages. Separate long-running jobs from interactive work and measure capacity before adding infrastructure.',
      },
      {
        title: 'Cost grows faster than useful output.',
        detail:
          'Measure cost per completed, useful job. Review context budgets, repeated preprocessing, scoped caches, and model routing against a quality baseline rather than optimizing token cost alone.',
      },
      {
        title: 'Deployments and incidents are difficult to explain.',
        detail:
          'Make infrastructure reproducible and connect job identifiers, application errors, and system metrics. Queue age, latency percentiles, and failure rates should point to an operational decision.',
      },
    ],
    approach: [
      {
        title: 'Find the limiting stage.',
        detail:
          'Follow a job through the API, data access, model provider, workers, and persistence. Establish a baseline for throughput, tail latency, failures, and cost.',
      },
      {
        title: 'Change the smallest useful boundary.',
        detail:
          'Agree on a capacity or latency target, then address workload isolation, concurrency, caching, or deployment configuration where the evidence points.',
      },
      {
        title: 'Leave the system operable.',
        detail:
          'Check the change against representative traffic and failure cases. Document operating limits, dashboards, deployment steps, and recovery procedures.',
      },
    ],
    deliverables: [
      'A bottleneck review with measured constraints and a prioritized architecture plan.',
      'Queue, worker, or deployment changes for the agreed workload.',
      'A capacity and cost model with explicit assumptions and quality trade-offs.',
      'Monitoring and operating notes for the team maintaining the system.',
    ],
    scope:
      'My focus is the application infrastructure around AI: TypeScript and Python services, queues, databases, AWS, and Terraform. This page does not offer GPU-fleet management, distributed model training, or a guaranteed performance multiplier.',
    evidence: [
      {
        title: 'Distributed media processing at Dubverse',
        path: '/work/dubverse',
        detail:
          'Celery and Redis processing, AWS scaling, and application monitoring for an AI dubbing product, with a 50% reduction in content-generation time in that workload.',
      },
      {
        title: 'Queue and deployment infrastructure at Zoca',
        path: '/work/zoca',
        detail:
          'Message queues and workers for AI features, Terraform infrastructure, and a local AWS development environment.',
      },
      {
        title: 'Scaling LLM applications',
        path: '/blog/scaling-llm-applications',
        detail:
          'How context, latency, cost, and quality budgets compete—and why a model call needs a bounded place in the wider system.',
      },
      {
        title: 'Celery and Redis pipeline design',
        path: '/blog/celery-redis-media-pipeline',
        detail:
          'Workload separation, worker concurrency, intermediate artifacts, and recovery lessons from long-running media jobs.',
      },
    ],
    questions: [
      {
        question: 'Does scalable AI infrastructure mean running our own models?',
        answer:
          'No. Applications using hosted model APIs still need capacity limits, durable jobs, cost controls, and recovery. Self-hosting is a separate decision that should follow workload and operating requirements.',
      },
      {
        question: 'Can you reduce our LLM costs?',
        answer:
          'A review can identify avoidable work, oversized context, and routing or caching opportunities. Savings depend on your workload and quality requirements; I would establish a baseline before proposing a target.',
      },
      {
        question: 'What information helps with an infrastructure review?',
        answer:
          'Your architecture, typical job duration, traffic pattern, provider limits, and the symptoms you see are a useful start. Sanitized metrics or a representative job trace are enough for an initial discussion.',
      },
    ],
  },
  {
    slug: 'distributed-systems-reliability',
    name: 'Distributed systems reliability',
    title: 'Distributed Systems Reliability Consulting',
    description:
      'Distributed systems reliability consulting for Celery, Redis, and background workflows: safe retries, durable job state, worker recovery, and failure analysis.',
    summary: 'Understand duplicate, stuck, or lost background jobs—and make recovery deliberate.',
    introduction:
      'A background system is easy to trust while every step succeeds. The interesting questions start when a worker exits, a job runs twice, or a provider times out after completing its side effect. I help teams investigate those failure paths and make recovery part of the design.',
    question: 'What happens when this job stops halfway through?',
    problems: [
      {
        title: 'Retries create duplicate work or side effects.',
        detail:
          'Follow the job’s identity across submission, execution, and persistence. Make repeat execution safe with idempotency boundaries and explicit state transitions; a queue cannot guarantee that an external side effect happens only once.',
      },
      {
        title: 'Worker failures leave jobs stuck or invisible.',
        detail:
          'Inspect acknowledgements, visibility timeouts, retry budgets, and ownership of durable state. A worker process is temporary; the record of what a job has done should survive it.',
      },
      {
        title: 'A failed stage restarts an expensive pipeline.',
        detail:
          'Separate stages where intermediate results can be persisted and validated. Resume from a known boundary instead of repeating successful model, transcription, or media work.',
      },
      {
        title: 'Logs do not explain the final outcome.',
        detail:
          'Connect job identifiers, state transitions, attempts, and error classes. Make it possible to tell the difference between slow work, a transient failure, and a job that needs human intervention.',
      },
    ],
    approach: [
      {
        title: 'Reconstruct a failure.',
        detail:
          'Start with one duplicate, stuck, or lost job. Trace its state and side effects through the queue, worker, database, and external service.',
      },
      {
        title: 'Make the failure reproducible.',
        detail:
          'Test the relevant interruption: a timeout, worker exit, repeated submission, or partial success. Agree on what recovery should mean before changing retry settings.',
      },
      {
        title: 'Implement and document recovery.',
        detail:
          'Add the smallest state, idempotency, or pipeline change that addresses the failure. Leave regression checks and a runbook for retrying or reconciling affected jobs.',
      },
    ],
    deliverables: [
      'A failure analysis with a reproducible scenario and explicit job lifecycle.',
      'Targeted retry, idempotency, or durable-state changes.',
      'Regression checks for the agreed interruption and recovery paths.',
      'A recovery runbook and the signals needed to spot recurrence.',
    ],
    scope:
      'This is a focused review of background workflows and their failure modes, not a general security audit or a promise of exactly-once execution. If the primary problem is throughput or operating cost, the infrastructure service is a better starting point.',
    evidence: [
      {
        title: 'Failure-aware Celery and Redis pipelines',
        path: '/blog/celery-redis-media-pipeline',
        detail:
          'First-hand notes on late acknowledgements, visibility timeouts, idempotent stages, and worker-death recovery.',
      },
      {
        title: 'ReelServer’s explicit failure boundaries',
        path: '/work/reelserver',
        detail:
          'A private personal project with observable jobs, bounded retries, and persistent state. The published overview explains the design; the repository is not public.',
      },
      {
        title: 'Distributed processing at Dubverse',
        path: '/work/dubverse',
        detail:
          'Engineering experience with long-running media workloads, Celery workers, Redis, and application monitoring.',
      },
    ],
    questions: [
      {
        question: 'Is this only for AI systems?',
        answer:
          'No. Media processing, data imports, web automation, and scheduled jobs share many of the same recovery problems. The review follows your workload rather than requiring an AI component.',
      },
      {
        question: 'Can a queue give us exactly-once execution?',
        answer:
          'Do not assume it. Retries and lost acknowledgements can repeat work. The important question is whether repeated execution and external side effects are safe at each boundary.',
      },
      {
        question: 'Should we replace Celery or Redis?',
        answer:
          'Not as a first step. Configuration, job ownership, and application state can cause failures independently of the queue technology. Reproduce the failure and establish the required behavior before considering a replacement.',
      },
    ],
  },
];

export function servicePath(service: ConsultingService): string {
  return `/contact#${service.slug}`;
}

export function inquiryHref(slug = 'general'): string {
  const service = consultingServices.find((item) => item.slug === slug);
  const subject = `Consulting inquiry — ${service?.name || 'AI engineering'}`;
  const body = [
    'Hi Kushal,',
    '',
    'What we are building:',
    '',
    'The problem or constraint:',
    '',
    'Current stack:',
    '',
    'Help we are looking for:',
    '',
    'Timeline and budget range (if known):',
    '',
  ].join('\n');
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

const contentServices: Record<string, string[]> = {
  '/blog/scaling-llm-applications': ['applied-ai-engineering', 'scalable-ai-infrastructure'],
  '/blog/celery-redis-media-pipeline': [
    'distributed-systems-reliability',
    'scalable-ai-infrastructure',
  ],
  '/blog/markdown-notes-sqlite-search-index': ['applied-ai-engineering'],
  '/work/zoca': ['applied-ai-engineering', 'scalable-ai-infrastructure'],
  '/work/brihaspati': ['applied-ai-engineering'],
  '/work/dubverse': ['scalable-ai-infrastructure', 'distributed-systems-reliability'],
  '/work/reelserver': ['distributed-systems-reliability'],
};

export function servicesForContent(path: string): ConsultingService[] {
  return (contentServices[path] || [])
    .map((slug) => consultingServices.find((service) => service.slug === slug))
    .filter((service): service is ConsultingService => Boolean(service));
}
