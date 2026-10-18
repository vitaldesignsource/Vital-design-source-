# Deployment and operations

## Supported architecture

One Node.js 24 LTS process serves pre-rendered HTML, React hydration, local fonts/images, and a same-origin inquiry API. SQLite lives on a private persistent disk. No Higgsfield, Cloudflare, or other website builder runtime is used. The site has no tracking SDK, external font request, authentication dependency, or public database interface.

Use a VM, container host, or managed Node service with persistent local storage. A static-only host cannot process inquiries. Do not deploy this SQLite architecture to ephemeral serverless functions, a read-only filesystem, multiple independent replicas, or a network filesystem. For horizontal scaling, replace the storage adapter and shared rate limiter with a managed database.

## Build and start on a Node host

1. Point a verified domain to the host and configure HTTPS at the reverse proxy. An example Caddy configuration is included; replace its example hostname. Set the proxy to replace incoming forwarded headers and restrict direct access to the Node port.
2. Install Node 24, clone this repository, and run `npm ci`.
3. Create a protected `.env` file (mode `600`), starting from `.env.example`:

```dotenv
NODE_ENV=production
SITE_URL=https://your-domain.example
HOST=127.0.0.1
PORT=3000
DATABASE_PATH=/var/lib/vital-design-source/inquiries.sqlite
RATE_LIMIT_SECRET=replace-with-a-random-secret
TRUST_PROXY=1
```

Generate the secret with `openssl rand -hex 32` and put the result into the deployment's secret manager or protected environment file. Never commit it. Set `TRUST_PROXY=1` only when exactly one trusted reverse proxy stands between the application and the public network; otherwise leave it `0`. The app ignores spoofed forwarding headers by default.

4. Create the database directory, owned by the application user with mode `700`. Keep it outside the public `dist` directory. Use a persistent volume and disk encryption supplied by your host.
5. Run `npm run build`. The build reads `SITE_URL` from the environment or `.env`, pre-renders all public routes, and generates correct absolute canonical URLs, sharing metadata, JSON-LD, `sitemap.xml`, and `robots.txt`.
6. Run `npm start` under your host's process supervisor. Restart on failure. The server checks that production uses HTTPS, a non-local origin, a sufficiently long secret, and metadata built for the same origin.

Changing domains requires rebuilding and restarting with the same new `SITE_URL`. Local HTTP builds are intentionally `noindex` with `Disallow: /`; a public HTTPS build enables indexing. Set the final domain before submitting the sitemap to search engines.

## Hostinger Node.js web app

Use **Node.js Web App**, not the PHP/HTML Git deployment into `public_html`. Publishing the repository as static files serves the unbuilt source template and cannot run the inquiry API.

Import this GitHub repository with these settings:

| Setting         | Value                  |
| --------------- | ---------------------- |
| Framework       | Express                |
| Branch          | main                   |
| Node version    | 24.x                   |
| Root directory  | ./                     |
| Package manager | npm                    |
| Entry file      | build/server/index.mjs |

[Hostinger's Express documentation](https://docs.hostinger.com/node.js/overview-1/express) confirms that the build-script and output-directory fields are hidden for Express: the package's build script still runs and the complete project root is deployed. The existing `build` script produces both `dist/` and `build/server/`; the entry file is relative to the project root. The four tools required by that build are production dependencies so an install that omits development dependencies still works. Do not set the root directory to `public_html` or the entry to the nonexistent default `server.js`.

Set `NODE_ENV=production`, `SITE_URL` to the exact HTTPS origin connected to this app, `HOST=0.0.0.0`, and a random `RATE_LIMIT_SECRET` of at least 32 characters. Remove a manually entered `PORT` variable so Hostinger can supply its assigned port. Keep `TRUST_PROXY=0` until the host confirms the number and behavior of its trusted reverse proxies. Remove unused blank SMTP variables; add real notification settings later through Hostinger's protected environment settings.

For a temporary preview, `DATABASE_PATH=./data/inquiries.sqlite` is sufficient for synthetic test inquiries only. Before accepting real inquiries, obtain a private, writable, persistent absolute storage path from Hostinger **outside both `public_html` and `hbuilds`**, set `DATABASE_PATH` there, and verify a test record survives redeployment. Hostinger replaces deployment-managed files; this project cannot guarantee persistence for a database inside those directories. If the plan does not offer suitable persistent storage, use a host with a persistent volume or replace the SQLite adapter with a durable database.

After deployment, verify the actual website and `/api/health`, not only Hostinger's deployment-success thumbnail. If using a temporary domain first, update `SITE_URL` when moving to the official domain and redeploy so the build generates metadata for the new origin. Configure and verify SMTP or regularly use the private inquiry CLI before launch.

## Docker

The Dockerfile runs the application as an unprivileged user. Build with your verified public origin, then mount a named volume:

```sh
docker build --build-arg SITE_URL=https://your-domain.example -t vital-design-source .
docker volume create vital-inquiries
docker run -d --name vital-design-source \
  --restart unless-stopped \
  --env-file /secure/path/vital.env \
  -e SITE_URL=https://your-domain.example \
  -e DATABASE_PATH=/app/data/inquiries.sqlite \
  -e HOST=0.0.0.0 \
  -p 127.0.0.1:3000:3000 \
  -v vital-inquiries:/app/data \
  vital-design-source
```

`vital.env` must contain `RATE_LIMIT_SECRET` and any SMTP configuration; it must not be committed. Terminate TLS with Caddy or your host's HTTPS proxy. For bind mounts, grant the container's `node` user access to the private directory. Do not publish port 3000 directly to the Internet.

## Inquiry delivery

Every accepted inquiry is saved with a generated UUID before the client receives success. Website messages say “received”; they do not claim an email was delivered. Storage failures return an error and preserve input in the browser. A browser timeout after the server commits can lead to a duplicate on retry; inspect timestamps and email addresses when reviewing submissions.

To receive notifications, configure all of:

```dotenv
SMTP_HOST=smtp.your-provider.example
SMTP_PORT=465
SMTP_USER=your-provider-user
SMTP_PASS=your-provider-secret
INQUIRY_FROM=Studio <verified-sender@your-domain.example>
INQUIRY_TO=your-real-studio-inbox@your-domain.example
```

These are illustrative values. Use a verified sender and real inbox supplied by the studio. Port 465 uses TLS; other ports require STARTTLS. TLS verification stays enabled. The sender and recipient come only from server configuration; the validated visitor email is used as Reply-To. Emails contain plain text and cannot load visitor-provided files or URLs.

Saved messages remain queued until successful SMTP delivery and retry at startup and every minute. SMTP outage does not lose inquiries. Delivery is at least once: a process failure after sending but before recording success can cause a repeat notification; each email includes the same reference UUID. Configure SPF/DKIM/DMARC with your mail provider and verify delivery in your real inbox after launch.

Without SMTP, use the operator CLI regularly:

```sh
npm run inquiries
npm run inquiries -- --all
npm run inquiries -- --delete <inquiry-uuid>
npm run inquiries -- --prune
```

Commands use the same `.env` and `DATABASE_PATH`. Inside Docker, run `docker exec vital-design-source npm run inquiries`. Output contains personal data; do not copy it into public logs or support tickets. No remote admin API is exposed. The CLI defaults to 50 rows; `--all` caps output at 10,000 rows.

## Security and retention

The server enforces exact configured origin, JSON content type, a 16 KiB request cap, strict field validation, consent, honeypot filtering, and a persistent five-attempts-per-hour network limit. Rate limit keys use HMAC; the application does not store raw IP addresses. Configure your host's edge request limits as appropriate for traffic. The SQLite rate table is suitable for a single instance, not a distributed bot defense.

Security headers include a strict same-origin CSP (no `unsafe-inline` or `unsafe-eval`), JSON-LD hashes, HSTS in production, framing restrictions, MIME sniffing protection, restrictive permissions, and a referrer policy. Avoid stripping these at the reverse proxy. Inquiry responses are not cacheable. The app does not log submitted information or SMTP errors that might contain it. Check the host's own access log and backup policies separately.

The app removes inquiries older than 180 days and network rate records older than one hour at startup and every minute. Deletion affects application storage, not emails or external backups. Keep encrypted backups with a documented retention limit, restore-test them, and honor deletion requests across copies. Disk encryption and access control belong to the host; SQLite files are not application-encrypted.

Back up a running SQLite database using its online backup facility (e.g. `sqlite3 /path/inquiries.sqlite '.backup /secure/path/backup.sqlite'`), or stop the app and copy the database safely. Do not copy only the main file while WAL writes are active. Keep backups outside `dist` and out of Git.

## Launch checks and rollback

- Run `npm run validate` using a local preview build before release. Browser tests create synthetic records in `/tmp/vital-e2e-<random-id>.sqlite`, never in the production database.
- Build again with the final HTTPS `SITE_URL`; start with matching settings.
- Verify `/api/health` returns `{"ok":true}`, `/privacy` returns 200, and an unknown path returns a branded 404.
- Check canonical/OG URLs, `/sitemap.xml`, `/robots.txt`, TLS, and CSP in the deployed response.
- Submit one real test inquiry from the deployed origin. Confirm it through the private CLI and, if configured, in the real inbox. Delete the test record afterward.
- Check all six destinations manually. Hidden Forces currently opens a private release gate. PigeonShield uses the verified canonical `pigeonshield.net` destination.
- Confirm mobile navigation, project filters, keyboard focus, and reduced motion on a physical device.

Rollback by redeploying the previous Git commit/image **with the same persistent database volume**. Do not reset or overwrite inquiries when replacing application code. The initial schema uses `CREATE TABLE IF NOT EXISTS`; future schema changes require explicit migrations and a backup before rollout.
