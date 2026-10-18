import type { CollectionEntry } from 'astro:content';

/** Editorial reading paths: keep recommendations relevant, stable, and crawlable. */
const readingPaths = [
  [
    'what-is-personal-software',
    'how-to-build-personal-software',
    'new-tab-productivity',
    'searchable-x-bookmark-archive',
  ],
  [
    'stone-local-first-note-taking-app',
    'stone-vs-obsidian-vs-granola',
    'local-meeting-transcription-whisper-cpp',
    'markdown-notes-sqlite-search-index',
  ],
  [
    'searchable-x-bookmark-archive',
    'markdown-notes-sqlite-search-index',
    'celery-redis-media-pipeline',
    'scaling-llm-applications',
  ],
  ['frameworks-for-ai-coding', 'how-to-build-personal-software', 'scaling-llm-applications'],
];

export function relatedPosts(postId: string, posts: CollectionEntry<'blog'>[]) {
  const ids = [...new Set(readingPaths.filter((path) => path.includes(postId)).flat())];
  return ids
    .filter((id) => id !== postId)
    .map((id) => posts.find((post) => post.id === id && !post.data.draft))
    .filter((post): post is CollectionEntry<'blog'> => Boolean(post))
    .slice(0, 3);
}
