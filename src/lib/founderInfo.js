// Verified facts about the founder and the website. Only things the owner has provided belong here.
// Do not add awards, qualifications, funding, partnerships, numbers or social links unless they are real and confirmed.
// This file is plain JavaScript on purpose, so the build script can read it too.

export const SITE = {
  name: "Futurixia",
  url: "https://futurixia-delta.vercel.app",
  tagline: "Find Your Path to Your Dream Career",
  description: "A career-guidance platform helping students discover and plan their dream careers.",
}

export const FOUNDER = {
  name: "Abhishek Zoe",
  jobTitle: "Founder & CEO",
  roleLine: "Founder & CEO of Futurixia",
  pageUrl: `${SITE.url}/founder`,

  // Shown in "My story". It becomes out of date on every birthday: update it, or set it to null to hide it.
  age: 17,

  // To add your photograph: put the file in the "public" folder (for example public/founder.jpg),
  // then set photo to "/founder.jpg". Leave it as "" to keep the placeholder.
  photo: "",
  photoAlt: "Abhishek Zoe, Founder and CEO of Futurixia",
}

export const FOUNDER_PAGE_TITLE = "Abhishek Zoe – Founder & CEO of Futurixia"
export const FOUNDER_PAGE_DESCRIPTION =
  "Learn about Abhishek Zoe, Founder and CEO of Futurixia, and his vision for making career guidance more accessible to students worldwide."

export const OG_IMAGE = `${SITE.url}/og-image.png`

// Stable identifiers used to connect the entities in the structured data.
export const IDS = {
  organization: `${SITE.url}/#organization`,
  website: `${SITE.url}/#website`,
  person: `${SITE.url}/founder#person`,
  profilePage: `${SITE.url}/founder#profilepage`,
}
