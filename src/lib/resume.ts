/**
 * Résumé data — the single source for both `/about` and `/resume`.
 *
 * The two pages present the same history differently: `/about` reads as prose
 * for someone browsing, `/resume` is dense and print-ready for someone who
 * needs a document to forward. Keeping one array behind both means a new role
 * is added once.
 */

export interface Role {
  company: string;
  role: string;
  date: string;
  location: string;
  /** Internal case-study route, when one exists. */
  link?: string;
  /** Shown on /resume only — /about keeps the timeline uncluttered. */
  highlights?: string[];
  /** Kept in the /about timeline but left off the résumé, which stays current. */
  omitFromResume?: boolean;
}

export const roles: Role[] = [
  {
    company: 'Zoca',
    role: 'Founding Engineer',
    date: 'Nov 2024 — Present',
    location: 'Phoenix, Arizona (On-site)',
    link: '/work/zoca',
    highlights: [
      'Built automated social content generation powering 1,000+ local businesses.',
      'Migrated infrastructure to Terraform, cutting deploys from 1.5 minutes to 1–4 seconds.',
      'Introduced a message queue and worker architecture that unblocked independent feature deploys.',
      'Led the TypeScript migration across the codebase and set the code review standards.',
    ],
  },
  {
    company: 'Deepmynd Innovative Technologies',
    role: 'Co-Founder',
    date: 'May 2024 — Present',
    location: 'India',
    highlights: ['Building next-generation AI products for Indian consumers.'],
  },
  {
    company: 'Brihaspati AI',
    role: 'Co-Founder',
    date: 'May 2024 — Nov 2024',
    location: 'On-site',
    link: '/work/brihaspati',
    highlights: [
      'Implemented dynamic prompt engineering and context-aware memory retrieval, improving D7 retention by 20%.',
    ],
  },
  {
    company: 'Dübverse',
    role: 'Founding Engineer',
    date: 'Dec 2021 — Apr 2024',
    location: 'Gurugram, India (On-site)',
    link: '/work/dubverse',
    highlights: [
      'Architected an enterprise AI video dubbing platform processing 570,000+ hours of audio-video for 1M+ users.',
      'Shipped 6,000+ production commits across eight codebases, supporting 40%+ B2B growth.',
    ],
  },
  {
    company: 'SimpleSounds',
    role: 'Co-Founder',
    date: 'Feb 2021 — Dec 2021',
    location: 'Bengaluru, India (Remote)',
    link: '/work/simplesounds',
  },
  {
    company: 'CatrovaCer',
    role: 'Co-Founder & CTO',
    date: 'Jan 2020 — Jan 2021',
    location: 'Greater Chicago Area (Remote)',
  },
  {
    company: 'Technology Literary Society, IIT Kharagpur',
    role: 'Governor',
    date: 'Jul 2019 — Aug 2020',
    location: 'Kharagpur, India',
    omitFromResume: true,
  },
];

/** Roles for the résumé — professional history only. */
export const resumeRoles = roles.filter((role) => !role.omitFromResume);

export const education = {
  institution: 'Indian Institute of Technology Kharagpur',
  degree: 'B.Tech',
  date: '2021',
};

export const skills: Array<{ label: string; items: string }> = [
  { label: 'Languages', items: 'TypeScript, Python, Swift, Go, SQL' },
  { label: 'Backend', items: 'NestJS, FastAPI, Celery, Redis, PostgreSQL, message queues' },
  { label: 'Frontend', items: 'React, Next.js, Astro, SvelteKit, Three.js' },
  { label: 'Infrastructure', items: 'AWS, Terraform, Docker, LocalStack, CI/CD pipelines' },
  { label: 'Applied AI', items: 'LLM integration, prompt engineering, RAG, embeddings, Whisper' },
];

/** Headline numbers, reused by /about and /resume. */
export const metrics: Array<{ value: string; label: string }> = [
  { value: '6+', label: 'Years building production systems' },
  { value: '570K+', label: 'Hours of audio-video processed' },
  { value: '1M+', label: 'Users reached through AI products' },
];
