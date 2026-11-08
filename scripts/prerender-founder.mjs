// Runs after "vite build". It writes dist/founder/index.html: a copy of the built index.html with the
// founder page's own title, description, canonical address, sharing tags and structured data already in the
// HTML, so search engines and link previews can read them without running JavaScript.
// If anything goes wrong it only prints a warning and the normal build still succeeds.

import fs from "node:fs"
import path from "node:path"
import {
  SITE,
  FOUNDER,
  FOUNDER_PAGE_TITLE,
  FOUNDER_PAGE_DESCRIPTION,
  OG_IMAGE,
} from "../src/lib/founderInfo.js"
import { founderJsonLd } from "../src/lib/structuredData.js"

const escapeAttr = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const escapeText = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

try {
  const dist = path.resolve("dist")
  const source = path.join(dist, "index.html")

  if (!fs.existsSync(source)) {
    console.warn("[founder-page] dist/index.html was not found, so the founder page HTML was not created.")
    process.exit(0)
  }

  let html = fs.readFileSync(source, "utf8")

  // Remove tags the founder page replaces, so nothing appears twice.
  html = html
    .replace(/<title>[\s\S]*?<\/title>\s*/gi, "")
    .replace(/<meta\s+name="description"[^>]*>\s*/gi, "")
    .replace(/<meta\s+name="robots"[^>]*>\s*/gi, "")
    .replace(/<meta\s+property="og:[^"]*"[^>]*>\s*/gi, "")
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>\s*/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, "")
    .replace(/<script\s+type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\s*/gi, "")

  const jsonLd = JSON.stringify(founderJsonLd()).replace(/</g, "\\u003c")

  const head = [
    `<title>${escapeText(FOUNDER_PAGE_TITLE)}</title>`,
    `<meta name="description" content="${escapeAttr(FOUNDER_PAGE_DESCRIPTION)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<link rel="canonical" href="${escapeAttr(FOUNDER.pageUrl)}" />`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:site_name" content="${escapeAttr(SITE.name)}" />`,
    `<meta property="og:title" content="${escapeAttr(FOUNDER_PAGE_TITLE)}" />`,
    `<meta property="og:description" content="${escapeAttr(FOUNDER_PAGE_DESCRIPTION)}" />`,
    `<meta property="og:url" content="${escapeAttr(FOUNDER.pageUrl)}" />`,
    `<meta property="og:image" content="${escapeAttr(OG_IMAGE)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(FOUNDER_PAGE_TITLE)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(FOUNDER_PAGE_DESCRIPTION)}" />`,
    `<meta name="twitter:image" content="${escapeAttr(OG_IMAGE)}" />`,
    `<script type="application/ld+json" id="fx-jsonld-founder">${jsonLd}</script>`,
  ].join("\n    ")

  if (!/<\/head>/i.test(html)) {
    console.warn("[founder-page] dist/index.html has no </head>, so the founder page HTML was not created.")
    process.exit(0)
  }
  html = html.replace(/<\/head>/i, `    ${head}\n  </head>`)

  // Plain text for visitors and crawlers that do not run JavaScript.
  const fallback =
    `<noscript><h1>${escapeText(FOUNDER.name)} – ${escapeText(FOUNDER.roleLine)}</h1>` +
    `<p>${escapeText(FOUNDER.name)} is the Founder and CEO of ${escapeText(SITE.name)}, ` +
    `${escapeText(SITE.description.charAt(0).toLowerCase() + SITE.description.slice(1))}</p>` +
    `<p><a href="/">${escapeText(SITE.name)} home</a></p></noscript>`
  html = html.replace(/<div id="root"><\/div>/i, (match) => `${match}\n    ${fallback}`)

  const outDir = path.join(dist, "founder")
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, "index.html"), html)
  console.log("[founder-page] wrote dist/founder/index.html")
} catch (error) {
  console.warn("[founder-page] could not create the founder page HTML:", error && error.message)
}
