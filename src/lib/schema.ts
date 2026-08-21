/**
 * Shared schema.org (JSON-LD) structured-data builders.
 * Passed to the `jsonLd` prop on Base/SEO, which renders them as
 * <script type="application/ld+json"> blocks.
 */

export const SITE_URL = 'https://peritissimus.com';

export const AUTHOR_NAME = 'Kushal Patankar';

/** Contact address, reused by the Person and Organization entities. */
export const CONTACT_EMAIL = '149.kush@gmail.com';

/**
 * Where the practice operates from. Kept to locality/region/country: there is
 * no storefront to visit, and schema.org PostalAddress does not require a
 * street address to be valid.
 */
export const postalAddress: Record<string, unknown> = {
  '@type': 'PostalAddress',
  addressLocality: 'Phoenix',
  addressRegion: 'AZ',
  addressCountry: 'US',
};

/** Canonical Person entity for Kushal Patankar (peritissimus). */
export const personSchema: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: AUTHOR_NAME,
  alternateName: 'peritissimus',
  url: SITE_URL,
  jobTitle: 'Founding Engineer & System Architect',
  description:
    'Founding engineer and system architect building scalable AI products and infrastructure.',
  email: `mailto:${CONTACT_EMAIL}`,
  image: `${SITE_URL}/og/home.png`,
  alumniOf: {
    '@type': 'CollegeOrUniversity',
    name: 'Indian Institute of Technology Kharagpur',
  },
  worksFor: {
    '@type': 'Organization',
    name: 'Zoca',
  },
  // Drives entity-level topical relevance — this is what a recruiter's
  // "<stack> engineer" search has to match against.
  knowsAbout: [
    'Software Architecture',
    'Distributed Systems',
    'Backend Engineering',
    'Applied AI',
    'Large Language Models',
    'AI Infrastructure',
    'TypeScript',
    'Python',
    'Cloud Infrastructure',
    'Infrastructure Automation',
  ],
  sameAs: [
    'https://github.com/peritissimus',
    'https://twitter.com/peritissimus_',
    'https://linkedin.com/in/peritissimus',
  ],
  address: postalAddress,
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'business inquiries',
    email: CONTACT_EMAIL,
    url: `${SITE_URL}/contact`,
    availableLanguage: ['English'],
    areaServed: 'Worldwide',
  },
};

/**
 * Organization entity for the peritissimus practice.
 *
 * Distinct from `personSchema` on purpose: assistants answering "who is this,
 * how do I reach them, are they real" look for an Organization with a
 * `contactPoint` and an `address`, and a bare Person entity does not satisfy
 * that check. `founder` ties the two together so they read as one identity
 * rather than two unrelated entities.
 */
export const organizationSchema: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}#organization`,
  name: 'peritissimus',
  legalName: 'peritissimus',
  alternateName: `${AUTHOR_NAME} — peritissimus`,
  url: SITE_URL,
  logo: `${SITE_URL}/apple-touch-icon.png`,
  image: `${SITE_URL}/og/home.png`,
  email: `mailto:${CONTACT_EMAIL}`,
  description:
    'Independent software practice of Kushal Patankar (peritissimus): founding-engineer work on AI products, distributed backends, and the infrastructure underneath them.',
  founder: {
    '@type': 'Person',
    name: AUTHOR_NAME,
    url: SITE_URL,
  },
  address: postalAddress,
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'business inquiries',
      email: CONTACT_EMAIL,
      url: `${SITE_URL}/contact`,
      availableLanguage: ['English'],
      areaServed: 'Worldwide',
    },
    {
      '@type': 'ContactPoint',
      contactType: 'technical support',
      email: CONTACT_EMAIL,
      url: `${SITE_URL}/.well-known/security.txt`,
      availableLanguage: ['English'],
      areaServed: 'Worldwide',
    },
  ],
  knowsAbout: personSchema.knowsAbout,
  sameAs: personSchema.sameAs,
};

/** WebSite entity, emitted on the homepage. */
export const websiteSchema: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'peritissimus',
  alternateName: AUTHOR_NAME,
  url: SITE_URL,
  inLanguage: 'en',
  publisher: {
    '@type': 'Person',
    name: AUTHOR_NAME,
    url: SITE_URL,
  },
  copyrightHolder: { '@id': `${SITE_URL}#organization` },
};

/** BreadcrumbList for nested routes. Items are ordered root-first. */
export function breadcrumbSchema(
  items: Array<{ name: string; path: string }>
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

function absoluteUrl(pathOrUrl: string): string {
  return pathOrUrl.startsWith('http') ? pathOrUrl : `${SITE_URL}${pathOrUrl}`;
}

export interface BlogPostingInput {
  title: string;
  description: string;
  slug: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  image?: string;
  tags?: string[];
  category?: string;
  wordCount?: number;
}

/** BlogPosting entity for an individual blog post. */
export function blogPostingSchema(post: BlogPostingInput): Record<string, unknown> {
  const url = `${SITE_URL}/blog/${post.slug}`;
  const image = post.image ? absoluteUrl(post.image) : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: post.datePublished,
    dateModified: post.dateModified || post.datePublished,
    inLanguage: 'en',
    ...(image ? { image } : {}),
    ...(post.tags?.length ? { keywords: post.tags.join(', ') } : {}),
    ...(post.category ? { articleSection: post.category } : {}),
    ...(post.wordCount ? { wordCount: post.wordCount } : {}),
    author: {
      '@type': 'Person',
      name: post.author || AUTHOR_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Person',
      name: AUTHOR_NAME,
      url: SITE_URL,
    },
  };
}

/** Blog entity + post list for the blog index page. */
export function blogIndexSchema(
  posts: Array<{ title: string; slug: string }>
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'peritissimus — Blog',
    url: `${SITE_URL}/blog`,
    inLanguage: 'en',
    author: {
      '@type': 'Person',
      name: AUTHOR_NAME,
      url: SITE_URL,
    },
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${SITE_URL}/blog/${post.slug}`,
    })),
  };
}

export interface WorkInput {
  title: string;
  description: string;
  slug: string;
  kind: 'professional' | 'personal';
  role: string;
  technologies?: string[];
  externalUrl?: string;
  image?: string;
}

/**
 * Entity for a work case-study page: SoftwareApplication for personal
 * projects, CreativeWork for professional case studies.
 */
export function workSchema(work: WorkInput): Record<string, unknown> {
  const url = `${SITE_URL}/work/${work.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': work.kind === 'personal' ? 'SoftwareApplication' : 'CreativeWork',
    name: work.title,
    description: work.description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: 'en',
    ...(work.kind === 'personal' ? { applicationCategory: 'DeveloperApplication' } : {}),
    ...(work.technologies?.length ? { keywords: work.technologies.join(', ') } : {}),
    ...(work.externalUrl ? { sameAs: work.externalUrl } : {}),
    ...(work.image ? { image: absoluteUrl(work.image) } : {}),
    author: {
      '@type': 'Person',
      name: AUTHOR_NAME,
      url: SITE_URL,
    },
  };
}
