import type { APIRoute } from 'astro';
import { roles, metrics } from '../lib/resume';
import { link, markdownDocument, markdownResponse } from '../lib/markdown';

/** Markdown twin of `/about` — keep the prose in step with `about.astro`. */
export const GET: APIRoute = () =>
  markdownResponse(
    markdownDocument({
      title: 'About Kushal Patankar',
      description:
        'Kushal Patankar (peritissimus) is a founding engineer and system architect with six years building AI products, distributed backends, and the infrastructure under them.',
      path: '/about',
      body: [
        '**Kushal Patankar** (peritissimus) is a founding engineer and full-stack developer with expertise in building scalable AI-powered platforms and infrastructure.',
        'IIT Kharagpur graduate (B.Tech, 2021) with 6+ years of experience spanning founding engineer roles, technical leadership, and entrepreneurship. Specialized in backend architecture, frontend development, infrastructure automation, and AI integration.',
        'Previously co-founded **Deepmynd Innovative Technologies** and **Brihaspati AI**, crafting next-generation products with AI prowess tailored for consumers. At Brihaspati, implemented dynamic prompt engineering and context-aware memory retrieval improving D7 retention by 20%.',
        'As a founding member at **Dübverse**, helped design, architect, develop and scale an enterprise-grade AI video dubbing platform processing 570,000+ hours of audio-video content for 1M+ users. 6-7000 production git commits across eight codebases, achieving 40%+ B2B growth.',
        '## Highlights',
        metrics.map((metric) => `- **${metric.value}** ${metric.label}`).join('\n'),
        '## Work experience',
        roles
          .map((job) => {
            const company = job.link ? link(job.company, job.link) : job.company;
            return `- **${company}** — ${job.role}, ${job.date}, ${job.location}`;
          })
          .join('\n'),
        `More: ${link('Résumé', '/resume')} · ${link('Contact', '/contact')}`,
      ],
    })
  );
