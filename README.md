# Kelvin Mihingo

A quiet, single-page portfolio. Warm white, large type, a blue accent, and a linear reading order: introduction, selected work, experience, contact.

Laptop typography uses 17px body copy, 16px supporting text and links, and a 14px minimum for metadata. Mobile sizes adapt separately; print keeps its compact one-page layout.

Static Astro HTML and plain CSS. No client-side JavaScript, framework hydration, analytics, remote fonts, theme switcher, or contact-form service. One self-hosted Latin font and an optimized portrait keep the initial page below **150 KB uncompressed**.

## Run locally

Use the Node version in `.node-version` and pnpm 10.32.1.

```sh
corepack enable
pnpm install
pnpm dev
```

```sh
pnpm check         # Astro / TypeScript
pnpm test:unit     # content validation, ordering, safe paths
pnpm build         # validate content, generate brand assets, build HTML
pnpm test:e2e      # responsive, accessibility, links, PDF, no-JS and print tests
pnpm budget        # zero executable JS; initial page resources < 150 KB
pnpm lighthouse    # performance, accessibility, SEO and layout-shift gates
pnpm preview
```

Browser checks use Chromium: `pnpm exec playwright install chromium` if it is not installed.

## Content

- [Site identity](src/content/site.yaml): short introduction, current focus, contact links, education, and SEO.
- [Selected work](src/content/projects/): one YAML file per project. `order` controls position; `visible: false` hides an entry. Keep summaries and outcomes to one sentence each. Technology lists wrap naturally and have no item limit. A project can omit its link when there is no public artifact.
- [Experience](src/content/experience/): compact roles, sorted newest first. Quote `YYYY-MM` dates; `end` can be `present`.
- [Resume](public/resume.pdf): the supplied PDF, committed and served unchanged. Both resume links open it in a new tab, as do project, GitHub and LinkedIn links. Builds **never generate or overwrite it**.
- [Portrait](src/assets/portrait.jpeg): Astro resizes and re-encodes this into WebP, displayed in a circular border on desktop and mobile; the original is not served.
- [Styles](src/styles/global.css): the complete visual system and print layout.

The November 2026 content refresh uses the supplied resume and the public COPS portal. Microsoft roles now distinguish post-training/evaluation (August 2026 onward) from Copilot platform work (February 2021–July 2026). COPS (Command, Operations and Policing System) includes reporting, tracking, and verification. PSMS remains its internal codename; the existing `psms` portfolio slug and `kenya.psms.africa` URL are preserved. The public Kenya counties API is linked separately; empty repositories and tutorial forks are not presented as original work.

Project URLs under `/projects/<slug>/` redirect to their section on the home page, preserving incoming links without maintaining separate case studies.

## Deployment

GitHub Pages is the primary target: <https://mihingo.github.io/me/>.

The Quality workflow runs checks before the Pages workflow publishes the same successful commit on `main`. Configure **Settings → Pages → Source → GitHub Actions**. The Pages workflow obtains its origin and repository base path from GitHub.

To reproduce the published path locally:

```sh
SITE_URL=https://mihingo.github.io BASE_PATH=/me/ pnpm build
BASE_PATH=/me/ pnpm test:e2e
pnpm preview
```

`SITE_URL` must be an origin without a path. `BASE_PATH` defaults to `/` for local development. The optional Cloudflare workflow remains available for an explicitly configured custom deployment; see its repository variables and secrets in [.github/workflows/cloudflare.yml](.github/workflows/cloudflare.yml).

Social preview and favicon assets are generated at build time by [scripts/assets.ts](scripts/assets.ts). The resume is validated, not generated.
