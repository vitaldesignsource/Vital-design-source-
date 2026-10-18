# Vital Design Source

The official Vital Design Source LLC website: a fresh, independent React and TypeScript build with the original heraldic crest, cinematic artwork, six portfolio projects, and a private project inquiry service.

![Vital Design Source](public/assets/og-image.jpg)

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
- `src/lib/content.ts`: project destinations, descriptions, service copy, and form options.
- `src/lib/inquiry.ts`: shared client/server validation contract.
- `server/`: HTTP boundary, SQLite persistence, and optional email queue.
- `server.js`: portable host entry; builds missing or outdated-domain artifacts before starting.
- `site.config.json`: official domain used by the build and server.
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

The first command displays the newest 50 submissions. Treat its output as private. Production storage defaults to `~/.local/share/vital-design-source/inquiries.sqlite`; the CLI uses the same path as the server. To view local development records, prefix the command with `NODE_ENV=development`.

There is no public administration endpoint. Optional SMTP notifications retry from the saved queue; without SMTP, review inquiries through this command. Verify that your host preserves the private storage directory across redeployments.

All original brand artwork and site assets remain proprietary to their respective owners. Third-party code and fonts retain their licenses; see [notices](docs/third-party-notices.md).
