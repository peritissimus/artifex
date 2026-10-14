import type { APIRoute } from 'astro';
import { CONTACT_EMAIL } from '../lib/schema';
import {
  consultingServices,
  consultingWorkingStyle,
  inquiryDescription,
  inquiryHref,
} from '../lib/consulting';
import { link, markdownDocument, markdownResponse } from '../lib/markdown';

/** Markdown twin of `/contact` — keep in step with `contact.astro`. */
export const GET: APIRoute = () =>
  markdownResponse(
    markdownDocument({
      title: 'Contact',
      description:
        'Discuss an applied AI engineering, infrastructure, or distributed systems project with Kushal Patankar. Consulting inquiries and engineering conversations welcome.',
      path: '/contact',
      body: [
        'Have a product to build or a system to untangle? I’m open to focused consulting conversations in applied AI engineering, scalable AI infrastructure, and distributed systems.',
        `Currently building at ${link('Zoca', '/work/zoca')}. We can discuss scope and availability once the problem is clear. Founding and staff engineering conversations are welcome too.`,
        '## Working together',
        consultingWorkingStyle,
        ...consultingServices.map((service) =>
          [
            `### ${service.name}`,
            service.summary,
            service.introduction,
            `#### ${service.question}`,
            ...service.problems.map((problem) => `##### ${problem.title}\n\n${problem.detail}`),
            '#### How I approach the work',
            ...service.approach.map(
              (step, index) => `##### ${index + 1}. ${step.title}\n\n${step.detail}`
            ),
            '#### What we can scope together',
            service.deliverables.map((item) => `- ${item}`).join('\n'),
            service.scope,
            '#### Relevant engineering work',
            ...service.evidence.map(
              (item) => `##### ${link(`${item.title} ↗`, item.path)}\n\n${item.detail}`
            ),
            '#### A few practical questions',
            ...service.questions.map((item) => `##### ${item.question}\n\n${item.answer}`),
            `[Email me about ${service.name.toLowerCase()} ↗](${inquiryHref(service.slug)})`,
          ].join('\n\n')
        ),
        '## Tell me about the project.',
        inquiryDescription,
        'What would you like to discuss?',
        `[Email me about a project ↗](${inquiryHref()})`,
        ...consultingServices.map((service) => `- [${service.name}](${inquiryHref(service.slug)})`),
        'This opens a draft in your email app. Nothing is submitted through the website.',
        [
          `- Email: [${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL})`,
          `- Résumé: ${link('Experience, skills, and background', '/resume')}`,
          '- GitHub: [github.com/peritissimus](https://github.com/peritissimus)',
          '- Twitter: [@peritissimus_](https://twitter.com/peritissimus_)',
          '- LinkedIn: [linkedin.com/in/peritissimus](https://linkedin.com/in/peritissimus)',
        ].join('\n'),
      ],
    })
  );
