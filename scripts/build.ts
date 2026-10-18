import "dotenv/config";
import { build as viteBuild } from "vite";
import { build } from "esbuild";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { projects, services } from "../src/lib/content";
import { getSiteUrl } from "../server/config";

const siteUrl = getSiteUrl();
const parsed = new URL(siteUrl);
const isPublic =
  parsed.protocol === "https:" &&
  !["localhost", "127.0.0.1"].includes(parsed.hostname);
await viteBuild();
await mkdir("build/server", { recursive: true });
await build({
  entryPoints: ["src/App.tsx"],
  outfile: "build/prerender.mjs",
  platform: "node",
  format: "esm",
  bundle: true,
  packages: "external",
  jsx: "automatic",
});
const { App } = (await import(
  pathToFileURL(resolve("build/prerender.mjs")).href
)) as typeof import("../src/App");
const template = await readFile("dist/index.html", "utf8");
const escape = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const schema = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Vital Design Source LLC",
      url: siteUrl,
      logo: `${siteUrl}/assets/brand/vital-logo-original.webp`,
      description:
        "Independent creative studio for web design, development, branding, SEO, and intelligent automation.",
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Creative and digital services",
        itemListElement: services.map((service) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: service.title,
            description: service.description,
          },
        })),
      },
    },
    {
      "@type": "WebSite",
      name: "Vital Design Source",
      url: siteUrl,
      publisher: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "CollectionPage",
      "@id": `${siteUrl}/#work`,
      name: "Selected work",
      url: `${siteUrl}/#work`,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: projects.map((project, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "CreativeWork",
            name: project.name,
            url: project.url,
            image: `${siteUrl}/assets/projects/${project.image}-1200.webp`,
            description: project.description,
          },
        })),
      },
    },
  ],
}).replaceAll("<", "\\u003c");

for (const page of [
  {
    path: "/",
    file: "dist/index.html",
    title: "Vital Design Source — Design with a pulse.",
    description:
      "An independent creative studio for distinctive websites, brands, SEO, and intelligent automation. Explore our work and start a conversation.",
  },
  {
    path: "/privacy",
    file: "dist/privacy/index.html",
    title: "Privacy notice — Vital Design Source",
    description:
      "How Vital Design Source handles project inquiries, protects your information, and respects your privacy.",
  },
  {
    path: "/404",
    file: "dist/404.html",
    title: "Page not found — Vital Design Source",
    description:
      "Find your way back to Vital Design Source, an independent creative studio.",
  },
]) {
  const head = [
    `<meta name="description" content="${escape(page.description)}" />`,
    `<meta name="robots" content="${isPublic && page.path !== "/404" ? "index,follow" : "noindex,nofollow"}" />`,
    ...(page.path !== "/404"
      ? [`<link rel="canonical" href="${siteUrl}${page.path}" />`]
      : []),
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Vital Design Source" />`,
    `<meta property="og:title" content="${escape(page.title)}" />`,
    `<meta property="og:description" content="${escape(page.description)}" />`,
    `<meta property="og:url" content="${siteUrl}${page.path}" />`,
    `<meta property="og:image" content="${siteUrl}/assets/og-image.jpg" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="Vital Design Source — distinctive websites, brands, and intelligent systems" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escape(page.title)}" />`,
    `<meta name="twitter:description" content="${escape(page.description)}" />`,
    `<meta name="twitter:image" content="${siteUrl}/assets/og-image.jpg" />`,
    ...(page.path === "/"
      ? [`<script type="application/ld+json">${schema}</script>`]
      : []),
  ].join("\n    ");
  const html = template
    .replace(
      "<!--app-html-->",
      renderToString(createElement(App, { path: page.path })),
    )
    .replace("<!--site-head-->", head)
    .replace(/<title>.*?<\/title>/, `<title>${escape(page.title)}</title>`);
  await mkdir(resolve(page.file, ".."), { recursive: true });
  await writeFile(page.file, html);
}
await writeFile(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/</loc></url><url><loc>${siteUrl}/privacy</loc></url></urlset>\n`,
);
await writeFile(
  "dist/robots.txt",
  `User-agent: *\n${isPublic ? "Allow: /\nDisallow: /api/" : "Disallow: /"}\nSitemap: ${siteUrl}/sitemap.xml\n`,
);
await writeFile("dist/build-config.json", JSON.stringify({ siteUrl }) + "\n");
await build({
  entryPoints: { index: "server/index.ts", inquiries: "scripts/inquiries.ts" },
  outdir: "build/server",
  outExtension: { ".js": ".mjs" },
  platform: "node",
  target: "node24",
  format: "esm",
  bundle: true,
  packages: "external",
});
await rm("build/prerender.mjs");
console.info(
  `Built pre-rendered pages and portable Node server for ${siteUrl}. ${isPublic ? "Search indexing enabled." : "Local preview: search indexing disabled."}`,
);
