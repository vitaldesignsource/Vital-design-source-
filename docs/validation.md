# Validation record

Validated October 18, 2026 in Node.js 24.19.0 with headless Chromium.

- `npm run typecheck`: passed, strict TypeScript.
- `npm run lint`: passed, including React Hooks and JSX accessibility rules.
- `npm test`: 16 API/storage tests passed. Covers durable acknowledgement, persistence across restart, strict field validation, missing consent, forged origins, content types, malformed/oversized requests, honeypot discard, persistent rate limiting, spoofed forwarding headers, HMAC identifiers, retention, private file modes, and production security headers.
- `npm run build`: passed. Produces pre-rendered home/privacy/404 HTML, responsive image references, JSON-LD, social metadata, sitemap/robots, and standalone Node server/CLI bundles.
- `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`: 15 passed, one intentional skip of the mobile navigation test in the desktop project. Covers filters, all six destinations, external-link attributes, service disclosure, real API submission, validation focus, success focus, network error recovery, mobile dialog and Escape, anchor positioning, metadata, route status, all six lazy-loaded portfolio previews, original footer crest, and reduced motion.
- axe WCAG 2 A/AA and WCAG 2.1 AA automated checks: no reported violations on home/privacy in desktop and mobile, or in the open mobile navigation. Automated checks complement manual review; they do not establish full accessibility conformance.
- Visual review: desktop (1440 × 1000), mobile (390 × 844). Additional layout checks at widths 320, 360, 768, 1024, and 1920 found no horizontal overflow or clipped headings. Retained hero screenshots are in `docs/previews/`.
- `npm audit --omit=dev --audit-level=moderate`: zero known production dependency vulnerabilities at validation time.
- `npm run format:check` and `git diff --check`: passed.

External destinations were read with TLS verification enabled. Aetherica, Hidden Forces, Astera, Sky Mathis, and Three Magi Press returned public responses. The old 3 Magi domain redirects to `threemagipress.com`. Hidden Forces has a private release gate. The reference’s `pigeonshield.com` returns bot protection; the owner’s source identifies `pigeonshield.net` as canonical. That matching public website returned 200 and is used for the final link. The public repository supplies its labeled source preview. No gates were solved or credentials submitted.

Not exercised: live hosting/DNS/TLS configuration, real SMTP delivery (no mail credentials were supplied), and the optional Docker image. The portable Node build and same-origin API run locally. Configure the production origin, storage, HTTPS, and optional email provider using `docs/deployment.md`, then perform its launch checks on the actual host.
