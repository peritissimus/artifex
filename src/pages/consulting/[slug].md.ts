import type { APIRoute, GetStaticPaths } from 'astro';
import {
  consultingServices,
  inquiryDescription,
  inquiryHref,
  inquiryTitle,
  servicePath,
  type ConsultingService,
} from '../../lib/consulting';
import { link, markdownDocument, markdownResponse } from '../../lib/markdown';

export const getStaticPaths = (() =>
  consultingServices.map((service) => ({
    params: { slug: service.slug },
    props: { service },
  }))) satisfies GetStaticPaths;
export const GET: APIRoute<{ service: ConsultingService }> = ({ props: { service } }) =>
  markdownResponse(
    markdownDocument({
      title: service.title,
      description: service.description,
      path: servicePath(service),
      body: [
        link('← Consulting', '/consulting'),
        service.summary,
        service.introduction,
        `[Email me about your system ↗](${inquiryHref(service.slug)})`,
        `[Read the relevant work ↓](https://peritissimus.com${servicePath(service)}#relevant-work)`,
        `## ${service.question}`,
        service.problems.map((item) => `### ${item.title}\n\n${item.detail}`).join('\n\n'),
        '## How I approach the work',
        service.approach
          .map((item, index) => `### ${index + 1}. ${item.title}\n\n${item.detail}`)
          .join('\n\n'),
        '## What we can scope together',
        service.deliverables.map((item) => `- ${item}`).join('\n'),
        service.scope,
        '## Relevant engineering work',
        service.evidence
          .map((item) => `### ${link(`${item.title} ↗`, item.path)}\n\n${item.detail}`)
          .join('\n\n'),
        '## A few practical questions',
        service.questions.map((item) => `### ${item.question}\n\n${item.answer}`).join('\n\n'),
        '## A different starting point?',
        consultingServices
          .filter((item) => item.slug !== service.slug)
          .map((item) => `- ${link(`${item.name} consulting →`, servicePath(item))}`)
          .join('\n'),
        `## ${inquiryTitle}`,
        inquiryDescription,
        `[Email me about a project ↗](${inquiryHref(service.slug)})`,
        link('Other ways to get in touch →', `/contact?service=${service.slug}`),
      ],
    })
  );
