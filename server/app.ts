import express, { type ErrorRequestHandler } from "express";
import compression from "compression";
import helmet from "helmet";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { inquirySchema } from "../src/lib/inquiry";
import type { Store } from "./store";

interface AppOptions {
  store: Store;
  siteUrl: string;
  distDir?: string;
  production?: boolean;
  trustProxy?: boolean;
  onSaved?: () => void;
}

export function createApp({
  store,
  siteUrl,
  distDir = resolve("dist"),
  production = false,
  trustProxy = false,
  onSaved,
}: AppOptions) {
  const app = express();
  const origin = new URL(siteUrl).origin;
  app.disable("x-powered-by");
  // Enable only behind a reverse proxy that replaces forwarded headers.
  if (trustProxy) app.set("trust proxy", 1);
  const homeFile = resolve(distDir, "index.html");
  const homeHtml = existsSync(homeFile) ? readFileSync(homeFile, "utf8") : "";
  const inlineHashes = Array.from(
    homeHtml.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
    (match) =>
      `'sha256-${createHash("sha256").update(match[1]).digest("base64")}'`,
  );
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", ...inlineHashes],
          styleSrc: ["'self'"],
          imgSrc: ["'self'"],
          fontSrc: ["'self'"],
          connectSrc: ["'self'"],
          mediaSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: production ? [] : null,
        },
      },
      strictTransportSecurity: production
        ? { maxAge: 31536000, includeSubDomains: true }
        : false,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    }),
  );
  app.use((_req, res, next) => {
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()",
    );
    next();
  });
  app.use(compression());
  app.get("/api/health", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ ok: true });
  });
  app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.post(
    "/api/inquiry",
    (req, res, next) => {
      if (
        req.get("origin") !== origin ||
        req.get("sec-fetch-site") === "cross-site"
      ) {
        res.status(403).json({
          ok: false,
          error: "Please submit the form from this website.",
        });
        return;
      }
      if (!req.is("application/json")) {
        res
          .status(415)
          .json({ ok: false, error: "Please submit a JSON inquiry." });
        return;
      }
      const limit = store.consumeRateLimit(
        req.ip || req.socket.remoteAddress || "unknown",
      );
      if (!limit.allowed) {
        res.setHeader("Retry-After", limit.retryAfter);
        res.status(429).json({
          ok: false,
          error: "Too many attempts. Please try again in an hour.",
        });
        return;
      }
      next();
    },
    express.json({ limit: "16kb", strict: true }),
    (req, res) => {
      // Trap automated submissions without accepting or storing their content.
      if (
        req.body &&
        typeof req.body.website === "string" &&
        req.body.website.trim()
      ) {
        res.json({ ok: true });
        return;
      }
      const result = inquirySchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          ok: false,
          error:
            "Please check your name, email, project details, and privacy consent.",
        });
        return;
      }
      store.save(result.data);
      res.status(201).json({ ok: true });
      onSaved?.();
    },
  );
  app.all("/api/inquiry", (_req, res) => {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, error: "Method not allowed." });
  });
  app.use("/api", (_req, res) => {
    res.status(404).json({ ok: false, error: "Not found." });
  });
  app.use(
    "/assets",
    express.static(resolve(distDir, "assets"), {
      maxAge: "7d",
      index: false,
      dotfiles: "deny",
      redirect: false,
    }),
  );
  app.use(
    express.static(distDir, {
      index: false,
      dotfiles: "deny",
      redirect: false,
      setHeaders: (res) => {
        res.setHeader("Cache-Control", "no-cache");
      },
    }),
  );
  app.get("/", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(homeFile);
  });
  app.get("/privacy", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(resolve(distDir, "privacy/index.html"));
  });
  app.use((_req, res) => {
    res.status(404).setHeader("Cache-Control", "no-cache");
    res.sendFile(resolve(distDir, "404.html"));
  });
  const errorHandler: ErrorRequestHandler = (
    error: { type?: string; status?: number },
    _req,
    res,
    _next,
  ) => {
    const status =
      error.type === "entity.too.large"
        ? 413
        : error.status === 400
          ? 400
          : 500;
    if (status === 500)
      console.error("A server request failed. No request data was logged.");
    res.status(status).json({
      ok: false,
      error:
        status === 413
          ? "Your inquiry is too large. Please shorten your message."
          : status === 400
            ? "Please check the submitted information."
            : "Your inquiry could not be saved. Please try again.",
    });
  };
  app.use(errorHandler);
  return app;
}
