# Vital Design Source

The official Vital Design Source LLC website: a fresh, independent React and TypeScript build with the original heraldic crest, cinematic artwork, six portfolio projects, and a private project inquiry service.

![Vital Design Source](public/assets/og-image.jpg)

## Run locally

Requires **Node.js 24 LTS** and npm. No website builder account, cloud database, or email account is required to run the application.

```sh
npm ci
cp .env.example .env
npm run build
npm start
```

Open <http://localhost:3000>. The inquiry form saves submissions to `data/inquiries.sqlite`. This directory is excluded from Git and must stay private. Local builds disable search indexing.

For development, first build once, then run these in separate terminals:

```sh
SITE_URL=http://localhost:5173 npm run dev:server
npm run dev
```

Vite proxies `/api` to the local Node server. Match the browser origin exactly; `localhost` and `127.0.0.1` are different origins.

## Deploy

See [deployment instructions](docs/deployment.md) for Node, Docker, HTTPS, persistent storage, notification email, retention, backups, and operational checks. Use a Node host with a persistent volume. GitHub Pages alone cannot run the inquiry API.

Set `SITE_URL` to your verified HTTPS origin **at both build time and runtime**. Production also requires a random `RATE_LIMIT_SECRET`. No custom domain or email address has been assumed.

## Validate

```sh
npx playwright install chromium
npm run validate
```

This runs strict TypeScript checks, ESLint (including accessibility rules), API/storage tests, production builds, and desktop/mobile browser tests with axe accessibility checks. To use an existing Chromium installation, set `CHROMIUM_PATH=/path/to/chromium`. CI runs the same checks.

## Maintain

- `src/components/`: accessible page sections and interactions.
- `src/lib/content.ts`: project destinations, descriptions, service copy, and form options.
- `src/lib/inquiry.ts`: shared client/server validation contract.
- `server/`: HTTP boundary, SQLite persistence, and optional email queue.
- `scripts/build.ts`: pre-rendered home, privacy and 404 pages; metadata, JSON-LD, sitemap, robots; bundled Node server.
- `public/assets/`: self-hosted, deployable brand and responsive image assets.
- `source-assets/`: retained artwork and portfolio preview masters.
- `tests/`: behavior, persistence, abuse boundary, and accessibility checks.

Use `npm run assets` after changing image masters. See [asset provenance](docs/assets.md) before replacing the official logo or refreshing previews. The website includes no testimonials, client performance metrics, or invented project outcomes.

## Review inquiries

Run only from an authorized server terminal:

```sh
npm run inquiries
npm run inquiries -- --delete <inquiry-uuid>
```

The first command displays the newest 50 submissions. Treat its output as private. There is no public administration endpoint. Optional SMTP notifications retry from the durable queue; without SMTP, review the database through this command.

All original brand artwork and site assets remain proprietary to their respective owners. Third-party code and fonts retain their licenses; see [notices](docs/third-party-notices.md).
