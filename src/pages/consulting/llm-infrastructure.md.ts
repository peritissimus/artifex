import type { APIRoute } from 'astro';
import { infrastructureReview as review } from '../../lib/infrastructure-review';
import { inquiryHref } from '../../lib/consulting';
import { link, markdownDocument, markdownResponse } from '../../lib/markdown';

export const GET: APIRoute = () =>
  markdownResponse(
    markdownDocument({
      title: review.heading,
      description: review.description,
      path: review.path,
      body: [
        review.introduction,
        '## When a review is useful',
        review.fit.map((item) => `- ${item}`).join('\n'),
        `[Discuss an infrastructure problem ↗](${inquiryHref('scalable-ai-infrastructure')})`,
        '## How I approach the work',
        review.steps
          .map((step, index) => `${index + 1}. **${step.title}** ${step.body}`)
          .join('\n'),
        '## What we can scope together',
        review.deliverables.map((item) => `- ${item}`).join('\n'),
        '## Relevant engineering work',
        ...review.evidence.map((item) => `### ${link(item.title, item.path)}\n\n${item.body}`),
        '## Where this work fits',
        review.boundaries,
        '## Start with one concrete problem',
        review.preparation,
        `[Email me about LLM infrastructure ↗](${inquiryHref('scalable-ai-infrastructure')})`,
        'This opens a draft in your email app. Nothing is submitted through the website.',
        `For other projects or engineering roles, ${link('get in touch', '/contact')}.`,
      ],
    })
  );
