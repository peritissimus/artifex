import type { APIRoute } from 'astro';
import {
  consultingDescription,
  consultingIntroduction,
  consultingServices,
  consultingTitle,
  consultingWorkingStyle,
  inquiryDescription,
  inquiryHref,
  inquiryTitle,
  servicePath,
} from '../lib/consulting';
import { link, markdownDocument, markdownResponse } from '../lib/markdown';

export const GET: APIRoute = () =>
  markdownResponse(
    markdownDocument({
      title: 'Thoughtful engineering for AI products.',
      description: consultingDescription,
      path: '/consulting',
      body: [
        `Page title: ${consultingTitle}`,
        consultingIntroduction,
        '[Discuss a project](https://peritissimus.com/consulting#project-inquiry)',
        '## Where I can help',
        consultingServices
          .map((service) => `### ${link(service.name, servicePath(service))}\n\n${service.summary}`)
          .join('\n\n'),
        '## Start with the question.',
        consultingWorkingStyle,
        'I’m currently building at Zoca. We agree scope, availability, and fees before starting.',
        '## Relevant engineering work',
        `My background includes AI content and website workflows at ${link('Zoca', '/work/zoca')}, context-aware personalization at ${link('Brihaspati', '/work/brihaspati')}, and distributed media processing at ${link('Dubverse', '/work/dubverse')}. These examples come from my engineering roles.`,
        `For the reasoning behind those systems, read ${link('Scaling LLM Applications', '/blog/scaling-llm-applications')} and ${link('Building Media Pipelines with Celery and Redis', '/blog/celery-redis-media-pipeline')}. You can also read ${link('about my background', '/about')} or view my ${link('résumé', '/resume')}.`,
        `## ${inquiryTitle}`,
        inquiryDescription,
        `[Email me about a project ↗](${inquiryHref()})`,
        link('Other ways to get in touch →', '/contact?service=general'),
      ],
    })
  );
