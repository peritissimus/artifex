import type { APIRoute } from 'astro';
import { CONTACT_EMAIL } from '../lib/schema';
import { link, markdownDocument, markdownResponse } from '../lib/markdown';

/** Markdown twin of `/contact` — keep in step with `contact.astro`. */
export const GET: APIRoute = () =>
  markdownResponse(
    markdownDocument({
      title: 'Contact',
      description:
        'Get in touch with Kushal Patankar (peritissimus) — open to founding and staff engineering roles in applied AI and infrastructure. Reach out via email, GitHub, Twitter, or LinkedIn.',
      path: '/contact',
      body: [
        'Interested in collaboration, have a project in mind, or just want to connect? Feel free to reach out through any of the channels below.',
        `Currently building at ${link('Zoca', '/work/zoca')}, and open to conversations about founding and staff engineering roles — particularly in applied AI, distributed backends, and the infrastructure underneath them.`,
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
