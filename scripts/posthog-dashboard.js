#!/usr/bin/env node
/**
 * Creates the "Recruiter Funnel" dashboard in PostHog.
 *
 * PostHog's default dashboard is built for SaaS products and answers questions
 * this site does not have. These six insights answer the ones it does: where
 * traffic comes from, which case studies hold attention, and who read
 * everything and still left without making contact.
 *
 * Needs a *personal* API key (not the phc_ project key, which is write-only and
 * cannot read or create anything). Create one at
 * Settings > Personal API keys with the `dashboard:write` and `insight:write`
 * scopes, then:
 *
 *   POSTHOG_PERSONAL_API_KEY=phx_... node scripts/posthog-dashboard.js
 *
 * The key is read from the environment and never written to disk. Re-running
 * creates a second dashboard rather than updating the first — delete the old
 * one in the UI if you re-run after editing.
 */

const API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const API_HOST = process.env.POSTHOG_API_HOST ?? 'https://us.posthog.com';
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const DATE_RANGE = { date_from: '-30d' };

if (!API_KEY) {
  console.error('POSTHOG_PERSONAL_API_KEY is not set.');
  console.error('Create one at Settings > Personal API keys with dashboard:write + insight:write.');
  process.exit(1);
}

/** Thin fetch wrapper that surfaces PostHog's error body instead of a bare status. */
async function api(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_HOST}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${method} ${path} -> ${response.status}\n${text.slice(0, 600)}`);
  }
  return text ? JSON.parse(text) : null;
}

/** An event series, optionally filtered down to specific property values. */
function series(event, properties = []) {
  return [{ kind: 'EventsNode', event, math: 'total', properties }];
}

/**
 * A property filter on an event property. `value` may be a single value or a list.
 *
 * Booleans are matched as the strings 'true'/'false', which is how PostHog's own
 * filter UI serialises them. If a boolean filter returns zero rows despite the
 * events existing, that serialisation is the first thing to check.
 */
function prop(key, value, operator = 'exact') {
  return { key, value: Array.isArray(value) ? value : [value], operator, type: 'event' };
}

function trends(source) {
  return {
    kind: 'InsightVizNode',
    source: { kind: 'TrendsQuery', dateRange: DATE_RANGE, ...source },
  };
}

const INSIGHTS = [
  {
    name: 'Where traffic comes from',
    description:
      'Pageviews by referring domain. A LinkedIn or Hacker News referrer behaves very differently from a Google one — this is the split that tells you which channel is actually working.',
    query: trends({
      series: series('$pageview'),
      breakdownFilter: { breakdown: '$referring_domain', breakdown_type: 'event' },
    }),
  },
  {
    name: 'Which pages hold attention',
    description:
      'Visits that lasted long enough to count as a real read, by page. Ranks the case studies by what people actually finish, which is what should decide the homepage slots.',
    query: trends({
      series: series('visit_ended', [prop('dwell', ['read', 'study'])]),
      breakdownFilter: { breakdown: 'path', breakdown_type: 'event' },
    }),
  },
  {
    name: 'The leak — read everything, left anyway',
    description:
      'Visits that reached 100% scroll depth without any contact action. These are the strongest prospects the site failed to convert. If this number is high, the problem is the site, not the traffic.',
    query: trends({
      series: series('visit_ended', [prop('converted', 'false'), prop('max_depth', '100%')]),
      breakdownFilter: { breakdown: 'path', breakdown_type: 'event' },
    }),
  },
  {
    name: 'Contact actions',
    description:
      'Every deliberate attempt to reach out, by type. The number that actually matters — everything else on this dashboard exists to explain why it is what it is.',
    query: trends({
      series: [
        { kind: 'EventsNode', event: 'contact_email_click', math: 'total' },
        { kind: 'EventsNode', event: 'resume_download', math: 'total' },
        { kind: 'EventsNode', event: 'social_profile_click', math: 'total' },
      ],
    }),
  },
  {
    name: 'How far people scroll',
    description:
      'Distribution of scroll depth across all pages. A cliff between 25% and 50% means the fold is losing people before they reach the substance.',
    query: trends({
      series: series('scroll_depth'),
      breakdownFilter: { breakdown: 'depth', breakdown_type: 'event' },
    }),
  },
  {
    name: 'Visit to contact funnel',
    description:
      'Arrived, scrolled past halfway, then made contact. Shows which of the two steps is doing the losing.',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'FunnelsQuery',
        dateRange: DATE_RANGE,
        series: [
          { kind: 'EventsNode', event: '$pageview' },
          { kind: 'EventsNode', event: 'scroll_depth', properties: [prop('depth', '50%')] },
          { kind: 'EventsNode', event: 'contact_email_click' },
        ],
        funnelsFilter: { funnelVizType: 'steps' },
      },
    },
  },
];

async function resolveProjectId() {
  if (PROJECT_ID) return PROJECT_ID;

  // A key scoped to one project is refused by the org-level listing, but
  // `@current` is a project-based endpoint it can still reach. Try that first
  // so scoped keys — the safer kind — work without extra configuration.
  try {
    const current = await api('/api/projects/@current/');
    if (current?.id) return current.id;
  } catch {
    /* fall through to the org-level listing below */
  }

  const projects = await api('/api/projects/');
  const results = projects?.results ?? [];
  if (results.length === 0) throw new Error('No projects visible to this API key.');
  if (results.length > 1) {
    console.log('Multiple projects found; using the first. Set POSTHOG_PROJECT_ID to override:');
    for (const project of results) console.log(`  ${project.id}  ${project.name}`);
  }
  return results[0].id;
}

const projectId = await resolveProjectId();
console.log(`Project ${projectId} on ${API_HOST}\n`);

const dashboard = await api(`/api/projects/${projectId}/dashboards/`, {
  method: 'POST',
  body: {
    name: 'Recruiter Funnel',
    description:
      'Who is finding the site, what they read, and whether they got in touch. Created by scripts/posthog-dashboard.js.',
    pinned: true,
  },
});

console.log(`Created dashboard "${dashboard.name}" (id ${dashboard.id})\n`);

// Each insight is created independently so one rejected query shape does not
// cost the whole run — the dashboard is still usable with the rest.
let failed = 0;
for (const insight of INSIGHTS) {
  try {
    await api(`/api/projects/${projectId}/insights/`, {
      method: 'POST',
      body: {
        name: insight.name,
        description: insight.description,
        query: insight.query,
        dashboards: [dashboard.id],
      },
    });
    console.log(`  ok    ${insight.name}`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL  ${insight.name}`);
    console.log(`        ${String(error.message).replace(/\n/g, '\n        ')}`);
  }
}

console.log(`\n${INSIGHTS.length - failed}/${INSIGHTS.length} insights created`);
console.log(`${API_HOST.replace(/\/$/, '')}/project/${projectId}/dashboard/${dashboard.id}`);
if (failed) process.exitCode = 1;
