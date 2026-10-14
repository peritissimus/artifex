import type { APIRoute } from 'astro';
import { CONTACT_EMAIL } from '../lib/schema';
import { consultingServices, inquiryDescription, inquiryHref } from '../lib/consulting';
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
        `Currently building at ${link('Zoca', '/work/zoca')}. We can discuss scope and availability once the problem is clear. You can read about ${link('working together', '/consulting')}; founding and staff engineering conversations are welcome too.`,
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
