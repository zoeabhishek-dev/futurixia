import { useState, useEffect, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  ArrowLeft,
  Lock,
  Target,
  Calendar,
  Download,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Award,
} from "lucide-react"
import { supabase } from "../supabaseClient"
import PricingModal from "../components/PricingModal"
import { getPersonalizedRoadmap } from "../lib/personalization"

const HOURS_BY_TYPE = {
  education: 4,
  skill: 8,
  project: 12,
  experience: 10,
  exam: 15,
  milestone: 2,
}
const DEFAULT_HOURS = 6
const HOUR_OPTIONS = [2, 4, 6, 8, 10, 15]
const MS_DAY = 86400000

const TYPE_LABELS = {
  education: "Education",
  skill: "Skill",
  project: "Project",
  experience: "Experience",
  exam: "Exam",
  milestone: "Milestone",
}

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

function stepHours(step) {
  return HOURS_BY_TYPE[step.step_type] || DEFAULT_HOURS
}

function todayNoon() {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12, 0, 0)
}

function formatDay(d) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function readStoredHours() {
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

function buildSkillCheck(careerSkillsText, studentSkillsText, remainingSteps) {
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

function buildPlan(remainingSteps, hoursPerWeek, startDate) {
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

function toIcsDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}${m}${day}`
}

function escapeIcs(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n")
}

function foldLine(line) {
  const out = []
  let rest = line
  while (rest.length > 73) {
    out.push(rest.slice(0, 73))
    rest = " " + rest.slice(73)
  }
  out.push(rest)
  return out.join("\r\n")
}

function buildIcs(items, careerTitle) {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "")

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Futurixia//Smart Coach//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ]

  items.forEach(({ step, due }) => {
    const next = new Date(due.getTime() + MS_DAY)
    lines.push(
      "BEGIN:VEVENT",
      `UID:${step.id}-${toIcsDate(due)}@futurixia`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(due)}`,
      `DTEND;VALUE=DATE:${toIcsDate(next)}`,
      `SUMMARY:${escapeIcs("Futurixia: finish - " + step.title)}`,
      `DESCRIPTION:${escapeIcs(
        "Career roadmap: " +
          careerTitle +
          ". Open Futurixia and mark this step done when you finish it."
      )}`,
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "ACTION:DISPLAY",
      "DESCRIPTION:Step due tomorrow",
      "END:VALARM",
      "END:VEVENT"
    )
  })

  lines.push("END:VCALENDAR")
  return lines.map(foldLine).join("\r\n") + "\r\n"
}

function Coach() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [pageStatus, setPageStatus] = useState("loading")
  const [profile, setProfile] = useState(null)
  const [careers, setCareers] = useState([])
  const [doneIds, setDoneIds] = useState(new Set())
  const [selectedSlug, setSelectedSlug] = useState(searchParams.get("career") || "")
  const [steps, setSteps] = useState([])
  const [stepsLoading, setStepsLoading] = useState(false)
  const [stepsError, setStepsError] = useState(false)
  const [hoursPerWeek, setHoursPerWeek] = useState(readStoredHours)
  const [showAllWeeks, setShowAllWeeks] = useState(false)
  const [showPricing, setShowPricing] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user
        if (!user) {
          navigate("/login")
          return
        }

        const { data: profileData } = await supabase
          .from("profiles")
          .select(
            "full_name, subscription_tier, country, current_stage, experience_level, interests, skills"
          )
          .eq("id", user.id)
          .maybeSingle()

        if (!profileData) {
          navigate("/create-profile")
          return
        }
        setProfile(profileData)

        if (profileData.subscription_tier !== "pro_max") {
          setPageStatus("locked")
          return
        }

        const { data: careerRows, error: careerError } = await supabase
          .from("careers")
          .select("id, title, slug, category, core_skills")
          .order("title")
        if (careerError) throw careerError
        const careerList = careerRows || []
        setCareers(careerList)

        const { data: progressRows } = await supabase
          .from("user_progress")
          .select("step_id, completed_at")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false })
        const progress = progressRows || []
        setDoneIds(new Set(progress.map((p) => p.step_id)))

        if (!searchParams.get("career") && progress.length > 0) {
          const { data: lastStep } = await supabase
            .from("roadmap_steps")
            .select("career_id")
            .eq("id", progress[0].step_id)
            .maybeSingle()
          const match = careerList.find((c) => c.id === lastStep?.career_id)
          if (match) setSelectedSlug(match.slug)
        }

        setPageStatus("ready")
      } catch (err) {
        setPageStatus("error")
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  useEffect(() => {
    if (pageStatus !== "ready" || !selectedSlug) {
      setSteps([])
      return
    }
    const career = careers.find((c) => c.slug === selectedSlug)
    if (!career) {
      setSteps([])
      return
    }

    let active = true
    const run = async () => {
      setStepsLoading(true)
      setStepsError(false)
      const { data, error } = await supabase
        .from("roadmap_steps")
        .select("*")
        .eq("career_id", career.id)
        .order("step_order")

      if (!active) return
      if (error) {
        setStepsError(true)
        setSteps([])
        setStepsLoading(false)
        return
      }
      const { introSteps, coreSteps } = getPersonalizedRoadmap(profile, data || [])
      setSteps([...introSteps, ...coreSteps])
      setStepsLoading(false)
    }
    run()
    return () => {
      active = false
    }
  }, [pageStatus, selectedSlug, careers, profile])

  const selectedCareer = careers.find((c) => c.slug === selectedSlug) || null
  const remaining = useMemo(() => steps.filter((s) => !doneIds.has(s.id)), [steps, doneIds])
  const doneCount = steps.length - remaining.length
  const percent = steps.length ? Math.round((doneCount / steps.length) * 100) : 0

  const plan = useMemo(
    () => buildPlan(remaining, hoursPerWeek, todayNoon()),
    [remaining, hoursPerWeek]
  )
  const skillCheck = useMemo(
    () => buildSkillCheck(selectedCareer?.core_skills, profile?.skills, remaining),
    [selectedCareer, profile, remaining]
  )

  const handleCareerChange = (value) => {
    setSelectedSlug(value)
    setShowAllWeeks(false)
    setSearchParams(value ? { career: value } : {}, { replace: true })
  }

  const handleHoursChange = (value) => {
    setHoursPerWeek(value)
    setShowAllWeeks(false)
    try {
      window.localStorage.setItem("fx_coach_hours", String(value))
    } catch (err) {
      // Remembering the choice is a convenience only.
    }
  }

  const downloadCalendar = () => {
    if (!selectedCareer || plan.items.length === 0) return
    const blob = new Blob([buildIcs(plan.items, selectedCareer.title)], {
      type: "text/calendar;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `futurixia-${selectedCareer.slug}-study-plan.ics`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const visibleWeeks = showAllWeeks ? plan.weeks : plan.weeks.slice(0, 6)

  return (
    <div style={styles.page}>
      <style>{`@keyframes fxspin { to { transform: rotate(360deg); } }`}</style>

      <div className="aurora-bg">
        <div className="aurora-blob blob-a" />
        <div className="aurora-blob blob-b" />
        <div className="aurora-blob blob-c" />
      </div>

      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={16} />
          Dashboard
        </button>

        {pageStatus === "loading" && (
          <div style={styles.messageCard}>
            <Loader2 size={26} color="#a5b4fc" style={{ animation: "fxspin 0.9s linear infinite" }} />
            <p style={styles.messageText}>Loading your Smart Coach...</p>
          </div>
        )}

        {pageStatus === "error" && (
          <div style={styles.messageCard}>
            <div style={{ ...styles.iconCircle, background: "rgba(255,155,155,0.14)" }}>
              <AlertTriangle size={24} color="#ff9b9b" />
            </div>
            <h1 style={styles.messageTitle}>Something went wrong</h1>
            <p style={styles.messageText}>
              Please check your connection and try refreshing the page.
            </p>
          </div>
        )}

        {pageStatus === "locked" && (
          <div style={styles.messageCard}>
            <div style={{ ...styles.iconCircle, background: "rgba(99,102,241,0.16)" }}>
              <Lock size={24} color="#a5b4fc" />
            </div>
            <h1 style={styles.messageTitle}>Smart Coach is part of Pro Max</h1>
            <p style={styles.messageText}>
              Get an automatic skill check, a weekly study plan with a finish date, and a calendar
              file with reminders for any career roadmap.
            </p>
            <button style={styles.primaryBtn} onClick={() => setShowPricing(true)}>
              See Plans
            </button>
          </div>
        )}

        {pageStatus === "ready" && (
          <>
            <div style={styles.heading}>
              <div style={styles.headingIcon}>
                <Sparkles size={22} />
              </div>
              <h1 style={styles.h1}>Your Smart Coach</h1>
              <p style={styles.subtext}>
                An automatic skill check and study plan built from your profile and your progress.
              </p>
            </div>

            <div style={styles.card}>
              <label style={styles.label} htmlFor="coach-career">
                Which career do you want to plan for?
              </label>
              <select
                id="coach-career"
                style={styles.select}
                value={selectedSlug}
                onChange={(e) => handleCareerChange(e.target.value)}
              >
                <option value="">Choose a career...</option>
                {careers.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {!selectedSlug && (
              <div style={styles.emptyCard}>
                <p style={styles.emptyText}>
                  Choose a career above to see your skill check and study plan.
                </p>
              </div>
            )}

            {selectedSlug && stepsLoading && (
              <div style={styles.messageCard}>
                <Loader2 size={24} color="#a5b4fc" style={{ animation: "fxspin 0.9s linear infinite" }} />
                <p style={styles.messageText}>Building your plan...</p>
              </div>
            )}

            {selectedSlug && stepsError && !stepsLoading && (
              <div style={styles.emptyCard}>
                <p style={styles.errorText} role="alert">
                  We could not load this roadmap. Please check your connection and try again.
                </p>
              </div>
            )}

            {selectedSlug && !stepsLoading && !stepsError && selectedCareer && steps.length === 0 && (
              <div style={styles.emptyCard}>
                <p style={styles.emptyText}>
                  Roadmap content for this career is being added soon.
                </p>
              </div>
            )}

            {selectedSlug && !stepsLoading && !stepsError && selectedCareer && steps.length > 0 && (
              <>
                <div style={styles.card}>
                  <div style={styles.cardHead}>
                    <Target size={18} color="#67e8f9" />
                    <h2 style={styles.cardTitle}>Your progress</h2>
                  </div>
                  <div style={styles.progressTop}>
                    <strong style={styles.bigNumber}>{percent}%</strong>
                    <span style={styles.mutedText}>
                      {doneCount} of {steps.length} steps done for {selectedCareer.title}
                    </span>
                  </div>
                  <div style={styles.barTrack}>
                    <div style={{ ...styles.barFill, width: `${percent}%` }} />
                  </div>

                  {remaining.length === 0 ? (
                    <div style={styles.doneBox}>
                      <CheckCircle2 size={20} color="#4ade80" />
                      <div style={{ flex: 1 }}>
                        <p style={styles.doneTitle}>You have finished every step.</p>
                        <button
                          style={styles.smallBtn}
                          onClick={() => navigate(`/certificate/${selectedCareer.slug}`)}
                        >
                          <Award size={14} />
                          Get your certificate
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 style={styles.subHeading}>Your next steps</h3>
                      {remaining.slice(0, 3).map((s, i) => (
                        <div key={s.id} style={styles.nextRow}>
                          <span style={styles.nextNumber}>{i + 1}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={styles.nextTitle}>{s.title}</p>
                            <p style={styles.mutedSmall}>
                              {TYPE_LABELS[s.step_type] || "Step"} · about {stepHours(s)} hours
                            </p>
                          </div>
                        </div>
                      ))}
                      <button
                        style={styles.smallBtn}
                        onClick={() => navigate(`/career/${selectedCareer.slug}`)}
                      >
                        <ListChecks size={14} />
                        Open the roadmap
                      </button>
                    </>
                  )}
                </div>

                <div style={styles.card}>
                  <div style={styles.cardHead}>
                    <Sparkles size={18} color="#c4b5fd" />
                    <h2 style={styles.cardTitle}>Skill check</h2>
                  </div>

                  {!skillCheck.hasCareerSkills && (
                    <p style={styles.mutedText}>
                      Skill information is not available for this career yet.
                    </p>
                  )}

                  {skillCheck.hasCareerSkills && !skillCheck.hasStudentSkills && (
                    <p style={styles.mutedText}>
                      You have not listed any skills yet. Add them in Edit Profile to see how you
                      match.
                    </p>
                  )}

                  {skillCheck.hasCareerSkills && skillCheck.hasStudentSkills && (
                    <>
                      <p style={styles.mutedText}>
                        Compared with the usual core skills for {selectedCareer.title}:
                      </p>

                      <h3 style={styles.subHeading}>Skills you already have</h3>
                      {skillCheck.have.length === 0 ? (
                        <p style={styles.mutedSmall}>
                          None of your listed skills match yet. That is a normal place to start.
                        </p>
                      ) : (
                        <div style={styles.chips}>
                          {skillCheck.have.map((s) => (
                            <span key={s} style={styles.chipGood}>
                              <CheckCircle2 size={13} />
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      <h3 style={styles.subHeading}>Skills to build</h3>
                      {skillCheck.missing.length === 0 ? (
                        <p style={styles.mutedSmall}>
                          You already cover every core skill listed for this career.
                        </p>
                      ) : (
                        skillCheck.missing.map((m) => (
                          <div key={m.skill} style={styles.missingRow}>
                            <p style={styles.missingSkill}>{m.skill}</p>
                            {m.related.length > 0 ? (
                              <p style={styles.mutedSmall}>
                                Practice it in: {m.related.map((r) => r.title).join(" · ")}
                              </p>
                            ) : (
                              <p style={styles.mutedSmall}>
                                It grows as you work through the roadmap steps.
                              </p>
                            )}
                          </div>
                        ))
                      )}

                      <p style={styles.footNote}>
                        This only compares the skills you listed in your profile. It is a guide, not
                        a test.
                      </p>
                    </>
                  )}
                </div>

                {remaining.length > 0 && (
                  <div style={styles.card}>
                    <div style={styles.cardHead}>
                      <Calendar size={18} color="#fdba74" />
                      <h2 style={styles.cardTitle}>Your study plan</h2>
                    </div>

                    <label style={styles.label} htmlFor="coach-hours">
                      How many hours can you study each week?
                    </label>
                    <select
                      id="coach-hours"
                      style={styles.select}
                      value={hoursPerWeek}
                      onChange={(e) => handleHoursChange(parseInt(e.target.value, 10))}
                    >
                      {HOUR_OPTIONS.map((h) => (
                        <option key={h} value={h}>
                          {h} hours a week
                        </option>
                      ))}
                    </select>

                    <div style={styles.summaryRow}>
                      <div style={styles.summaryBox}>
                        <span style={styles.summaryLabel}>Work left</span>
                        <strong style={styles.summaryValue}>about {plan.totalHours} hours</strong>
                      </div>
                      <div style={styles.summaryBox}>
                        <span style={styles.summaryLabel}>Time needed</span>
                        <strong style={styles.summaryValue}>
                          {plan.totalWeeks} {plan.totalWeeks === 1 ? "week" : "weeks"}
                        </strong>
                      </div>
                      <div style={styles.summaryBox}>
                        <span style={styles.summaryLabel}>Estimated finish</span>
                        <strong style={styles.summaryValue}>{formatDay(plan.finishDate)}</strong>
                      </div>
                    </div>

                    <button style={styles.primaryBtnFull} onClick={downloadCalendar}>
                      <Download size={16} />
                      Download calendar with reminders
                    </button>
                    <p style={styles.footNote}>
                      Opens in Google Calendar, Apple Calendar or Outlook. Each step gets a target
                      date and a reminder one day before.
                    </p>

                    <h3 style={styles.subHeading}>Week by week</h3>
                    {visibleWeeks.map((w) => (
                      <div key={w.week} style={styles.weekBlock}>
                        <p style={styles.weekTitle}>
                          Week {w.week} · finish by {formatDay(w.due)}
                        </p>
                        {w.items.map((item) => (
                          <div key={item.step.id} style={styles.weekItem}>
                            <span style={styles.weekDot} />
                            <span style={styles.weekItemText}>{item.step.title}</span>
                            <span style={styles.weekHours}>{item.hours} h</span>
                          </div>
                        ))}
                      </div>
                    ))}

                    {plan.weeks.length > 6 && (
                      <button
                        style={styles.toggleBtn}
                        onClick={() => setShowAllWeeks((prev) => !prev)}
                      >
                        {showAllWeeks ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {showAllWeeks
                          ? "Show fewer weeks"
                          : `Show all ${plan.weeks.length} weeks`}
                      </button>
                    )}

                    <p style={styles.footNote}>
                      Time estimates are planning guides based on the type of step, not promises.
                      Real time varies from person to person.
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        studentCountry={profile?.country}
      />
    </div>
  )
}

const styles = {
  page: {
    position: "relative",
    minHeight: "100vh",
    background: "#05070f",
    color: "#fff",
    fontFamily: "Inter, system-ui, sans-serif",
    padding: "24px 16px 70px",
    overflow: "hidden",
  },
  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: "720px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "22px",
  },
  backBtn: {
    alignSelf: "flex-start",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(255,255,255,0.09)",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "30px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  messageCard: {
    alignSelf: "center",
    width: "100%",
    maxWidth: "440px",
    background: "rgba(15,17,32,0.88)",
    borderRadius: "22px",
    padding: "34px 28px",
    textAlign: "center",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.1)",
  },
  iconCircle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "54px",
    height: "54px",
    borderRadius: "50%",
    margin: "0 auto 16px",
  },
  messageTitle: { fontSize: "1.3rem", fontWeight: 800, marginBottom: "8px" },
  messageText: { color: "#a9adc4", fontSize: "0.9rem", lineHeight: 1.6, marginTop: "10px" },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginTop: "18px",
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    color: "#fff",
    border: "none",
    padding: "13px 24px",
    borderRadius: "30px",
    fontSize: "0.9rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  heading: { textAlign: "center", margin: "6px auto 0", maxWidth: "520px" },
  headingIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "54px",
    height: "54px",
    borderRadius: "16px",
    background: "rgba(99,102,241,0.16)",
    color: "#a5b4fc",
    margin: "0 auto 16px",
  },
  h1: { fontSize: "1.7rem", fontWeight: 800, marginBottom: "8px" },
  subtext: { color: "#a9adc4", fontSize: "0.95rem", lineHeight: 1.6 },
  card: {
    background: "rgba(15,17,32,0.88)",
    borderRadius: "22px",
    padding: "24px 22px",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
  },
  emptyCard: {
    background: "rgba(15,17,32,0.6)",
    borderRadius: "18px",
    padding: "22px",
    textAlign: "center",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
  },
  emptyText: { color: "#9599b0", fontSize: "0.9rem", lineHeight: 1.6 },
  errorText: { color: "#ff9b9b", fontSize: "0.88rem", lineHeight: 1.5 },
  cardHead: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" },
  cardTitle: { fontSize: "1.05rem", fontWeight: 800 },
  label: {
    display: "block",
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#9599b0",
    marginBottom: "8px",
  },
  select: {
    width: "100%",
    background: "rgba(255,255,255,0.07)",
    border: "none",
    outline: "none",
    color: "#fff",
    fontSize: "16px",
    padding: "13px 16px",
    borderRadius: "14px",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
    fontFamily: "inherit",
  },
  progressTop: { display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" },
  bigNumber: { fontSize: "2rem", fontWeight: 800, color: "#fff" },
  mutedText: { color: "#a9adc4", fontSize: "0.88rem", lineHeight: 1.6 },
  mutedSmall: { color: "#9599b0", fontSize: "0.8rem", lineHeight: 1.5, marginTop: "4px" },
  barTrack: {
    width: "100%",
    height: "10px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "10px",
    overflow: "hidden",
    margin: "12px 0 8px",
  },
  barFill: {
    height: "100%",
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    borderRadius: "10px",
  },
  doneBox: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    background: "rgba(74,222,128,0.08)",
    borderRadius: "14px",
    padding: "14px 16px",
    marginTop: "14px",
  },
  doneTitle: { color: "#fff", fontSize: "0.92rem", fontWeight: 700, marginBottom: "10px" },
  subHeading: {
    fontSize: "0.8rem",
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: "#a5b4fc",
    margin: "20px 0 10px",
  },
  nextRow: { display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" },
  nextNumber: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    background: "rgba(99,102,241,0.3)",
    fontSize: "0.78rem",
    fontWeight: 800,
    flexShrink: 0,
  },
  nextTitle: { color: "#fff", fontSize: "0.92rem", fontWeight: 600, wordBreak: "break-word" },
  smallBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "8px",
    background: "rgba(255,255,255,0.08)",
    color: "#e0e1ff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "30px",
    fontSize: "0.82rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)",
  },
  chips: { display: "flex", flexWrap: "wrap", gap: "8px" },
  chipGood: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(74,222,128,0.12)",
    color: "#86efac",
    fontSize: "0.8rem",
    fontWeight: 600,
    padding: "6px 12px",
    borderRadius: "20px",
  },
  missingRow: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: "12px",
    padding: "12px 14px",
    marginBottom: "10px",
  },
  missingSkill: { color: "#fff", fontSize: "0.9rem", fontWeight: 600, wordBreak: "break-word" },
  footNote: { color: "#7d8299", fontSize: "0.74rem", lineHeight: 1.5, marginTop: "14px" },
  summaryRow: { display: "flex", flexWrap: "wrap", gap: "10px", margin: "18px 0 6px" },
  summaryBox: {
    flex: "1 1 150px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "14px",
    padding: "12px 14px",
  },
  summaryLabel: {
    display: "block",
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#9599b0",
    marginBottom: "4px",
  },
  summaryValue: { fontSize: "0.95rem", color: "#fff" },
  primaryBtnFull: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    marginTop: "16px",
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "14px",
    fontSize: "0.95rem",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  weekBlock: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: "14px",
    padding: "14px 16px",
    marginBottom: "10px",
  },
  weekTitle: { color: "#a5b4fc", fontSize: "0.82rem", fontWeight: 700, marginBottom: "8px" },
  weekItem: { display: "flex", alignItems: "flex-start", gap: "10px", padding: "5px 0" },
  weekDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#67e8f9",
    flexShrink: 0,
    marginTop: "7px",
  },
  weekItemText: { flex: 1, color: "#c9cbdb", fontSize: "0.86rem", lineHeight: 1.5, wordBreak: "break-word" },
  weekHours: { color: "#9599b0", fontSize: "0.78rem", flexShrink: 0, marginTop: "2px" },
  toggleBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(255,255,255,0.07)",
    color: "#c7d2fe",
    border: "none",
    padding: "9px 16px",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "4px",
  },
}

export default Coach