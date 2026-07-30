# Artifex

Personal portfolio of Kushal Patankar — [peritissimus.com](https://peritissimus.com)

A static site built with Astro. Every page is prerendered to HTML at build time and served from Cloudflare; there is no server runtime.

## Stack

- **[Astro 7](https://astro.build)** — static site generator, `output: 'static'`
- **[Sass](https://sass-lang.com)** — styles, all in `src/styles/main.scss`
- **[Three.js](https://threejs.org)** — WebGL scene on `/terminal`
- **[anime.js](https://animejs.com)** — homepage and project-card motion
- **[Satori](https://github.com/vercel/satori)** + **[resvg-js](https://github.com/yisibl/resvg-js)** — Open Graph image generation
- **[Playwright](https://playwright.dev)** — end-to-end tests

## Getting started

Requires Node 22 and pnpm 10.

```bash
git clone git@github.com:peritissimus/artifex.git
cd artifex
pnpm install
pnpm playwright:install   # only needed to run tests
pnpm dev
```

The dev server runs at `http://localhost:4321`.

## Commands

| Command                   | Description                                         |
| ------------------------- | --------------------------------------------------- |
| `pnpm dev`                | Start the dev server                                |
| `pnpm build`              | Build to `dist/`                                    |
| `pnpm check`              | Alias for `build`; fails on type and content errors |
| `pnpm test:e2e`           | Run Playwright tests                                |
| `pnpm test:e2e:headed`    | Run Playwright tests in a visible browser           |
| `pnpm playwright:install` | Download the Chromium build tests need              |
| `pnpm og:generate`        | Regenerate Open Graph images into `public/og/`      |
| `pnpm format`             | Format with Prettier                                |
| `pnpm format:check`       | Check formatting without writing                    |

## Structure

```
src/
├── pages/              # Routes; .astro files map to URLs
│   ├── index.astro     # Homepage
│   ├── about.astro
│   ├── blog/           # Blog index and [...slug] template
│   ├── work/           # [...slug] template
│   ├── terminal.astro  # WebGL scene
│   ├── rss.xml.js      # RSS feed
│   └── 404.astro
├── content/            # Markdown source
│   ├── blog/           # Blog posts
│   └── work/           # Portfolio entries
├── content.config.ts   # Zod schemas for both collections
├── components/
│   ├── AgentShell/     # Three.js scene: layers, shaders, controllers
│   ├── SEO.astro       # Meta tags and JSON-LD
│   └── ProjectArtwork.astro
├── layouts/            # Base.astro shell, Terminal.astro
├── plugins/            # Custom remark/rehype plugins for blog HTML
└── styles/main.scss

public/
├── _headers            # Cloudflare response headers
├── .well-known/        # security.txt
├── og/                 # Generated OG images (committed)
└── robots.txt

scripts/generate-og-images.js
tests/e2e/
```

## Content

Blog posts and work entries are Astro content collections. Add a Markdown file to `src/content/blog/` or `src/content/work/` and it becomes a route — no generation step.

`src/content.config.ts` defines both schemas with Zod, so a missing or mistyped frontmatter field fails the build rather than rendering blank. Blog posts require `title`, `description`, and `date`; work entries require `title`, `company`, `role`, `description`, `dateRange`, `location`, and `order`. Both accept optional extras — see the schema for the full list.

Two fields drive things outside the page itself. `updated` (blog) and `sortDate` (work) supply `lastmod` dates to the sitemap, read directly from frontmatter in `astro.config.mjs`. Setting `draft: true` keeps a post out of the index.

After adding a post, run `pnpm og:generate` and commit the resulting PNG. OG images are generated locally and committed, so CI does no image work.

### Markdown pipeline

Astro 7 renders Markdown with Sätteri by default. This project overrides that and uses the older `unified()` pipeline from `@astrojs/markdown-remark`, configured in `astro.config.mjs`.

The reason is `src/plugins/rehype-blog-transform.js`, which is written against the remark/rehype APIs. It captures code-fence languages before Shiki runs, wraps sections in `.post-section`, brackets `h2` headings, and builds the `.code-block` markup the stylesheet expects. Porting it to Sätteri's `mdastPlugins`/`hastPlugins` hooks would work, but nothing forces the change yet.

## Testing

Playwright tests live in `tests/e2e/` and drive a real dev server, configured in `playwright.config.ts`.

The config sets `ASTRO_DEV_BACKGROUND=0`. Astro 7 detaches `astro dev` into a background daemon when it detects an AI coding agent; Playwright then sees the foreground process exit and reports `webServer exited early`. Forcing foreground mode keeps the suite behaving the same everywhere.

If tests fail to launch a browser after a dependency update, run `pnpm playwright:install`.

## Deployment

Cloudflare builds and serves the site from the `main` branch through its Git integration. No deploy step lives in this repo.

`public/_headers` controls caching and security headers. Hashed assets under `/_astro/*` are immutable for a year; HTML routes use `max-age=0` with `stale-while-revalidate`, listed per route family because `trailingSlash: 'never'` and `build.format: 'file'` mean a `/*.html` pattern never matches a real request. The catch-all `/*` block carries HSTS, `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy` — keep `Cache-Control` out of it, since Cloudflare joins duplicate header values with a comma instead of overriding.

## Analytics

Two trackers, answering different questions:

- **Cloudflare Web Analytics** — traffic, referrers, countries. Pages injects
  the beacon automatically, so nothing in this repo configures it. Do not add
  the beacon script by hand; it would double-count.
- **PostHog** — intent events, wired in `src/components/Analytics.astro`. The
  project key is inline and public by design (it is write-only and ships in the
  page source regardless). A PostHog _personal_ API key is a real secret and
  must never go here.

The PostHog block is guarded on `location.hostname === 'peritissimus.com'`, so
`astro dev` and preview deploys never file events against real visitors. It also
loads as a dynamic chunk, fetched after paint rather than in the module graph.

PostHog uses `localStorage` rather than cookies, which avoids a cookie-banner
obligation while keeping a visitor's session intact across page navigations.
`defaults` pins behaviour to a date so a `posthog-js` upgrade cannot silently
change what is captured — bump it deliberately.

Session replay is deliberately unused, so the event set has to carry the whole
diagnosis on its own:

| Event                  | Fires when                                                         |
| ---------------------- | ------------------------------------------------------------------ |
| `contact_email_click`  | A `mailto:` link is clicked                                        |
| `resume_download`      | A `.pdf`, résumé, or CV link is clicked                            |
| `social_profile_click` | An outbound LinkedIn/GitHub/Twitter link is clicked (`network`)    |
| `outbound_click`       | Any other cross-origin link is clicked                             |
| `scroll_depth`         | Each new 25% quartile is reached — once per quartile, per pageview |
| `visit_ended`          | The tab is hidden or closed                                        |

`visit_ended` is the one to build reports on. It carries `seconds`, a `dwell`
bucket (`bounce` / `skim` / `read` / `study`), `max_depth`, and `converted` —
true when the visit produced any contact action. A page with `study` dwell,
100% depth, and `converted: false` is someone who read everything and still
found no way to reach out.

## Releases

`.github/workflows/main.yml` builds every push and pull request. Releases are opt-in per commit: put a marker in the commit **subject** line and the workflow tags, updates `CHANGELOG.md`, and creates a GitHub release.

| Marker            | Bump  |
| ----------------- | ----- |
| `[release]`       | patch |
| `[release:minor]` | minor |
| `[release:major]` | major |

Commits without a marker build and merge without releasing.

## License

MIT — see [LICENSE](LICENSE).
