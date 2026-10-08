import type { APIRoute } from 'astro';
import { resumeRoles, education, skills } from '../lib/resume';
import { CONTACT_EMAIL } from '../lib/schema';
import { link, markdownDocument, markdownResponse } from '../lib/markdown';

/** Markdown twin of `/resume` — keep in step with `resume.astro`. */
export const GET: APIRoute = () =>
  markdownResponse(
    markdownDocument({
      title: 'Résumé — Kushal Patankar',
      description:
        'Résumé of Kushal Patankar — founding engineer and system architect. Six years building AI products, distributed backends, and the infrastructure under them.',
      path: '/resume',
      body: [
        '**Kushal Patankar** — Founding Engineer & System Architect',
        [
          `[${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL})`,
          '[peritissimus.com](https://peritissimus.com)',
          '[github.com/peritissimus](https://github.com/peritissimus)',
          '[linkedin.com/in/peritissimus](https://linkedin.com/in/peritissimus)',
        ].join(' · '),
        '## Experience',
        ...resumeRoles.map((role) =>
          [
            `### ${role.link ? link(role.company, role.link) : role.company} — ${role.role}`,
            `${role.date} · ${role.location}`,
            role.highlights?.length
              ? `\n${role.highlights.map((highlight) => `- ${highlight}`).join('\n')}`
              : '',
          ].join('\n')
        ),
        '## Skills',
        skills.map((skill) => `- **${skill.label}:** ${skill.items}`).join('\n'),
        '## Education',
        `**${education.institution}** — ${education.degree}, ${education.date}`,
      ],
    })
  );
