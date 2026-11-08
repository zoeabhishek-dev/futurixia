// Schema.org JSON-LD for the homepage and the founder page.
// Every entity has a stable @id, and the pages only connect to each other through those ids.
// Plain JavaScript on purpose, so the build script can read it too.

import { SITE, FOUNDER, IDS, FOUNDER_PAGE_TITLE, FOUNDER_PAGE_DESCRIPTION } from "./founderInfo.js"

function photoUrl() {
  if (!FOUNDER.photo) return null
  return FOUNDER.photo.startsWith("http") ? FOUNDER.photo : `${SITE.url}${FOUNDER.photo}`
}

export function organizationNode({ embedFounder = false } = {}) {
  return {
    "@type": "Organization",
    "@id": IDS.organization,
    name: SITE.name,
    url: `${SITE.url}/`,
    description: SITE.description,
    slogan: SITE.tagline,
    logo: {
      "@type": "ImageObject",
      url: `${SITE.url}/favicon-512.png`,
      width: 512,
      height: 512,
    },
    founder: embedFounder
      ? {
          "@type": "Person",
          "@id": IDS.person,
          name: FOUNDER.name,
          jobTitle: FOUNDER.jobTitle,
          url: FOUNDER.pageUrl,
        }
      : { "@id": IDS.person },
  }
}

export function personNode() {
  const image = photoUrl()
  return {
    "@type": "Person",
    "@id": IDS.person,
    name: FOUNDER.name,
    jobTitle: FOUNDER.jobTitle,
    url: FOUNDER.pageUrl,
    mainEntityOfPage: { "@id": IDS.profilePage },
    worksFor: { "@id": IDS.organization },
    ...(image ? { image } : {}),
  }
}

export function profilePageNode() {
  return {
    "@type": "ProfilePage",
    "@id": IDS.profilePage,
    url: FOUNDER.pageUrl,
    name: FOUNDER_PAGE_TITLE,
    description: FOUNDER_PAGE_DESCRIPTION,
    inLanguage: "en",
    mainEntity: { "@id": IDS.person },
    isPartOf: { "@id": IDS.website },
  }
}

export function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": IDS.website,
    url: `${SITE.url}/`,
    name: SITE.name,
    description: SITE.description,
    publisher: { "@id": IDS.organization },
  }
}

let homeCache = null
let founderCache = null

// Homepage: the organisation (with its founder) and the website.
export function homeJsonLd() {
  if (!homeCache) {
    homeCache = {
      "@context": "https://schema.org",
      "@graph": [organizationNode({ embedFounder: true }), websiteNode()],
    }
  }
  return homeCache
}

// Founder page: profile page, person, organisation and website, connected by @id.
export function founderJsonLd() {
  if (!founderCache) {
    founderCache = {
      "@context": "https://schema.org",
      "@graph": [profilePageNode(), personNode(), organizationNode(), websiteNode()],
    }
  }
  return founderCache
}
