# Deployment and operations

## Hostinger: deploy vitaldesignsource.com

Use **Node.js Web App**, import `vitaldesignsource/Vital-design-source-` from GitHub, and select:

| Setting         | Value     |
| --------------- | --------- |
| Framework       | Express   |
| Branch          | main      |
| Node version    | 24.x      |
| Root directory  | ./        |
| Package manager | npm       |
| Entry file      | server.js |

Connect **vitaldesignsource.com** to this Node app and deploy. There are **no required environment variables**. Remove manual environment rows from earlier setup attempts, especially `SITE_URL=https://vita.pigeonshield.net`, `DATABASE_PATH=./data/inquiries.sqlite`, and an empty `PORT`. Hostinger supplies its own port; the application defaults to production mode and the official HTTPS domain.

The source includes a stable `server.js` entry. Hostinger's Express preset runs the package build, and the entry also builds missing artifacts before starting. It serves the compiled website and inquiry API together. Build tools are production dependencies, so installing with development dependencies omitted is supported. See [Hostinger's Express documentation](https://docs.hostinger.com/node.js/overview-1/express).

The entry loads the compiled backend synchronously with `createRequire`. Hostinger starts the entry through `require()`, which Node 24 supports for ESM only when its static import graph contains no top-level `await`. Keep the entry and its static dependencies synchronous; `npm run test:deployment` checks the managed loader as well as direct Node startup.

Use the Node app deployment rather than a PHP/HTML Git deployment into `public_html`. Publishing the source files directly serves an unbuilt React template and produces a blank website.

If the domain is still attached to the earlier PHP/HTML deployment, reassign it to this Node app through Hostinger's domain settings. Keep other websites and databases unchanged.

### Check the deployed site

Open <https://vitaldesignsource.com> and <https://vitaldesignsource.com/api/health>. The first should show the complete site; the second should return `{"ok":true}`. Confirm `/privacy`, `/sitemap.xml`, and `/robots.txt` load too. A deployment-success thumbnail alone does not verify the application.

Submit a test inquiry, then review it in an authorized server terminal:

```sh
npm run inquiries
```

Inquiries are saved privately even when email notifications are off. No email delivery is claimed until SMTP is configured. The default production database is `~/.local/share/vital-design-source/inquiries.sqlite`, outside the application release directory. The app creates its private directory and generates a persistent random rate-limit key automatically.

Hostinger manages deployment directories such as `public_html` and `hbuilds`. The home-directory default avoids those release directories, but persistence depends on the hosting account. Verify the test inquiry survives one redeployment, and back up private storage. If Hostinger provides a different persistent location, set the optional `DATABASE_PATH` override to that private absolute path.

Delete the test inquiry after checking it:

```sh
npm run inquiries -- --delete <inquiry-uuid>
```

## Optional settings

The official domain is configured once in `site.config.json`. The same default is used for metadata, canonical links, structured data, sitemap, and form-origin checks. Ordinary deployments to vitaldesignsource.com need no `.env` file.

For another domain or a temporary preview, set `SITE_URL` to that app's exact HTTPS origin at build time and runtime. For example:

```dotenv
SITE_URL=https://vita.pigeonshield.net
```

Redeploy when changing this value. The `server.js` entry rebuilds when the existing metadata uses a different origin. Remove the override when moving to vitaldesignsource.com. The server rejects invalid production origins and mismatched compiled metadata.

Other optional overrides:

| Variable            | Purpose                                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_PATH`     | Private persistent database path; defaults to `~/.local/share/vital-design-source/inquiries.sqlite` in production.    |
| `HOST`              | Bind address; defaults to `0.0.0.0`.                                                                                  |
| `PORT`              | Listening port; normally supplied by the host, otherwise `3000`.                                                      |
| `RATE_LIMIT_SECRET` | Override the automatically generated private key with at least 32 random characters.                                  |
| `TRUST_PROXY`       | Set to `1` only after verifying exactly one trusted proxy replaces incoming forwarding headers; defaults to disabled. |

The app ignores spoofed forwarding headers by default. No manual rate-limit secret is needed. Avoid leaving incomplete overrides from earlier setup attempts.

### Email notifications

To receive inquiry emails, configure all of the following using your mail provider's real settings:

```dotenv
SMTP_HOST=smtp.your-provider.example
SMTP_PORT=465
SMTP_USER=your-provider-user
SMTP_PASS=your-provider-secret
INQUIRY_FROM=Studio <verified-sender@your-domain.example>
INQUIRY_TO=your-real-studio-inbox@your-domain.example
```

These are illustrative values. Keep credentials in the host's protected environment settings, never in Git. Port 465 uses TLS; other ports require STARTTLS. TLS verification remains enabled. The sender and recipient come only from server configuration; the validated visitor email is used as Reply-To. Messages contain plain text.

Saved inquiries remain queued until SMTP delivery succeeds, with retries at startup and every minute. An SMTP outage does not discard saved inquiries. Delivery is at least once: a process failure after sending but before recording success can cause a repeat notification with the same reference UUID. Configure SPF/DKIM/DMARC with your provider and verify a test email reaches the real inbox.

Without SMTP, review inquiries through the private CLI regularly:

```sh
npm run inquiries
npm run inquiries -- --all
npm run inquiries -- --delete <inquiry-uuid>
npm run inquiries -- --prune
```

The commands use the same production database path and optional overrides as the server. Run them as the application user from its project directory. The default output is the newest 50 records; `--all` caps output at 10,000 rows. Output contains personal information; keep it out of public logs and support tickets. There is no public administration endpoint.

## Other Node hosts

The application uses one Node.js 24 LTS process for pre-rendered HTML, React hydration, self-hosted images/fonts, and the same-origin inquiry API. No website builder account or runtime is required.

On a Node host with a writable persistent home directory:

```sh
npm ci
npm run build
npm start
```

The default domain is vitaldesignsource.com. Configure its DNS and HTTPS at the host's reverse proxy, forward requests to the application's port, and supervise the process with restart on failure. `npm start` can also build a fresh source checkout directly. The included `Caddyfile` serves the official domain and redirects its `www` alias to the canonical domain.

For a VM with storage outside the application user's home, set `DATABASE_PATH` to a private persistent absolute path such as `/var/lib/vital-design-source/inquiries.sqlite`. Give the application user ownership of its directory and mode `700`. If using a protected `.env` file, set its mode to `600`; `.env.example` contains commented optional settings.

Use a single process with local persistent storage. Static hosting, ephemeral serverless filesystems, independent replicas, and network filesystems do not suit this SQLite implementation. Horizontal scaling requires a shared database and rate limiter.

## Docker

The Dockerfile builds for vitaldesignsource.com and runs as an unprivileged user. Mount a named volume for private inquiry storage:

```sh
docker build -t vital-design-source .
docker volume create vital-inquiries
docker run -d --name vital-design-source \
  --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  -v vital-inquiries:/app/data \
  vital-design-source
```

Terminate HTTPS with Caddy or your host's proxy. For another domain, pass the same `SITE_URL` using `--build-arg` during the build and `-e` at runtime. Add optional SMTP settings using `--env-file /secure/path/vital.env`. Never commit that file. For bind mounts, grant the container's `node` user access to the private directory.

Use `docker exec vital-design-source npm run inquiries` to review records. Keep the same volume when replacing containers.

## Data protection and backups

Every accepted inquiry is saved with a generated UUID before the client receives success. Website messages say “received”; they do not claim email delivery. Storage failures return an error and preserve browser input. A browser timeout after the server commits can produce a duplicate on retry; compare timestamps and email addresses when reviewing records.

The application enforces exact-origin checks, JSON content type, a 16 KiB request cap, strict field validation, consent, honeypot filtering, and persistent rate limits of 60 attempts per hour per network address and five per normalized email address. Keys use HMAC; the database does not store raw IP addresses. Configure host edge limits as appropriate for traffic. This single-instance rate limiter is not a distributed bot-defense service.

Security headers include a same-origin CSP without `unsafe-inline` or `unsafe-eval`, JSON-LD hashes, HSTS in production, framing restrictions, MIME sniffing protection, restrictive permissions, and a referrer policy. Preserve these at the reverse proxy. Inquiry responses are not cacheable. The application does not log inquiry content or SMTP errors that might contain it; review the host's own log and backup policies separately.

Inquiries older than 180 days and expired rate-limit records are removed at startup and every minute. Deletion affects application storage, not emails or external backups. Keep encrypted backups with a retention limit, test restoration, and honor deletion requests across copies. Disk encryption and account access control belong to the host; SQLite files are not application-encrypted.

Back up a running database with SQLite's online backup facility, such as `sqlite3 /private/path/inquiries.sqlite '.backup /secure/path/backup.sqlite'`, or stop the app before copying the database. Do not copy only the main file during WAL writes. Keep backups private and outside Git and `dist`.

## Validation and rollback

Run `npm run validate` before release. It covers TypeScript, lint, API/storage behavior, the production build, and browser/accessibility checks. Browser tests use synthetic records in temporary databases. Production defaults and local development are separate: use `NODE_ENV=development npm start` for a local build at `http://localhost:3000`, with test storage in `data/inquiries.sqlite` and search indexing disabled.

After deployment, verify the site, API health, privacy page, branded 404 response, canonical/OG URLs, sitemap, robots, TLS, and CSP. Confirm the inquiry record and persistence as described above. Check the six project links, mobile navigation, portfolio filters, keyboard focus, and reduced motion. Hidden Forces currently opens a private release gate; PigeonShield uses its verified `pigeonshield.net` destination.

Rollback by redeploying the previous Git commit or image while retaining the same private database or volume. Do not reset inquiries when replacing application code. The schema uses `CREATE TABLE IF NOT EXISTS`; future schema changes require explicit migrations and a backup.
