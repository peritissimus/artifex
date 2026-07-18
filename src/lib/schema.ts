/**
 * Shared schema.org (JSON-LD) structured-data builders.
 * Passed to the `jsonLd` prop on Base/SEO, which renders them as
 * <script type="application/ld+json"> blocks.
 */

export const SITE_URL = 'https://peritissimus.com';

export const AUTHOR_NAME = 'Kushal Patankar';

/** Canonical Person entity for Kushal Patankar (Peritissimus). */
export const personSchema: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: AUTHOR_NAME,
  alternateName: 'Peritissimus',
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
    'https://twitter.com/peritissimus',
    'https://linkedin.com/in/peritissimus',
  ],
};

export interface BlogPostingInput {
  title: string;
  description: string;
  slug: string;
  datePublished: string;
  author?: string;
  image?: string;
}

/** BlogPosting entity for an individual blog post. */
export function blogPostingSchema(post: BlogPostingInput): Record<string, unknown> {
  const url = `${SITE_URL}/blog/${post.slug}`;
  const image = post.image?.startsWith('http') ? post.image : `${SITE_URL}${post.image}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: post.datePublished,
    ...(image ? { image } : {}),
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
