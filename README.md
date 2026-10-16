# Kelvin Mihingo's portfolio

A static, YAML-driven Astro portfolio, art-directed as a set of **working drawings** in a charcoal-and-lime palette: a pure white page with light grey panels, charcoal ink and a single accent (deep olive in light mode, electric lime in dark mode), Instrument Serif statements over Inter and JetBrains Mono metadata, hairline rules, numbered plates and figures, and an engineering-drawing "title block" in the hero. Selected work is told as stories, not cards. Real screenshots, honest diagrams and measured numbers carry the evidence.

The home page answers, in order: who Kelvin is (hero + title block), what he has built (selected-work index, then three plates), how he works (principles with evidence), what he can do (capabilities backed by that work), why to trust him (track record), and how to reach him (contact).

## Setup

Use Node **22.22.0 LTS** (see `.node-version`) and pnpm **10.32.1**.

```sh
corepack enable
pnpm install
pnpm dev
```

Open the local URL printed by Astro. Content changes are picked up during development. Restart `pnpm dev` to regenerate the resume, favicon and OG image after editing identity information.

```sh
pnpm check          # strict Astro/TypeScript diagnostics
pnpm test:unit      # schema, dates, grouping, path and contrast tests
pnpm build          # validate content, generate assets, build static HTML
pnpm preview        # serve the production build
```

There is no backend, database, third-party font request or analytics request by default.

## Layout

```text
src/
  content.config.ts        # current Astro glob loaders + schemas
  content/
    site.yaml              # identity, headline, lede/about, links, nav, SEO, theme
    experience/*.yaml      # one role per file
    projects/*.yaml        # work stories: screens, diagram, comparison, metrics, case study
    approach/approach.yaml # "How I work" principles, each with evidence
    skills/skills.yaml     # capability groups: evidence + tools
    impact/impact.yaml     # "In numbers"
    education/*.yaml
    community/*.yaml
  config/ui.ts             # typed interface copy, not portfolio facts
  lib/                     # shared schemas, grouping, durations, paths
  components/              # Story, Screens, Diagram, Comparison, Experience, Header…
                           # static Astro; React only for the optional project filter
  layouts/
  pages/                   # home, generated project pages, 404, robots.txt
  styles/global.css
public/images/psms/        # genuine WebP captures of the live PSMS portal
scripts/                   # scaffold, assets, screenshot capture, validation, verification
tests/                     # unit tests + browser tests
.github/workflows/         # quality, GitHub Pages, optional Cloudflare
```

## How to edit

All examples below are templates, not biographical claims. Replace placeholders with confirmed facts.

### Add a job

```sh
pnpm new experience my-company-role
```

Edit the new file in `src/content/experience/`:

```yaml
companyId: company-name
company: Company Name
title: Software Engineer
start: "2025-01"
end: present
location: Nairobi
visible: true
featured: false
summary: A short, factual description of the role.
bullets:
  - A confirmed contribution and its outcome.
tags: [TypeScript]
```

Dates must be quoted `YYYY-MM`; `end` may also be `present`. Add `mode: hybrid`, `companyUrl: https://...`, or `client:` if applicable. Roles sort by start date descending, with title as the tie-breaker. Experience is intentionally chronological, not manually reordered.

### Add a role at an existing company

Run the same scaffold command with a new filename. Copy the existing role's exact `companyId` and `company` values. All roles with that ID group together; overlapping/consecutive dates are shown as stacked roles, without adding their durations together. The newest role determines the company group's placement.

The unpublished Microsoft tuning draft is ready to fill in. It deliberately has no invented dates. Confirm its title, dates and contributions, then set `visible: true`. Do not change the existing Microsoft role to publish a new one.

### Hide an entry

```yaml
visible: false
```

Supported for experience, projects, community and education. Hidden projects generate no case-study route. Hidden roles may omit dates, but provided dates must still be valid.

### Add a project

```sh
pnpm new projects my-project
```

Fill in `name`, `role`, `summary` (the problem and context), `stack`, and verified `highlights` (what you did), then set `visible: true`. Lower `order` appears first.

`featured: true` makes it a numbered **plate** in Selected work and adds it to the hero's work index (with `shortName` if set). Non-featured visible projects appear in a filterable "More projects" grid. Story fields:

```yaml
kicker: Founder project            # context line above the title
shortName: PSMS                    # used in the hero work index
status: building                   # live | building | shipped | delivered | archived
statusNote: Public portal live     # optional qualifier after the status
layout: split                      # feature (dark full-bleed plate) | split (figures, then text) | ledger (text + big numbers)
outcome: Where it honestly stands.
inResume: true                     # false if an experience entry already covers it in the generated PDF
metrics:                           # large numbers for the ledger layout
  - value: "3"
    label: countries using the service
    detail: Kenya · Nigeria · Zimbabwe
comparison:                        # before/after bars for a measured result
  label: Load time of a key app
  unit: seconds
  before: { label: Before, value: 4, display: about 4 s }
  after: { label: After, value: 1.5, display: under 1.5 s }
  caption: How it was measured.
screens:                           # genuine screenshots only
  label: example.com
  caption: What it shows and when it was captured.
  desktop: { base: /images/x/desktop, widths: [960, 1600, 2400], width: 1440, height: 624, alt: … }
  mobile:  { base: /images/x/mobile,  widths: [390, 780], width: 390, height: 738, alt: … }
```

Screenshot files are named `${base}-${width}.webp`; the build fails if any listed file is missing. A diagram is shown on the home page only when a project has no screenshots; it always appears on the case-study page.

```yaml
url: https://your-confirmed-project-url.example
urlLabel: Visit project
repo: private
caseStudy:
  problem: The confirmed context.
  approach: What you actually built.
  outcomes:
    - A confirmed outcome.
  sections:
    - heading: A design decision
      body: The reasoning behind it.
```

Omit unknown URLs rather than publishing the example URL. `repo` accepts an HTTPS URL or `private`; it may be omitted. An omitted repository never implies public code. Case studies are structured YAML, not separate Markdown. Their route comes from `slug`, not the filename.

Optional image:

```yaml
image:
  src: /images/my-project.webp
  alt: A meaningful description of the image.
```

Put the image under `public/images/`. Images use a 16:9 slot. Diagrams use `architecture.label`, `description`, `nodes` (`id`, `label`, optional `detail`), and `edges` (`from`, `to`, optional `label`). IDs must be unique, edges must reference real nodes and must not form a cycle. Nodes are laid out in columns by depth, so fan-in/fan-out diagrams work. Keep labels under ~28 characters. Below 640px the diagram becomes a vertical, text-based flow; a native disclosure always provides the complete edge list as text. Say in `description` whether a diagram is conceptual.

### Add a capability (skill group)

Append to `groups` in `src/content/skills/skills.yaml`. Lead with evidence; tools are secondary:

```yaml
  - name: New capability
    order: 7
    evidence: The confirmed work that demonstrates it.
    items: [Confirmed skill, Another skill]
```

### Edit the approach

`src/content/approach/approach.yaml` holds the "How I work" principles. `title` and `body` are framing; `evidence` must be a verifiable fact.

### Headline emphasis

In `site.yaml`, wrap phrases in `*asterisks*` to set them in the italic accent face: `building *AI-agent platforms*`. Asterisks are stripped from metadata, the OG image and the résumé. `lede` is the hero's supporting sentence; `about` introduces "How I work".

### Change or remove the portrait

The headshot lives at `src/assets/portrait.jpeg`, **not** in `public/`, so the original file (with its camera/editing metadata) is never published. `site.yaml` points to it relative to itself:

```yaml
portrait:
  src: ../assets/portrait.jpeg
  alt: Portrait of Kelvin Mihingo N.
```

At build time Astro re-encodes it to AVIF/WebP/JPEG at 152, 304 and 408px with all metadata stripped. It appears as a circle in the hero title block (slightly dimmed in dark mode), in the `Person` structured data, and in the generated social image. To replace it, overwrite the file. A head-and-shoulders photo at least 408px wide works best; it is cropped to a circle around the upper third. Delete the `portrait` block to remove it everywhere. Validation fails if the path is missing or points outside `src/`.

### Refresh the PSMS screenshots

```sh
pnpm capture:psms
```

Captures the live portal at desktop and mobile sizes, crops above its statistics band (those figures are not verified portfolio facts), and writes responsive WebP files. Update `width`/`height` in `psms.yaml` if the script reports different dimensions.

### Change the accent color

Edit `theme.dark.accent` and `theme.light.accent` in `src/content/site.yaml`. Use six-digit hex colors. `pnpm content:check` verifies text, muted and accent against both theme backgrounds and surfaces at **4.5:1**. Dark plates (PSMS, contact, case-study headers) always use the dark palette; in dark mode they sit one step lighter than the page.

All colors and radius are CSS variables generated from config. Font tokens select among the three bundled families; adding a completely new font family also requires installing/self-hosting its files and updating the schema's supported families.

### Add a navigation item

Append to `nav` in `src/content/site.yaml`:

```yaml
  - label: Education
    href: "#education"
```

Available anchors: `#work` (when projects exist), each featured project's `#slug`, `#approach`, `#capabilities`, `#record`, `#impact`, `#experience`, `#community`, `#education`, `#contact`. Validation fails on an anchor that does not exist. Full HTTP(S) URLs are also supported. Reordering the array changes desktop and mobile navigation. Adding a link does not create a new section.

### Add a social link

```yaml
  - label: Your link label
    url: https://your-confirmed-url.example
```

Append under `social`. Use the real URL, not the example. Remove the link if you do not have one. Uncomment and fill `phone` only if you want it public.

### Swap the resume PDF

By default, `pnpm build` generates a real one-page `public/resume.pdf` from the YAML content; it is not a dummy file. It is a concise version (two bullets per role). The builder fails clearly if additional content no longer fits.

To supply your own PDF:

1. Save it as `public/kelvin-resume.pdf`.
2. Change `resume.path` in `src/content/site.yaml` to `/kelvin-resume.pdf`.
3. Run `pnpm build`.

Do not replace the generated `public/resume.pdf`: the next build will overwrite it. A custom PDF is checked for existence but not generated or overwritten. The page's print stylesheet separately produces a concise one-page A4 resume for the seed content; future additions may require editorial trimming.

### Edit other content

- Impact metrics: `src/content/impact/impact.yaml`.
- Community: `pnpm new community my-entry`.
- Education: `pnpm new education my-degree`.
- Button labels, headings, status labels and accessibility copy: `src/config/ui.ts`.
- Title block ("Also" items come from `now`), headline, lede, about, relocation, identity, SEO: `src/content/site.yaml`. "Currently" is derived from the newest published role.

## Verification

Install Chromium once:

```sh
pnpm exec playwright install chromium
pnpm build
pnpm test
pnpm test:config
pnpm test:form
pnpm budget
CHROME_PATH="$(node -e "console.log(require('@playwright/test').chromium.executablePath())")" pnpm lighthouse
```

On Linux CI use `pnpm exec playwright install --with-deps chromium`.

- Browser coverage: **375x812 (plus a 360px overflow pass), 430x932, 768x1024, 1366x768, 1600x1000**, both themes: work index and story anchors, genuine screenshots loading, every link resolving, keyboard use, disclosures, the bottom-sheet menu anchored to the viewport, quick contact, theme persistence, no-JS access, SEO assets, no overflow, 44px targets, and axe WCAG 2.2 AA checks on home, case study and 404.
- `test:form` builds with a placeholder Formspree endpoint and mocks Formspree (nothing is sent): native validation blocks empty submissions; a successful submit posts every field plus the honeypot with `Accept: application/json`, announces success and clears the form; a 422 shows Formspree's message and a mailto fallback; a network failure keeps the typed message; the no-JS POST works; axe passes in both themes at 375px and 1366px. It then restores the normal build.
- `test:config` uses the actual scaffold command, creates temporary YAML roles/projects, verifies automatic grouping/sorting and React filtering, checks no-JS project access, hides the role, and deliberately fails a build with an invalid month. It removes only its own files in `finally` and restores a clean build. Do not run it concurrently with another build.
- `budget` launches its own production preview and measures initial first-party JavaScript, including inline scripts, compressed separately with gzip: **under 50,000 bytes**.
- Lighthouse runs three mobile audits and asserts median Performance >=95, Accessibility 100, SEO 100, Best Practices >=95, LCP <2 seconds and CLS <=0.05. Reports stay local in `.lighthouseci/reports`; no report upload to a third-party service.
- Printed and generated resume PDFs are checked for one page.
- CI also builds and smoke-tests a GitHub Pages project subpath.

Browser tests start a dedicated production preview on port 4322; they never reuse a development server on 4321. Lighthouse uses 4331, the bundle check 4341, and the configurability proof 4342.

These are lab measurements, not claims of field performance or a substitute for an accessibility review by users. Font subsets are loaded by Unicode range, only the hero's display face (regular + italic) is preloaded, and fallback metrics reduce font shift. Motion is CSS-only and progressive: scroll-driven reveals, the measured-result bars growing into view, the quick-contact button appearing after the hero, and a native cross-document view transition that carries a project title into its case study. All of it is disabled under `prefers-reduced-motion`. Count-up animation is intentionally omitted; numbers are readable immediately.

### Local verification after the redesign (14 October 2026)

- Build and strict type check: passed, no diagnostics.
- Content/unit tests: 12 passed.
- Browser suite: 41 passed; 4 redundant viewport copies of the desktop-only print test intentionally skipped.
- Contact form proof (mocked Formspree): passed.
- Real YAML scaffolding, grouping, sorting, visibility, project filtering and deliberate invalid-date failure: passed; all temporary entries removed.
- GitHub Pages `/portfolio/` build and mobile smoke/link tests: passed.
- Initial first-party JavaScript: 1,783 bytes gzip (includes the form and quick-contact scripts).
- Three mobile Lighthouse runs: Performance **99 / 99 / 99**, Accessibility, SEO and Best Practices **100** in every run. Median LCP **1.88s** (budget 2.0s), CLS **0**.

These results are from the local production build. The hosted Actions workflows and DNS/TLS setup cannot be verified until a repository and hosting/domain configuration exist. The lockfile is registry-neutral (versions and integrity hashes retained); this environment's direct connection to public npm was unavailable, so a fresh public-registry install remains a hosted-CI check.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `SITE_URL` | Production origin, e.g. `https://your-domain.example`, with no path. |
| `BASE_PATH` | `/` for a custom domain/user site, `/repository/` for a project site. |
| `PUBLIC_FORMSPREE_ENDPOINT` | Optional `https://formspree.io/f/FORM_ID`. |

Copy `.env.example` for local development. **Build/deploy configuration reads shell/CI environment variables**; use `SITE_URL=https://... BASE_PATH=/... pnpm build` for production. Without `SITE_URL`, builds warn and use `https://example.com` for local SEO previews. Do not publish that placeholder.

### Contact form (optional)

The form renders only when `PUBLIC_FORMSPREE_ENDPOINT` is set at build time; otherwise there is no form, no dead button and no extra request. To turn it on:

1. Create a free form at [formspree.io](https://formspree.io), with `kmihingo22@gmail.com` as the recipient, and confirm the verification email.
2. Copy its endpoint, e.g. `https://formspree.io/f/abcdwxyz`. The build fails on any other format.
3. Locally: `PUBLIC_FORMSPREE_ENDPOINT=https://formspree.io/f/abcdwxyz pnpm build`. On GitHub: add a **repository variable** (not a secret; the ID is public in the page) named `PUBLIC_FORMSPREE_ENDPOINT`. The Pages and Cloudflare workflows already pass it through. Re-run the deploy.
4. In Formspree, restrict the form to your production domain and keep reCAPTCHA/spam filtering on.

Behaviour: name, email and message are required, with length limits. The `_gotcha` honeypot catches basic bots, and `_subject` labels the email "Portfolio enquiry — Kelvin Mihingo N.". With JavaScript, it submits in place, announces success or error in a live region, keeps the text on failure, and offers the email address as a fallback. Without JavaScript it is a normal POST to Formspree's confirmation page. No request goes to Formspree until a visitor submits. Mention Formspree in any privacy notice you publish.

Analytics is disabled in YAML. To enable Cloudflare Web Analytics:

```yaml
analytics:
  enabled: true
  provider: cloudflare
  token: YOUR-CLOUDFLARE-BEACON-UUID
```

Use a real UUID token; never place an API secret in this public configuration. Assess applicable privacy/disclosure requirements before enabling any third-party service.

## Publish on GitHub Pages

The project is ready for a repository; no remote, commit or deployment has been created automatically.

1. Create the repository and push this project's root to its `main` branch.
2. In **Settings > Pages > Build and deployment**, choose **GitHub Actions**.
3. The **Quality** workflow tests each pull request and `main` push.
4. After a successful `main` quality run, **Publish GitHub Pages** builds the exact tested commit and deploys it. A manual dispatch is also available for republishing after a Pages domain setting changes.
5. The workflow gets the origin and base path from `actions/configure-pages`, so user repositories, project repositories and custom domains use the correct asset/canonical/sitemap URLs.

Optional repository variable: `PUBLIC_FORMSPREE_ENDPOINT`. No personal access token is needed for Pages deployment.

### Custom domain on GitHub Pages

1. Choose and register a domain; no domain name is assumed here.
2. Add it under **Settings > Pages > Custom domain**. Verify ownership in GitHub when prompted.
3. For a subdomain, create the CNAME record GitHub instructs you to use, pointing to `YOUR-USERNAME.github.io` (not a URL or repository path).
4. For an apex domain, follow GitHub's current A/AAAA or supported ALIAS/ANAME instructions. Do not guess DNS addresses.
5. Wait for DNS/certificate provisioning, then enable **Enforce HTTPS**.
6. Manually run **Publish GitHub Pages** again so canonical URLs, social-image URLs, robots and sitemap match the new domain.

For this Actions-based deployment, the Pages settings control the custom domain; a committed `CNAME` file is not required. Official instructions: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

## Optional Cloudflare Pages

Cloudflare deployment is manual/opt-in to avoid deploying to an unconfigured account.

1. Create a Cloudflare Pages **Direct Upload** project.
2. Set GitHub repository/environment variables:
   - `CLOUDFLARE_PROJECT_NAME`
   - `CLOUDFLARE_SITE_URL` (the chosen custom origin or assigned `pages.dev` origin)
3. Set secrets:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN` scoped to the intended account with Pages edit permission
4. Run **Publish Cloudflare Pages** manually.
5. Add a domain through the Pages project's **Custom domains** settings, follow its DNS instructions, update `CLOUDFLARE_SITE_URL`, and republish.

To use Cloudflare's native Git integration instead of the upload workflow, configure the build command `pnpm build`, output directory `dist`, Node 22.22.0 and the environment variables above.

## Content and design decisions

- All role dates and accomplishments are from the supplied brief. The Microsoft tuning draft is unpublished and undated.
- PSMS is **Building**; only its supplied public reporting interface is labeled live.
- PSMS screenshots are genuine captures of the public portal. The portal's own statistics band is cropped out because those numbers are not verified portfolio facts. Internal PSMS screens were deliberately not used: they may show sensitive case data.
- The Microsoft 365 Copilot and Kenya Power stories are built only from the verified role bullets. Their diagram is labelled as a conceptual scope view, not internal architecture, and the load-time chart is labelled as separate work at Microsoft.
- Approach principles are framing; every `evidence` line is a verified fact. Capability groups lead with evidence, not tool lists, and every original skill is retained.
- The portrait is the owner-supplied photo; no fictitious project, repository URL, testimonials or additional metrics were added.
- More-projects filtering hydrates a React island only when it enters view. No grid appears when there are no nonfeatured projects. Native disclosures and the bottom-sheet navigation work without JS.
- Theme follows the system until explicitly overridden, as specified in the revised brief.
- Domain, the Formspree form ID and the optional analytics token still need owner configuration. OG image, favicon and resume are generated from the actual content, not placeholders.
