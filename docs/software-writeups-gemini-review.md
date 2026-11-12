# Software write-ups: Gemini editorial review

Reviewed on November 12, 2026 using `google/gemini-4-carbon` through Pi with medium thinking. Gemini received all eleven write-ups listed on `/software`, the work-detail template, and the text of [Understanding AI by Lee Robinson](https://leerob.com/ai). The review ran without tools or write access.

The response below is the original review of the pre-edit content. Its example draft and suggestions are editorial proposals, not verified implementation facts. Applied edits were checked against existing articles and relevant local project source; the final copy clarifies Stone's optional providers, Fitroom's prompt-based height guidance, and Kaze's embedding API boundary more explicitly than the example below.

---

## 1. Cross-Project Diagnosis

The underlying engineering across these eleven projects is strong, and several write-ups (`Tabbit`, `Birdbrain`, `Kaze`, `Dotfiles`) already include refreshingly honest notes on trade-offs and architectural boundaries. What holds the collection back from effortless, conversational readability is **template-driven repetition, pitch-deck aphorisms, and dense walls of bold-lead paragraphs**.

### Page-Level & Structural Friction (`src/pages/work/[...slug].astro`)

- **Triple-stated summaries:** Because `[...slug].astro` renders `description` as the top artwork `<figcaption>`, followed by `<Content />`, followed by `Key Achievements` and `Outcome` at the bottom, readers hit the exact same feature inventory twice—once in narrative prose and again in `achievements`—capped by an `outcome` that reads like a second tagline. For `kind === 'personal'`, either trim `achievements` to 3–4 crisp architectural facts not repeated verbatim in the prose, or fold `Outcome` into the closing paragraph and hide `Key Achievements` / `Outcome` when the body already covers them. ("Key Achievements" also sounds like a résumé heading rather than a personal tool write-up; "How It Works" or "Technical Highlights" fits better if kept.)
- **Formulaic "Why it is personal software" blocks:** Eight of the eleven write-ups include a dedicated `"Why it is personal software"` paragraph (or closing thesis), even though the page already sits under **Personal Software** (`← Back to Personal Software`, `Type: Personal Project`). When every piece stops to justify why it qualifies for the category, the personal voice turns into a rubric. Fold the concrete personal constraint directly into the opening story and cut the explicit label.
- **Wall-of-bold-leads rhythm:** Almost every body consists of 5–7 medium-length paragraphs that all start with a bold declarative slogan (`**The files are the product.**`, `**Height is data, not vibes.**`, `**The constraints are the craft.**`). When every paragraph opens with an epigram, nothing stands out, and the reader has no visual breathing room. Use plain `##` subheadings to group ideas, vary paragraph lengths (let a one- or two-sentence bridge breathe), and introduce concepts step by step: _problem → concrete example → how the code handles it_.
- **Unsupported absolutes vs. probabilistic reality:** Several write-ups state desired outcomes as deterministic guarantees—especially around AI image fidelity (`can never leak`, `faces, skin, and body builds survive`), timing (`resurfaces exactly when a project needs it`), and privacy (`audio never leaves`, `stays on my machine`). Distinguish hard architectural guarantees (e.g., no upload endpoint exists, SQLite is local) from probabilistic goals (e.g., isolating garments _reduces_ model bleed; prompts _push_ the generator to preserve height and build).

---

## 2. Project-by-Project Editorial Notes

### 1. Stone (`src/content/work/stone.md`)

- **Redundancy:** All four `achievements` bullets (`Plain files you own`, `On-device transcription`, `Daily command center`, `Retrieval you control`) restate paragraphs 4–7 almost point-for-point. `"Why it is personal software"` repeats the opening setup about scattered notes, meetings, and plain files.
- **Tone & Absolutes:** Phrases like _"Stone refuses the trade"_, _"The files are the product"_, and _"Meetings become memory, not homework"_ read like landing-page copy rather than an engineer explaining a tool they built for daily use. Also check privacy/timing absolutes against the `"Local AI"` / `"optional, local-first"` wording—clarify whether AI summaries always run on a local model or can optionally call a remote provider.
- **Quotes & Replacements:**
  - _Quote:_ `"Most knowledge tools make you choose: a smart, connected workspace that lives on someone else's servers, or plain files that stay dumb. Stone refuses the trade."`
    - _Suggested:_ `"I wanted the search and summarization features of a modern workspace without moving my notes off my disk. Stone is a Mac app that works directly over a folder of plain Markdown files and runs its indexing and transcription locally."`
  - _Quote:_ `"context from three months ago resurfaces exactly when a project needs it."`
    - _Suggested:_ `"full-text search, semantic similarity, and backlinks make it much easier to pull up relevant notes from months ago while working on a project."`
  - _Quote:_ `"Stone is an ongoing exploration of what a calm, private, context-aware workspace can feel like when the product owns the entire memory loop..."` (`outcome`)
    - _Suggested:_ `"Stone keeps my daily notes, meeting transcripts, and search indexes in one local workspace, backed by plain Markdown files I can open anywhere."`

### 2. Turntable (`src/content/work/turntable.md`)

- **Redundancy:** `achievements` repeats the exact shader details (`physical bow, restrained grain, and edge falloff; a curved cyclorama`) and device model list (`layered bezels, camera lenses, ports, hinges, and instanced keyboards`) word-for-word from paragraphs 4 and 5. `"Why it is personal software"` overlaps heavily with `"How the idea started."`
- **Readability & Pacing:** The jump into Three.js and GLSL details is great technically, but packing seven geometry/material nouns and four shader techniques into single sentences makes the middle paragraphs exhausting. Break device construction and studio lighting into shorter steps explaining _why_ each shader pass exists visually.
- **Quotes & Replacements:**
  - _Quote:_ `"Turntable's pitch is that the whole workflow fits in a browser tab"`
    - _Suggested:_ `"I built Turntable so I could do the whole workflow in a browser tab"` (drop the startup-pitch framing).
  - _Quote:_ `"When the device turns, highlights sweep across the titanium the way they should."`
    - _Suggested:_ `"Because the bezels, lenses, and keys are real 3D geometry rather than flat textures, light catches the edges naturally as you rotate the device."`
  - _Quote:_ `"pasted screenshots should stay on my machine, a useful angle should take seconds"`
    - _Suggested:_ `"screenshots are rendered locally in WebGL without uploading anything, and presets get me to a usable angle quickly"` (state the deterministic mechanism rather than timing promises).

### 3. Birdbrain (`src/content/work/birdbrain.md`)

- **Strengths & Friction:** Birdbrain does a great job stating real boundaries (`SQL text search, not semantic retrieval`, `Storage is local; AI enrichment is hosted`, `development service without user authentication`). Keep every one of those caveats. However, `"It began with my own bookmark debt"` and `"Why it is personal software"` say nearly the same thing twice, and `"It stays yours"` clashes slightly with sending post text to Groq unless framed carefully.
- **Redundancy:** `achievements` mirrors the four feature paragraphs (`Zero-effort capture`, `AI organization`, `Smart hydration`, `Local archive`).
- **Quotes & Replacements:**
  - _Quote:_ `"Birdbrain treats that pile as what it actually is — a personal knowledge source — and quietly moves it somewhere it can be owned, searched, and understood."`
    - _Suggested:_ `"I wanted my X bookmarks in a local database where I could actually search and browse them by topic."`
  - _Quote:_ `"You bookmark the way you always did; the archive builds itself."`
    - _Suggested:_ `"When I bookmark a post on X, the browser extension reads X's own GraphQL response in the background and saves the post to my local server."` (Keep the important caveat right beside it: capture only sees GraphQL responses that load while browsing.)
  - _Quote:_ `"**It stays yours.** ... Storage is local; AI enrichment is hosted."`
    - _Suggested:_ `"**Local database, hosted classification.** Posts and summaries live in a local SQLite file behind a dark-themed SvelteKit UI. Only the author handle and post text leave the machine when Groq generates the summary and topic tags."`

### 4. Tabbit (`src/content/work/tabbit.md`)

- **Strengths & Friction:** Tabbit has no `"Why it is personal software"` filler and models exemplary honesty on privacy and AI limits (`Impact labels are editorial estimates`, `signed-in pages may contain private content`, `Tabbit does not extract authentication tokens`). Its main readability issue is **compression**: every paragraph packs five or six distinct mechanisms together in imperative-slogan form (`**Start with...**`, `**Let the work...**`, `**Choose the model...**`), reading more like a dense spec sheet than an explanation.
- **Redundancy:** Five `achievements` bullets repeat the exact five themes of the body.
- **Quotes & Replacements:**
  - _Quote:_ `"Brief and feed generation run in the extension’s background worker, with progress and results saved to local storage. Opening another new tab shows the same work instead of starting over. Cached dashboard data appears first, then refreshes quietly. Build timing exposes how much time selection, reading and writing took; interrupted builds follow explicit recovery rules rather than spinning indefinitely."`
    - _Suggested:_ Split into two short paragraphs under a plain subheading (`## Background builds that survive closing a tab`). First explain the user problem (closing a new tab usually kills in-flight page scripts, so generation runs in the Manifest V3 service worker and writes state to local storage). Then add the recovery and build-timing details in a second short paragraph.
  - _Quote:_ `"**A small feed should earn its place.**"`
    - _Suggested:_ `"## How the discovery feed picks links"` — let the concrete pipeline (browsing history + lab watchlist → scraped candidate links → model constrained to supplied URLs) carry the section without aphoristic framing.

### 5. Garatch (`src/content/work/garatch.md`)

- **Factual / Internal Consistency Check:** Both `achievements` and the body say `"Twelve design theses"` / `"answers it twelve different ways"`, but `achievements` lists **ten** names (`minimal, orbit, blueprint, telemetry, atelier, cosmic, analog, sixdash, metrics, and instrument-grid`). Either name all twelve or say `"including minimal, orbit..."` so the count doesn't look miscounted.
- **Redundancy & Tone:** `"The project started on my wrist"` and `"Why it is personal software"` can merge into one crisp opening about testing hierarchy on walks and night brightness in bed. Phrases like `"A watch face is the hardest interface brief there is"`, `"Each face is a thesis"`, and `"The constraints are the craft"` lean heavily into design-manifesto prose.
- **Quotes & Replacements:**
  - _Quote:_ `"A watch face is the hardest interface brief there is: a canvas a few centimeters wide, read in under a second, on a battery budget measured in milliwatts."`
    - _Suggested:_ `"Designing for a Garmin watch forces tight trade-offs: the screen is a few centimeters wide, you read it in a quick glance, and every screen update costs battery life."`
  - _Quote:_ `"1 Hz second hands have to be earned."`
    - _Suggested:_ `"updating a second hand once per second has to fit within Garmin's strict low-power execution budget."` (More informative for engineers unfamiliar with Connect IQ's power budget!)

### 6. Fitroom (`src/content/work/fitroom.md`)

- **Unsupported Absolutes (High Priority):** Image generation models are probabilistic; prompts and pre-processing improve odds, not guarantees. Fitroom currently overstates deterministic control over diffusion/image-edit outputs in both `achievements` and the body.
- **Redundancy:** `"How the idea started"` and `"Why it is personal software"` overlap substantially, and `achievements` duplicates height scaling, garment isolation, and the OpenAI/Gemini job queue.
- **Quotes & Replacements:**
  - _Quote:_ `"Pre-processes every outfit down to the garment alone, so an outfit model's face or physique can never leak into a render"` (`achievements` & echoed in body)
    - _Suggested:_ `"Strips product photos down to the isolated garment first, so the store model's face and body build don't carry over into the prompt inputs."` (Guaranteed at the input stage, without claiming the generator _can never_ hallucinate or drift.)
  - _Quote:_ `"That is what lets faces, skin, and body builds survive the generation. Physique preservation is asserted forcefully in the prompt: the render must show _these_ two people, not the fashion-average bodies image models default to."`
    - _Suggested:_ `"Passing the original reference photos into a single image-edit call avoids compounding loss across multiple passes. The prompt also explicitly instructs the model to keep each person's build and facial features rather than defaulting to idealized fashion proportions."`
  - _Quote:_ `"**Height is data, not vibes.** Every saved person carries their real height, and the composite is scaled from it — a 6'0" partner and a 5'0" partner read correctly, side by side, the way they do in photographs."`
    - _Suggested:_ `"**Using real heights for scale.** Each saved profile stores the person's height, which Fitroom uses to guide relative proportions—so a 6'0" partner and a 5'0" partner aren't rendered at the same height."`

### 7. Strid (`src/content/work/strid.md`)

- **Strengths & Friction:** Strid is already one of the cleanest, best-paced write-ups in the bundle: clear problem, concrete Indian financial identifiers, clear explanation of confidence-based overlap resolution and reverse-offset replacement, and a clean split between `StridKit` and the SwiftUI app.
- **Targeted Fixes:** Cut the closing `"Strid is personal software because trust is the feature I need from it..."` paragraph—the opening two paragraphs already make that exact point naturally. Also check `technologies` (`Python, Presidio` appear in frontmatter, while the prose only describes `Swift, SwiftUI, Apple NaturalLanguage` plus future `Vision`/`PDFKit`); either mention in one sentence how Python/Presidio was used (e.g., prototyping or benchmarking, if true) or keep the prose clear on what runs in the native app today, and distinguish deterministic regex/checksum matches from heuristic context scoring.
- **Quotes & Replacements:**
  - _Quote:_ `"Strid explores how document privacy tools can feel native and trustworthy when the complete detection and redaction loop stays on the device."` (`outcome`)
    - _Suggested:_ `"Strid redacts Indian financial identifiers locally on macOS/iOS, separating reusable entity detection in StridKit from the review-and-export UI."`
  - _Quote:_ `"Format alone is not always enough, so nearby words can raise or lower confidence for ambiguous number sequences."`
    - _Suggested:_ Keep this! Just add one brief concrete example right after it (e.g., how a generic digit sequence scores higher as a bank account number when preceded by words like `"A/C"` or `"Account"`), which makes the heuristic immediately tangible without overclaiming 100% recall.

### 8. Kaze (`src/content/work/kaze.md`)

- **Strengths & Friction:** Concise, clear, and well-scoped—especially the distinction between whole-file orientation and Tree-sitter AST chunking.
- **Privacy / Local Boundary Nuance:** Frontmatter lists `OpenAI Embeddings`, while the description, achievements, and prose emphasize `"Local Natural-Language Code Search CLI"` and `"without requiring a hosted indexing service."` Be explicit about that boundary (just like Birdbrain and Tabbit do): the SQLite `.kaze` index lives locally in the repo, while generating embeddings calls the OpenAI Embeddings API (unless a local embedding model is also used). Engineers notice that distinction immediately.
- **Redundancy:** Drop `"Kaze is personal software because..."` at the end—keep its great second sentence (`"It does not try to replace rg, an editor, or a language server..."`) and move that right into the opening!
- **Quotes & Replacements:**
  - _Quote:_ `"Opening a hosted indexing product felt excessive for a question that belonged inside the terminal. Kaze turns the project itself into a queryable local index."`
    - _Suggested:_ `"I didn't want to set up a hosted code-search platform just to get oriented in a new repo from the terminal. Kaze indexes a repository into a local .kaze SQLite database using OpenAI embeddings, so I can query it in plain English right alongside rg."`

### 9. Paperfolio (`src/content/work/paperfolio.md`)

- **Redundancy:** `"It began as a discipline problem"` and `"Why it is personal software"` cover the same motivation (testing an investing thesis privately without risking capital). `achievements` also repeats the 1,200 Indian equities, Tickertape/Yahoo Finance fallback, paper holdings, and CAGR/Sharpe/drawdown metrics nearly verbatim.
- **Tone & Simulation Caveats:** Phrases like `"A paper portfolio makes every opinion accountable"` and `"Returns need context"` are slightly preachy. Also, when describing historical simulation, avoid implying historical replay equals live execution reality (note cleanly that simulations run against historical price data).
- **Quotes & Replacements:**
  - _Quote:_ `"The result is less a stock-picking oracle than a personal laboratory: a place to turn intuition into a claim that can be tested."`
    - _Suggested:_ `"Keeping data ingestion, screening, and historical replay in one database means I can check how an idea actually behaved across past drawdowns before acting on it."`
  - _Quote:_ `"A paper portfolio makes every opinion accountable."`
    - _Suggested:_ `"## Tracking paper portfolios and historical replays"`

### 10. Dotfiles (`src/content/work/dotfiles.md`)

- **Strengths & Friction:** Dotfiles has no `"Why it is personal software"` bloat and is packed with genuinely interesting engineering (`tmux-herd` storing agent state in tmux pane options with zero daemons, Bash 3.2 compatibility for fresh macOS installs, macOS Keychain secret loading).
- **Readability & Pacing:** Paragraphs 2 (`**The terminal is the workspace.**`) and 3 (`**One keyboard model everywhere.**`) are dense tool-name inventories (15+ tools in two paragraphs). Break them up slightly so `tmux-herd`—the most distinctive piece of custom engineering here—gets top billing or its own clear subheading, and check the small Linux/macOS nuance on secrets (`API keys are read from the macOS Keychain`—if Linux uses a fallback or skips Keychain, qualify `"on macOS"`).
- **Quotes & Replacements:**
  - _Quote:_ `"Each change is a small decision about how work should feel."`
    - _Suggested:_ Cut or replace with something direct: `"Having everything in one repo means a fresh laptop feels familiar in minutes."`
  - _Quote:_ `"API keys never touch the repository. The shell reads them from the macOS Keychain when it starts."`
    - _Suggested:_ `"API keys stay out of Git; on macOS, Fish loads them from the system Keychain at shell startup."`

### 11. Blueprint (`src/content/work/blueprint.md`)

- **Redundancy:** `"How the idea started"` and `"Why it is personal software"` both explain that it starts with your 3BHK flat in Bengaluru, uses feet-and-inches furniture sizes, and requires no account. Combine them into one concrete opening story! `achievements` also mirrors the body point-for-point.
- **Precision on Lighting:** `"Honest daylight"` and `"bright or dim for the right reasons"` are nice intuitions, while the actual engineering—solar position from Bengaluru's latitude/season/time + baked floor lightmap + single-bounce approximation + pinned Three.js custom shadow shader—is much more interesting. Frame the lighting as a practical visual approximation for furniture placement rather than physical radiometry.
- **Quotes & Replacements:**
  - _Quote:_ `"Tape measures answer the first kind of question badly and the second kind not at all."`
    - _Suggested:_ `"A tape measure can tell you if a six-foot wardrobe clears a door swing, but it won't tell you whether putting your desk by the balcony means afternoon glare."` (Concrete and visual!)
  - _Quote:_ `"That light, plus soft sky light, is baked into a light map on the floor and bounced off sunlit surfaces back into the room — which is what makes a room with one small window read as dim rather than evenly lit."`
    - _Suggested:_ Keep this explanation—it's clear and specific! Just break the surrounding paragraph in two: one short paragraph on solar positioning (latitude, east-facing entrance, time/season scrubber) and a second on how the floor lightmap approximates bounce light so single-window rooms look noticeably dimmer.

---

## 3. Complete Improved Example: Stone (`src/content/work/stone.md` body)

_Note: Pair this body with trimmed `achievements` (or hide `Key Achievements`/`Outcome` on personal project pages so the summary isn't read twice). All original facts and links are preserved._

```markdown
I wanted a workspace that could connect my notes, calendar, and meeting transcripts without moving everything onto someone else's servers. Most tools force a choice: use a cloud app with great search and summarization, or stick with plain local files and stitch context together yourself.

Stone is a native Mac app I built to bridge that gap. My notes lived in Markdown, meetings turned into unsearched audio files, and action items were scattered across Apple Mail, Calendar, and task lists. Instead of creating another proprietary database to feed, Stone works directly over a folder of plain Markdown files on disk.

## Plain files as the source of truth

Every note, daily journal, task, and meeting record in Stone is a plain Markdown file. You can open the folder in any text editor, track changes in Git, or stop using Stone tomorrow without an export step.

To make those files fast to query, Stone maintains a local SQLite database on the side. SQLite only stores metadata and rebuildable search indexes—if you delete the database, Stone reconstructs it from the Markdown files on disk.

## Bringing the workday into one view

My work usually revolves around the current day rather than a static folder tree. Stone's **Today** view pulls together calendar events, unread mail, open tasks, today's journal, and recent meetings into a single column.

When things get busy, a system-wide quick-capture shortcut lets me jot down a thought without switching windows. At the end of the day, Stone can generate an optional AI summary of the day's activity and save it back into the daily journal as Markdown.

## Local meeting transcription

Meetings are usually where project context gets lost. Stone records system audio and microphone input together, applies acoustic echo cancellation, and transcribes the conversation on-device using Whisper.

The audio never needs to be uploaded to a transcription service. Once transcribed, the meeting becomes a searchable Markdown note with its own summary, and you can replay the recording, re-transcribe it, or let old audio files auto-delete on a schedule you choose.

## Search and retrieval on your machine

Because notes and transcripts live in the same local index, older context is much easier to find when a topic comes back up months later. Stone computes full-text search, semantic search, topic clusters, a link graph, and related-note scores locally on your Mac. AI features sit behind your files as an optional helper—never a requirement to read or search your own work.

## Read more

If you want to dig into how Stone is built or try it yourself:

- [What Stone is and who it is for](/blog/stone-local-first-note-taking-app) covers the core workflow and installation.
- [Local meeting transcription with whisper.cpp](/blog/local-meeting-transcription-whisper-cpp) walks through dual-source audio capture and echo cancellation.
- [Markdown as the source of truth](/blog/markdown-notes-sqlite-search-index) explains how the rebuildable SQLite index stays in sync with plain files.
- [Stone vs Obsidian vs Granola](/blog/stone-vs-obsidian-vs-granola) compares Stone honestly against the two tools it overlaps with most.
```

---

## 4. Reusable Editorial Checklist

Use this checklist when editing the remaining ten write-ups and future project entries:

1. **Open with the concrete itch, not a category pitch.** Start in first person with what was frustrating or missing in your actual workflow (`"I had saved technical threads for years, but..."`). Cut standalone `"Why it is personal software"` paragraphs—let the personal constraint show up naturally in the opening.
2. **Replace bold-slogan walls with plain subheadings and short paragraphs.** Group related ideas under clear `##` headings (3–5 per post). Keep most paragraphs to 2–4 sentences, and avoid starting every paragraph with an epigrammatic bold thesis (`**Height is data, not vibes.**`).
3. **Explain _problem → example → mechanism_.** Before naming an architecture or library (Tree-sitter, Celery, GLSL lightmaps, reverse-offset redaction), give one concrete example of what goes wrong without it. Keep the real technical depth—just give the reader a foothold first.
4. **Separate deterministic guarantees from probabilistic goals.**
   - _Deterministic:_ State hard boundaries plainly (`"SQLite runs locally"`, `"no account or Tabbit backend"`, `"edits run back-to-front so string offsets don't shift"`).
   - _Probabilistic / Heuristic:_ Never promise `never`, `always`, or `exact` for LLM outputs, image generation, or heuristic scoring. Describe what the system _feeds_ or _instructs_ the model to do, not a guaranteed output.
5. **State data and network boundaries explicitly.** If storage is local (`SQLite`, `IndexedDB`, `Markdown`) while embeddings, summaries, or image renders call an external API (`OpenAI`, `Groq`, `Gemini`), name both halves in one clear sentence so `"local"` never misleads a technical reader.
6. **Eliminate template echo.** Check `description`, body `<Content />`, `achievements`, and `outcome` side by side. If `Key Achievements` and `Outcome` remain enabled on personal software pages, ensure `achievements` acts as a scannable architectural spec sheet rather than repeating the prose's metaphors and sentences verbatim.
7. **Verify counts and stack lists against the prose.** Cross-check frontmatter `technologies` and numerical claims (e.g., `"twelve faces"`) against what the body actually names and explains.

---

## Follow-up review of the edited drafts

Gemini reviewed the revised eleven write-ups in a second tool-free pass with low thinking. Its response follows.

**Editorial Verdict**

These eleven writeups are publication-ready. The prose is clean, calm, and direct, with short paragraphs and plain headings that explain _why_ each tool exists before detailing _how_ it works. Data-flow boundaries, model caveats, and local-versus-cloud splits are stated plainly without defensive boilerplate. Only a few minor metadata contradictions and ambiguous phrasings remain.

**Remaining Issues**

1. **`src/content/work/kaze.md` — Contradictory `seoTitle`**
   - **Issue:** The body explicitly notes that a local SQLite database does not make the default OpenAI configuration offline, and `description` carefully distinguishes "local index" from the cloud model. However, `seoTitle` calls the tool itself "Local Natural-Language Code Search CLI," which implies local inference.
   - **Replacement:**
     ```yaml
     seoTitle: 'Kaze – Natural-Language Code Search CLI with a Local Index'
     ```

2. **`src/content/work/fitroom.md` — Missing data-flow boundary for garment isolation**
   - **Issue:** The writeup states that "image generation sends reference photos to the chosen provider," and earlier notes that "Generation and garment isolation run as background jobs." It leaves unclear whether garment isolation also sends outfit images to an external model/provider or runs locally on the server.
   - **Replacement:** Clarify in the closing boundary sentence (adjusting to match actual behavior), e.g.:
     > "...while garment isolation and image generation send outfit and person photos to the configured model provider." _(or "...while garment isolation runs locally and image generation sends reference photos to the chosen provider.")_

3. **`src/content/work/dotfiles.md` — Missing data-flow boundary for AI shell scripts and Linux secrets**
   - **Issue:** Compared with the strict provider boundaries in Stone, Birdbrain, Tabbit, and Kaze, Dotfiles mentions `gcm` (staged changes), `x` (requests), and `q` (piped JSON) without noting that they send diffs, prompts, or piped data to a configured LLM API. Additionally, `achievements` specifies macOS Keychain for API keys without mentioning how Linux handles them in a cross-platform setup.
   - **Replacement (body, penultimate paragraph):**
     > "Small LLM-backed scripts handle recurring chores—sending staged diffs, prompts, or piped JSON to a configured API: `gcm` drafts a commit message..."

4. **`src/content/work/strid.md` — Unused `technologies` tags (`Python`, `Presidio`)**
   - **Issue:** Frontmatter lists `Python` and `Presidio` alongside Swift, SwiftUI, and Apple frameworks, while the body describes the engine strictly as `StridKit` in Swift using Apple's frameworks plus custom recognizers. Readers can't tell if Python/Presidio are leftover tags, benchmark baselines, or part of the runtime.
   - **Replacement:** Remove `Python, Presidio` from `technologies` if StridKit is pure Swift, or add one clause in _Separating the engine from the app_ explaining their role (e.g., prototyping or evaluation).

5. **`src/content/work/stone.md` — Unanchored AI summary privacy boundary**
   - **Issue:** Under _Starting with the day_, the writeup mentions "An optional AI summary can pull the day's context into a journal entry" (where context includes calendar and unread mail) two sections before explaining that prose features can use a cloud provider. When cloud inference is enabled, readers may not connect "prose features" back to calendar and mail data.
   - **Replacement (in _Optional language models_):**
     > "Features that write prose—such as daily summaries, meeting summaries, and Ask Notes—need a language model. Cloud inference is off by default. Configuring a cloud provider allows those features to send relevant note, transcript, or Today-view context to that provider; a local endpoint is also an option."

### Resolution of follow-up notes

- **Kaze:** Updated the SEO title to distinguish the local index from hosted inference.
- **Fitroom:** Confirmed the isolation factory uses OpenAI and named both isolation and portrait-generation data flows.
- **Dotfiles:** Confirmed provider choices in the scripts. Explained hosted inputs and the local MLX options for `gcm` and `x`; retained the explicit macOS scope for Keychain rather than inventing a Linux secret store.
- **Strid:** Confirmed the repository contains a Presidio-based Python CLI as well as StridKit; described them separately.
- **Stone:** Named daily summaries and the relevant notes, transcripts, and Today-view context in the optional-provider explanation.

### Validation

The production build and all 10 tests in `software.spec.ts` and `markdown-twins.spec.ts` passed. All original body links remain. Desktop Stone and mobile Fitroom were visually inspected, with no mobile horizontal overflow.
