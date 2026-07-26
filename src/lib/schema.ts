/**
 * Shared schema.org (JSON-LD) structured-data builders.
 * Passed to the `jsonLd` prop on Base/SEO, which renders them as
 * <script type="application/ld+json"> blocks.
 */

export const SITE_URL = 'https://peritissimus.com';

export const AUTHOR_NAME = 'Kushal Patankar';

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
  alumniOf: {
    '@type': 'CollegeOrUniversity',
    name: 'Indian Institute of Technology Kharagpur',
  },
  sameAs: [
    'https://github.com/peritissimus',
    'https://twitter.com/peritissimus_',
    'https://linkedin.com/in/peritissimus',
  ],
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
