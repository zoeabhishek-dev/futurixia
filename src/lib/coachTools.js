export const HOURS_BY_TYPE = {
  education: 4,
  skill: 8,
  project: 12,
  experience: 10,
  exam: 15,
  milestone: 2,
}
export const DEFAULT_HOURS = 6
export const HOUR_OPTIONS = [2, 4, 6, 8, 10, 15]
export const MS_DAY = 86400000

const SYNONYMS = {
  coding: ["coding", "programming", "scripting", "software"],
  "problem solving": ["problem", "troubleshoot", "debug"],
  communication: ["communicat", "speaking", "writing"],
  "public speaking": ["speaking", "presentation"],
  leadership: ["leadership", "leading", "management"],
  teamwork: ["teamwork", "collaborat", "team"],
  creativity: ["creativ", "design", "artistic"],
  research: ["research"],
  "critical thinking": ["critical", "analytical", "reasoning"],
  "time management": ["time management", "organization", "organisation"],
  "design tools": ["design", "software proficiency"],
  "data analysis": ["data", "statistic", "analysis"],
}

export function stepHours(step) {
  return HOURS_BY_TYPE[step.step_type] || DEFAULT_HOURS
}

export function todayNoon() {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12, 0, 0)
}

export function formatDay(d) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function readStoredHours() {
  try {
    const v = parseInt(window.localStorage.getItem("fx_coach_hours"), 10)
    return HOUR_OPTIONS.includes(v) ? v : DEFAULT_HOURS
  } catch (err) {
    return DEFAULT_HOURS
  }
}

function splitSkills(text) {
  if (!text) return []
  return text
    .split(/,|;/)
    .map((s) => s.replace(/^\s*(and|or)\s+/i, "").replace(/\.$/, "").trim())
    .filter(Boolean)
}

function keywordsFor(skill) {
  const lower = skill.toLowerCase().trim()
  const list = SYNONYMS[lower] || [lower]
  return list.filter((k) => k.length >= 3)
}

export function buildSkillCheck(careerSkillsText, studentSkillsText, remainingSteps) {
  const careerSkills = splitSkills(careerSkillsText)
  const studentSkills = (studentSkillsText || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  const have = []
  const missing = []

  careerSkills.forEach((cs) => {
    const lower = cs.toLowerCase()
    const matched = studentSkills.some((s) =>
      keywordsFor(s).some((k) => lower.includes(k))
    )

    if (matched) {
      have.push(cs)
    } else {
      const words = lower.split(/[^a-z]+/).filter((w) => w.length >= 5)
      const related = remainingSteps
        .filter((st) => words.some((w) => st.title.toLowerCase().includes(w)))
        .slice(0, 2)
      missing.push({ skill: cs, related })
    }
  })

  return {
    hasCareerSkills: careerSkills.length > 0,
    hasStudentSkills: studentSkills.length > 0,
    have,
    missing,
  }
}

export function buildPlan(remainingSteps, hoursPerWeek, startDate) {
  let cumulative = 0
  const items = remainingSteps.map((step) => {
    const hours = stepHours(step)
    cumulative += hours
    const week = Math.max(1, Math.ceil(cumulative / hoursPerWeek))
    const due = new Date(startDate.getTime() + week * 7 * MS_DAY)
    return { step, hours, week, due }
  })

  const weeks = []
  items.forEach((item) => {
    const last = weeks[weeks.length - 1]
    if (last && last.week === item.week) {
      last.items.push(item)
    } else {
      weeks.push({ week: item.week, due: item.due, items: [item] })
    }
  })

  const totalWeeks = Math.max(1, Math.ceil(cumulative / hoursPerWeek))
  return {
    items,
    weeks,
    totalHours: cumulative,
    totalWeeks,
    finishDate: new Date(startDate.getTime() + totalWeeks * 7 * MS_DAY),
  }
}