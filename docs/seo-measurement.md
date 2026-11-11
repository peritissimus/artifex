# Measuring the Artifex ranking pilot

Use the deployment date as day zero. Compare equal 28-day windows once enough
data has accumulated. Show absolute counts beside percentages when traffic is
small. Keep reader growth and consulting outcomes separate.

## Readers

In Search Console, inspect the actual queries and pages before interpreting
the site's aggregate position. Track searches for Kushal Patankar and
peritissimus separately from nonbrand engineering queries. Project-name
searches need their own review because words such as “Stone” are ambiguous.

Start with these pages:

- `/blog/frameworks-for-ai-coding`
- `/blog/ai-coding-django-permissions-pilot`
- `/blog/markdown-notes-sqlite-search-index`
- `/blog/celery-redis-media-pipeline`

Record indexing status, Google-selected canonical, impressions, clicks, CTR,
and the queries generating those impressions. Segment the US, India, UK,
and Germany where the sample size supports a comparison. A Keyword Planner
volume is not an observed ranking or an impression forecast.

Use the existing PostHog pageview/visit events to inspect organic article
journeys and relevant next-page visits. Time and scroll depth indicate
engagement; they do not establish that a reader found an answer. Review
referring pages and relevant external references alongside those signals.

## Consulting

Inspect organic landing-page visits that continue to
`/consulting/llm-infrastructure` and the existing
`consulting_inquiry_click` event with
`service = scalable-ai-infrastructure`. The event records its source path,
so the standalone offer can be separated from Contact and other entry points.

An inquiry click opens a mail draft. It does not prove that an email was sent
or that an opportunity was qualified. Record actual qualified inquiries
separately. Resume downloads and social-profile clicks belong to their own
outcomes even though the existing visit summary marks them as contact intent.

## What to change next

| Observed result | Next check |
| --- | --- |
| A priority page is not indexed | Inspect the reported reason and selected canonical before rewriting the article |
| Impressions come from an unintended query | Check whether the title, opening, and page actually answer that query |
| Intended query impressions grow but clicks do not | Compare presentation and CTR within the same query/page/country groups |
| Readers arrive but do not use the next relevant page | Check the explanation and contextual links |
| Service visits grow without inquiry clicks | Review fit, scope, evidence, and the inquiry action |
| Inquiry clicks grow without qualified conversations | Inspect actual inquiries before treating more traffic as commercial success |

Record each release and page change beside the measurements. Do not attribute
small fluctuations to a particular edit without enough observations.
