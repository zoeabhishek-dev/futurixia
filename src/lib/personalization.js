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