# Vital Design Source

The official Vital Design Source LLC website: an independent React and TypeScript build with the preserved original heraldic crest, an animated SVG crest refinement, a dark jade and liquid-chrome theme, six portfolio projects, and a private project inquiry service.

![Vital Design Source](public/assets/og-neural.jpg)

The studio offers web design, development, branding, SEO, intelligent automation, and human-directed AI design and motion. The AI Design Lab lets visitors explore curated visual directions and pause motion. It is an interactive art-direction study, not a live AI generation service.

## Deploy on Hostinger

Import this repository as a **Node.js Web App** with these settings:

| Setting         | Value     |
| --------------- | --------- |
| Framework       | Express   |
| Branch          | main      |
| Node version    | 24.x      |
| Root directory  | ./        |
| Package manager | npm       |
| Entry file      | server.js |

Connect **vitaldesignsource.com** and deploy. No environment variables or email account are required. The app builds automatically when needed, uses the official domain, generates its private security key, and saves inquiries outside the deployment directory.

If you entered settings during an earlier setup attempt, remove those manual environment rows, especially the preview `SITE_URL` and relative `DATABASE_PATH`. Hostinger supplies the port automatically.

See [deployment instructions](docs/deployment.md) for domain switching, inquiry access, optional email notifications, backups, and other hosts. The inquiry API requires a Node host; a PHP/HTML file deployment or GitHub Pages cannot run it.

## Run locally

Requires **Node.js 24 LTS** and npm:

```sh
npm ci
NODE_ENV=development npm start
```

Open <http://localhost:3000>. The first start builds the application. Development mode saves test inquiries to `data/inquiries.sqlite` and disables search indexing. This directory is excluded from Git and must stay private.

For development, first build once, then run these in separate terminals:

```sh
SITE_URL=http://localhost:5173 npm run dev:server
npm run dev
```

Vite proxies `/api` to the local Node server. Match the browser origin exactly; `localhost` and `127.0.0.1` are different origins.

## Validate

```sh
npx playwright install chromium
npm run validate
```

This runs strict TypeScript checks, ESLint (including accessibility rules), API/storage tests, production builds, and desktop/mobile browser tests with axe accessibility checks. To use an existing Chromium installation, set `CHROMIUM_PATH=/path/to/chromium`. CI runs the same checks.

CI also runs `npm run test:deployment`: a disposable production-only install that checks automatic builds, default official-domain metadata, private inquiry storage, and restart persistence without manual environment setup.

## Maintain

- `src/components/`: accessible page sections and interactions.
- `src/components/DesignLab.tsx`: curated visual-direction explorer with selection controls, live brief updates, and a motion toggle.
- `src/components/CrestSculpture.tsx` and `src/lib/crest-scene.ts`: optional, dynamically loaded Three.js crest with actual vector extrusion, local studio reflections, and pointer-responsive lighting. The SVG appears immediately and remains the fallback without WebGL. Rendering targets 30fps, caps pixel density at 1.5, and sleeps when the pointer settles, offscreen, when hidden, or when motion is disabled. Hero and Design Lab controls respect reduced motion.
- `src/components/ProjectShowcase.tsx` and `src/lib/project-studies.ts`: accessible visual studies for the six projects, with full/detail views, factual image observations, and live-site links.
- `src/components/BrandCrest.tsx`: inline SVG navigation crest with unique IDs, a visible filled base, a brief reveal and highlight, hover interaction, and static reduced-motion styling.
- `src/lib/content.ts`: project destinations, descriptions, service copy, and form options.
- `src/lib/crest-geometry.json`: checked-in vector paths for the refined crest.
- `src/lib/design-directions.ts`: typed art-direction presets, briefs, and material labels for the AI Design Lab.
- `src/lib/inquiry.ts`: shared client/server validation contract.
- `server/`: HTTP boundary, SQLite persistence, and optional email queue.
- `server.js`: portable host entry; builds missing or outdated-domain artifacts before starting.
- `site.config.json`: official domain used by the build and server.
- `scripts/build.ts`: pre-rendered home, privacy and 404 pages; metadata, JSON-LD, sitemap, robots; bundled Node server.
- `scripts/brand-assets.ts`: generates standalone SVG crest variants and an outlined wordmark from checked-in paths.
- `public/assets/`: self-hosted, deployable brand and responsive image assets.
- `source-assets/`: retained artwork and portfolio preview masters.
- `tests/`: behavior, persistence, abuse boundary, and accessibility checks.

Use `npm run assets` after changing image masters; it also regenerates the SVG brand exports. To regenerate only the brand exports, run `npm run assets:brand`. Normal builds and SVG export generation require no Python tooling.

The standalone brand set includes ink, silver, and briefly animated crests plus an outlined wordmark. View it at `/assets/brand/preview.html` on the running site. Original brand files remain intact and continue to appear in the Studio section, footer, social image, and favicons. See [asset provenance](docs/assets.md) for the refinement workflow and optional tracing tools. The website includes no testimonials, client performance metrics, or invented project outcomes.

## Review inquiries

Run only from an authorized server terminal:

```sh
npm run inquiries
npm run inquiries -- --delete <inquiry-uuid>
```

The first command displays the newest 50 submissions. Treat its output as private. Production storage defaults to `~/.local/share/vital-design-source/inquiries.sqlite`; the CLI uses the same path as the server. To view local development records, prefix the command with `NODE_ENV=development`.

There is no public administration endpoint. Optional SMTP notifications retry from the saved queue; without SMTP, review inquiries through this command. Verify that your host preserves the private storage directory across redeployments.

All original brand artwork and site assets remain proprietary to their respective owners. Third-party code and fonts retain their licenses; see [notices](docs/third-party-notices.md).
