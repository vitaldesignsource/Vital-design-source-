import "dotenv/config";
import { build as viteBuild } from "vite";
import { build } from "esbuild";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { projects, services, type Project } from "../src/lib/content";
import { projectPath, projectRoutes } from "../src/lib/project-routes";
import { brandFilm } from "../src/lib/brand-film";
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
const serializeSchema = (value: unknown) =>
  JSON.stringify(value).replaceAll("<", "\\u003c");
const schema = serializeSchema({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "VideoObject",
      "@id": `${siteUrl}/#brand-film`,
      name: brandFilm.title,
      description: brandFilm.description,
      thumbnailUrl: `${siteUrl}${brandFilm.poster}`,
      contentUrl: `${siteUrl}${brandFilm.source}`,
      uploadDate: brandFilm.uploadDate,
      duration: `PT${brandFilm.duration}S`,
      width: brandFilm.width,
      height: brandFilm.height,
      publisher: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Vital Design Source LLC",
      url: siteUrl,
      logo: `${siteUrl}/assets/brand/vital-logo-original.webp`,
      description:
        "Independent creative studio for web design, development, branding, AI-assisted design and motion, SEO, and intelligent automation.",
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
      "@id": `${siteUrl}/#website`,
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
            mainEntityOfPage: `${siteUrl}${projectPath(project)}`,
          },
        })),
      },
    },
  ],
});

function projectSchema(project: Project, title: string) {
  const url = `${siteUrl}${projectPath(project)}`;
  const image = `${siteUrl}/assets/projects/${project.image}-1200.webp`;
  return serializeSchema({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Vital Design Source LLC",
        url: siteUrl,
        logo: `${siteUrl}/assets/brand/vital-logo-original.webp`,
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        name: title,
        description: project.description,
        url,
        isPartOf: { "@id": `${siteUrl}/#website` },
        publisher: { "@id": `${siteUrl}/#organization` },
        mainEntity: { "@id": `${url}#project` },
        primaryImageOfPage: { "@id": `${url}#preview` },
        breadcrumb: { "@id": `${url}#breadcrumbs` },
      },
      {
        "@type": "CreativeWork",
        "@id": `${url}#project`,
        name: project.name,
        description: project.description,
        genre: project.category,
        url: project.url,
        image,
        mainEntityOfPage: { "@id": `${url}#webpage` },
      },
      {
        "@type": "ImageObject",
        "@id": `${url}#preview`,
        contentUrl: image,
        caption: `${project.name} — ${project.previewLabel || "website preview"}`,
        width: 1200,
        height: 850,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumbs`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Vital Design Source",
            item: `${siteUrl}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Selected work",
            item: `${siteUrl}/#work`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: project.name,
            item: url,
          },
        ],
      },
    ],
  });
}

interface Page {
  path: string;
  file: string;
  title: string;
  description: string;
  project?: Project;
}

const pages: Page[] = [
  {
    path: "/",
    file: "dist/index.html",
    title: "Vital Design Source — Design, AI & Digital Experiences",
    description:
      "Independent creative studio for distinctive websites, branding, AI-assisted imagery, motion, SEO, and intelligent automation. Ideas beyond ordinary.",
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
  ...projectRoutes.map(({ project, path }) => ({
    path,
    file: `dist${path}/index.html`,
    title: `${project.name} — Project study — Vital Design Source`,
    description: project.description,
    project,
  })),
];

for (const page of pages) {
  const image = page.project
    ? `/assets/projects/${page.project.image}-1200.webp`
    : "/assets/og-vital.jpg";
  const imageAlt = page.project
    ? `${page.project.name} — ${page.project.previewLabel || "website preview"}`
    : "Vital Design Source — distinctive websites, brands, and intelligent systems";
  const pageSchema = page.project
    ? projectSchema(page.project, page.title)
    : page.path === "/"
      ? schema
      : undefined;
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
    `<meta property="og:image" content="${escape(`${siteUrl}${image}`)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="${page.project ? 850 : 630}" />`,
    `<meta property="og:image:alt" content="${escape(imageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escape(page.title)}" />`,
    `<meta name="twitter:description" content="${escape(page.description)}" />`,
    `<meta name="twitter:image" content="${escape(`${siteUrl}${image}`)}" />`,
    `<meta name="twitter:image:alt" content="${escape(imageAlt)}" />`,
    ...(pageSchema
      ? [`<script type="application/ld+json">${pageSchema}</script>`]
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
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages
    .filter((page) => page.path !== "/404")
    .map((page) => `<url><loc>${escape(`${siteUrl}${page.path}`)}</loc></url>`)
    .join("")}</urlset>\n`,
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
