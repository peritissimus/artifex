# Zoca write-up: Gemini editorial review

Reviewed on November 12, 2026 using `google/gemini-4-carbon` through Pi, with low thinking and no tools or write access.

The revision broadens the employment entry from LLM workflows to product engineering, the full Front Desk agent, infrastructure as code, backend architecture, developer experience, and internal operations. The author explicitly confirmed end-to-end ownership of Front Desk. Existing résumé material, repository descriptions, source, and authored commit history were checked read-only in Chrome. The review received the proposed public copy and a high-level evidence brief; private company source was not included.

The [public Front Desk product page](https://www.zoca.com/front-desk-agent) supports the description of its customer-facing workflow. The 1,000+ figure remains tied to the content system. LocalStack is described as earlier work; the current local setup uses API emulation. The upstream Emulate project is credited, and emulator behavior is distinguished from live voice processing.

## Gemini's review

**Verdict:** Publish-ready with minor polish. The write-up accurately reflects full end-to-end ownership of the Front Desk agent alongside platform, content/website, infrastructure, and DX breadth. Scope boundaries are disciplined (1,000+ tied strictly to content, Emulate credited as a fork extension, marketing claims avoided), and the explanatory first-person tone reads naturally. A few defensive disclaimers and metadata mismatches are the only friction points.

### Material Editorial Fixes

1. **Drop defensive boundary sentences**
   Two lines read like editorial fact-checking notes ("This is a separate part of the work...", "That is a deployment result, separate from...") that address misunderstandings a reader wouldn't naturally have.
   - _In `## Content and website systems`, replace paragraph 2:_
     > I also built LLM-assisted crawlers to collect business context from the web for those content and website workflows.
   - _In `## Infrastructure as code`, replace paragraph 2:_
     > Earlier infrastructure and pipeline improvements brought deployment time from around 1.5 minutes to 1–4 seconds.

2. **Align domain links (`zoca.in` vs. `zoca.com`)**
   Frontmatter sets `externalUrl: https://zoca.in`, while the body links to `https://www.zoca.com/front-desk-agent`. Standardize `externalUrl` to the canonical domain if `zoca.com` is now primary:

   ```yaml
   externalUrl: https://www.zoca.com
   ```

3. **Trim retired LocalStack from frontmatter `technologies` (and surface Prometheus/Tempo if desired, or simply drop LocalStack)**
   The body rightly frames LocalStack as retired history, so listing it in top-level `technologies` overstates its current relevance. Remove `LocalStack` from the `technologies` array:

   ```yaml
   technologies:
     [
       TypeScript,
       NestJS,
       Next.js,
       Terraform,
       AWS,
       Message Queues,
       Voice Agents,
       API Emulation,
       OpenTelemetry,
       Grafana,
     ]
   ```

4. **Replace the vague `'Multiple'` stat card**
   Alongside `'1,000+'` and `'1–4s'`, `'Multiple'` feels like a placeholder. Anchor it to the concrete systems already evidenced in the text:
   ```yaml
   - value: '3'
     label: '0-to-1 Product Systems (Voice, Content, Web)'
   ```
   _(Or, if counting Raft as well, `'4'` with `'0-to-1 Product & Internal Systems'`.)_

## Applied resolutions

- Removed the two editorial boundary sentences that interrupted the narrative.
- Updated the company link to its current primary website.
- Removed retired LocalStack from the technology summary while preserving the history in the prose.
- Removed the vague “Multiple” statistic instead of inventing a definitive product count.

The final copy preserves the original engineering-article link and adds the public Front Desk link. The HTML page and Markdown twin share the edited source.

## Validation

The production build, formatting, and all eight Markdown-twin browser checks passed. The refreshed Zoca page was checked in Chrome for the revised title, all seven narrative sections, the company link, and the Front Desk ownership statement. The built Markdown version contains the same section headings and retains the original engineering-article link.
