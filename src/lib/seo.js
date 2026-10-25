import { useEffect } from "react"

export const DEFAULT_TITLE = "Futurixia | Career Guidance and Personalized Roadmaps for Students"
export const DEFAULT_DESCRIPTION =
  "Explore 100+ careers, see what a day in the job is really like, and follow a personalized step-by-step roadmap based on your stage, interests and skills."

export function trimText(text, max = 158) {
  const clean = String(text || "").replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 3)
  const lastSpace = cut.lastIndexOf(" ")
  const base = lastSpace > 80 ? cut.slice(0, lastSpace) : cut
  return base.replace(/[ ,.;:]+$/, "") + "..."
}

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content)
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement("link")
    el.setAttribute("rel", rel)
    document.head.appendChild(el)
  }
  el.setAttribute("href", href)
}

export function applyPageMeta({ title, description, noindex = false } = {}) {
  const pageTitle = title || DEFAULT_TITLE
  const pageDescription = description || DEFAULT_DESCRIPTION
  const url = window.location.origin + window.location.pathname

  document.title = pageTitle
  upsertMeta("name", "description", pageDescription)
  upsertMeta("property", "og:title", pageTitle)
  upsertMeta("property", "og:description", pageDescription)
  upsertMeta("property", "og:url", url)
  upsertMeta("name", "twitter:title", pageTitle)
  upsertMeta("name", "twitter:description", pageDescription)
  upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow")
  upsertLink("canonical", url)
}

export function usePageMeta(meta) {
  const title = meta ? meta.title : null
  const description = meta ? meta.description : null
  const noindex = meta ? !!meta.noindex : false

  useEffect(() => {
    if (!title) return
    applyPageMeta({ title, description, noindex })
    return () => applyPageMeta()
  }, [title, description, noindex])
}