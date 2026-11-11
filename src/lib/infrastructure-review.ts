/** One scoped service page; shared copy keeps its HTML and Markdown aligned. */
export const infrastructureReview = {
  path: '/consulting/llm-infrastructure',
  title: 'LLM Infrastructure Consulting — Kushal Patankar',
  heading: 'LLM infrastructure consulting',
  description:
    'A focused review of production LLM applications: queues, retries, latency, observability, and cost, grounded in the work around hosted model APIs.',
  introduction:
    'When an LLM prototype becomes a production workflow, the difficult parts often sit around the model call. Requests time out, queues grow, retries repeat side effects, and cost becomes hard to explain. I help teams trace those problems through their application and decide what to change first.',
  fit: [
    'Your API waits on long generations, and users cannot tell whether work is still running.',
    'Adding workers has not reduced queue age or tail latency.',
    'Retries or deployments leave duplicate work, stalled jobs, or inconsistent product state.',
    'Model spend is increasing, but you cannot connect it to completed, useful output.',
  ],
  steps: [
    {
      title: 'Follow one real workflow.',
      body: 'Start with a sanitized job trace or a reproducible failure. Map the request, context retrieval, model provider, workers, persistence, and user-visible result. Identify where time, cost, and ownership become unclear.',
    },
    {
      title: 'Establish the baseline.',
      body: 'Agree on the outcome that matters: a reliable completion, a latency target, or a cost per useful job. Inspect representative traffic and failure cases before recommending more workers, a different model, or another database.',
    },
    {
      title: 'Choose a bounded change.',
      body: 'The result may be an architecture review, a focused implementation, or a failure investigation. We agree on scope and acceptance criteria before implementation, then check the change against the original failure and normal traffic.',
    },
  ],
  deliverables: [
    'A workflow map showing job ownership, dependencies, and failure boundaries.',
    'A baseline for the available latency, failure, throughput, and cost signals, including gaps in measurement.',
    'Prioritized findings with the evidence behind each recommendation.',
    'Acceptance criteria and a practical implementation or handover plan for the agreed next change.',
  ],
  evidence: [
    {
      title: 'Scaling LLM applications: context, queues, and cost',
      path: '/blog/scaling-llm-applications',
      body: 'The engineering around context selection, asynchronous work, prompt contracts, and measuring useful completions.',
    },
    {
      title: 'Celery and Redis media processing',
      path: '/blog/celery-redis-media-pipeline',
      body: 'How stage isolation, explicit job state, and safe retries shaped a long-running media pipeline.',
    },
    {
      title: 'Application infrastructure at Zoca',
      path: '/work/zoca',
      body: 'Published work experience with AI content and website workflows, message queues, workers, and infrastructure automation.',
    },
  ],
  boundaries:
    'My focus is application infrastructure using existing hosted models: TypeScript and Python services, queues, databases, deployment, and operational signals. This offer does not cover foundation-model training or GPU-fleet operations. Published employment examples describe my engineering experience; they are not consulting-client testimonials. Any savings or performance improvement must be measured against your workload.',
  preparation:
    'Send a short description of the product, your stack, the symptom, and one sanitized example. Include the current target and what you have tried. We can discuss availability, scope, and fees once the problem is clear. Please leave out credentials and confidential customer data.',
  contactLabel: 'Read about a focused LLM infrastructure review',
};
