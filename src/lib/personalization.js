const EXPERIENCE_ORDER = [
  "no_experience",
  "beginner",
  "some_projects",
  "intermediate",
  "advanced",
]

function experienceRank(level) {
  const idx = EXPERIENCE_ORDER.indexOf(level)
  return idx === -1 ? 0 : idx
}

function parseCommaList(value) {
  if (!value) return []
  return value
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
}

function stepMatchesExperience(step, profile) {
  if (!step.min_experience_level) return true
  if (!profile?.experience_level) return true
  return experienceRank(profile.experience_level) >= experienceRank(step.min_experience_level)
}

function scoreStep(step, profile) {
  let score = 0
  const reasons = []

  if (!step.tags) {
    return { score: 0, reasons: [] }
  }

  const stepTags = parseCommaList(step.tags)
  const interests = parseCommaList(profile?.interests)
  const skills = parseCommaList(profile?.skills)

  const interestMatches = stepTags.filter((t) => interests.includes(t))
  const skillMatches = stepTags.filter((t) => skills.includes(t))

  if (interestMatches.length > 0) {
    score += interestMatches.length * 2
    reasons.push(`Matches your interest in ${interestMatches.join(", ")}`)
  }

  if (skillMatches.length > 0) {
    score += skillMatches.length * 2
    reasons.push(`Builds on your skill in ${skillMatches.join(", ")}`)
  }

  return { score, reasons }
}

/**
 * getPersonalizedRoadmap
 * Takes a student profile and the full list of roadmap steps for a career,
 * and returns the intro steps (matched to the student's current stage) and
 * core steps (filtered by experience level where a step specifies one, and
 * annotated with a relevance score and reason list based on tags).
 *
 * Step order within core and intro groups is never changed — prerequisite
 * sequence is always preserved. Scoring only affects which steps are shown
 * and the "why recommended" explanation, never the order.
 */
export function getPersonalizedRoadmap(profile, allSteps) {
  const steps = allSteps || []
  const stage = profile?.current_stage || null

  const introSteps = (stage
    ? steps.filter((s) => s.phase === "intro" && s.stage === stage)
    : []
  )
    .sort((a, b) => a.step_order - b.step_order)
    .map((s) => ({ ...s, ...scoreStep(s, profile) }))

  const coreSteps = steps
    .filter((s) => s.phase === "core")
    .filter((s) => stepMatchesExperience(s, profile))
    .sort((a, b) => a.step_order - b.step_order)
    .map((s) => ({ ...s, ...scoreStep(s, profile) }))

  return { introSteps, coreSteps }
}

/**
 * scoreCareerMatch
 * Rule-based, fully transparent scoring between a student's selected
 * interests/skills and a single career. Used by the Career Discovery page.
 * No AI — pure keyword matching against the career's own stored text.
 */
export function scoreCareerMatch(interests, skills, career) {
  const interestList = parseCommaList(Array.isArray(interests) ? interests.join(",") : interests)
  const skillList = parseCommaList(Array.isArray(skills) ? skills.join(",") : skills)

  const haystack = [career.title, career.category, career.short_description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  let score = 0
  const reasons = []
  const matchedInterests = []
  const matchedSkills = []

  interestList.forEach((interest) => {
    if (haystack.includes(interest)) {
      score += 3
      matchedInterests.push(interest)
    }
  })

  skillList.forEach((skill) => {
    if (haystack.includes(skill)) {
      score += 2
      matchedSkills.push(skill)
    }
  })

  if (matchedInterests.length > 0) {
    reasons.push(`You selected ${matchedInterests.join(", ")}, which relates closely to ${career.title}`)
  }
  if (matchedSkills.length > 0) {
    reasons.push(`Your skill in ${matchedSkills.join(", ")} is relevant to this career`)
  }

  return { score, reasons }
}

export const STAGE_LABELS = {
  pre_secondary: "8th or 9th Grade",
  secondary: "10th Grade",
  senior_secondary: "11th / 12th Grade",
  undergraduate: "Undergraduate",
  postgraduate_professional: "Postgraduate / Working Professional",
}

const STEP_TYPE_GUIDANCE = {
  education:
    "Look up the exact entry requirements on the official website of the institution or exam body before you commit, so your plan is based on facts and not guesses.",
  skill:
    "Practice a little every day instead of one long session once in a while. Try to use the skill on one small real example, even a rough one.",
  project:
    "Start small. A finished simple project teaches more than an unfinished ambitious one. When you finish, write down what you learned.",
  experience:
    "Ask one person already working in this area for 15 minutes of advice. Real conversations reveal things courses cannot.",
  exam:
    "Read the official syllabus and exam format first, then practice under timed conditions and review every mistake.",
  milestone:
    "Before you mark this done, write one sentence about what you achieved and what comes next.",
}

export function getStepGuidance(step) {
  return STEP_TYPE_GUIDANCE[step?.step_type] || null
}

function splitList(value) {
  if (!value) return []
  return value
    .split("|")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * matchResourcesForStep
 * Simple rule: a resource is suggested when one of its keywords appears in the
 * step title, its category rule (if any) fits the career, and its country rule
 * (if any) matches the student's country. Steps that were linked by hand in the
 * step_resources table always come first. Maximum 4 suggestions per step.
 */
export function matchResourcesForStep(step, career, resources, studentCountry, explicitList) {
  const title = (step?.title || "").toLowerCase()
  const category = (career?.category || "").toLowerCase()
  const country = (studentCountry || "").toLowerCase()
  const results = []
  const seen = new Set()

  const countryAllowed = (r) => {
    if (!r.country) return true
    return r.country.toLowerCase() === country
  }

  const addResource = (r) => {
    if (!r || seen.has(r.id) || !countryAllowed(r)) return
    seen.add(r.id)
    results.push(r)
  }

  const explicit = explicitList || []
  explicit.forEach(addResource)

  const all = resources || []
  all.forEach((r) => {
    if (results.length >= 4) return
    const keywords = splitList(r.keywords)
    if (keywords.length === 0) return
    const titleMatches = keywords.some((k) => title.includes(k))
    if (!titleMatches) return
    const categories = splitList(r.categories)
    if (categories.length > 0 && !categories.some((c) => category.includes(c))) return
    addResource(r)
  })

  return results.slice(0, 4)
}

export function groupResources(list) {
  const items = list || []
  return {
    videos: items.filter((r) => r.type === "video"),
    official: items.filter((r) => r.type === "official"),
    learning: items.filter((r) => r.type !== "video" && r.type !== "official"),
  }
}