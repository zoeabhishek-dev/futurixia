import { useState, useEffect, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, Lock, Printer, Loader2, AlertTriangle, FileText } from "lucide-react"
import { supabase } from "../supabaseClient"
import PricingModal from "../components/PricingModal"
import {
  getPersonalizedRoadmap,
  matchResourcesForStep,
  scoreCareerMatch,
  STAGE_LABELS,
} from "../lib/personalization"
import {
  HOUR_OPTIONS,
  stepHours,
  todayNoon,
  formatDay,
  readStoredHours,
  buildSkillCheck,
  buildPlan,
} from "../lib/coachTools"

const TYPE_LABELS = {
  education: "Education",
  skill: "Skill",
  project: "Project",
  experience: "Experience",
  exam: "Exam",
  milestone: "Milestone",
}

const INFO_FIELDS = [
  ["overview", "Overview"],
  ["education_requirements", "Education requirements"],
  ["exams_licensing", "Exams and licensing"],
  ["core_skills", "Core skills"],
  ["work_environment", "Work environment"],
  ["career_progression", "Career progression"],
  ["career_reality", "Career reality"],
  ["common_challenges", "Common challenges"],
  ["alternative_paths", "Alternative career paths"],
]

function splitList(text) {
  if (!text) return []
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

function Report() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [pageStatus, setPageStatus] = useState("loading")
  const [profile, setProfile] = useState(null)
  const [careers, setCareers] = useState([])
  const [resources, setResources] = useState([])
  const [doneIds, setDoneIds] = useState(new Set())
  const [selectedSlug, setSelectedSlug] = useState(searchParams.get("career") || "")
  const [steps, setSteps] = useState([])
  const [stepsLoading, setStepsLoading] = useState(false)
  const [stepsError, setStepsError] = useState(false)
  const [hoursPerWeek, setHoursPerWeek] = useState(readStoredHours)
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
            "full_name, subscription_tier, country, education_level, class_or_course, current_stage, experience_level, interests, skills, career_goal_notes"
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
          .select("*")
          .order("title")
        if (careerError) throw careerError
        const careerList = careerRows || []
        setCareers(careerList)

        const { data: resourceRows } = await supabase.from("resources").select("*")
        setResources(resourceRows || [])

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

  const career = careers.find((c) => c.slug === selectedSlug) || null
  const remaining = useMemo(() => steps.filter((s) => !doneIds.has(s.id)), [steps, doneIds])
  const completed = useMemo(() => steps.filter((s) => doneIds.has(s.id)), [steps, doneIds])
  const percent = steps.length ? Math.round((completed.length / steps.length) * 100) : 0

  const plan = useMemo(
    () => buildPlan(remaining, hoursPerWeek, todayNoon()),
    [remaining, hoursPerWeek]
  )
  const skillCheck = useMemo(
    () => buildSkillCheck(career?.core_skills, profile?.skills, remaining),
    [career, profile, remaining]
  )

  const nextSteps = remaining.slice(0, 5)
  const resourceGroups = useMemo(() => {
    if (!career) return []
    return nextSteps
      .map((step) => ({
        step,
        list: matchResourcesForStep(step, career, resources, profile?.country, []),
      }))
      .filter((g) => g.list.length > 0)
  }, [career, nextSteps, resources, profile])

  const relatedTitles = useMemo(() => {
    if (!career?.related_career_slugs) return []
    return splitList(career.related_career_slugs)
      .map((slug) => careers.find((c) => c.slug === slug))
      .filter(Boolean)
      .map((c) => c.title)
  }, [career, careers])

  const matches = useMemo(() => {
    if (!career || !profile) return []
    return careers
      .filter((c) => c.slug !== career.slug)
      .map((c) => ({ c, ...scoreCareerMatch(profile.interests, profile.skills, c) }))
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }, [career, careers, profile])

  const handleCareerChange = (value) => {
    setSelectedSlug(value)
    setSearchParams(value ? { career: value } : {}, { replace: true })
  }

  const handleHoursChange = (value) => {
    setHoursPerWeek(value)
    try {
      window.localStorage.setItem("fx_coach_hours", String(value))
    } catch (err) {
      // Remembering the choice is a convenience only.
    }
  }

  const interests = splitList(profile?.interests)
  const skills = splitList(profile?.skills)
  const stageLabel = profile?.current_stage ? STAGE_LABELS[profile.current_stage] : ""
  const generatedOn = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const showSalaryNote =
    career?.salary_range && profile?.country && profile.country !== "India"

  const reportReady =
    pageStatus === "ready" && career && !stepsLoading && !stepsError && steps.length > 0

  return (
    <div style={s.page} className="fx-report-page">
      <style>{`
        @keyframes fxspin { to { transform: rotate(360deg); } }
        @page { size: A4; margin: 12mm; }
        .fx-report { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .fx-avoid { break-inside: avoid; page-break-inside: avoid; }
        @media print {
          body { background: #ffffff !important; }
          .no-print { display: none !important; }
          .aurora-bg { display: none !important; }
          .fx-report-page { background: #ffffff !important; padding: 0 !important; min-height: auto !important; overflow: visible !important; }
          .fx-report { box-shadow: none !important; max-width: 100% !important; padding: 0 !important; border-radius: 0 !important; }
        }
      `}</style>

      <div className="aurora-bg no-print">
        <div className="aurora-blob blob-a" />
        <div className="aurora-blob blob-b" />
        <div className="aurora-blob blob-c" />
      </div>

      <div style={s.container}>
        <button className="no-print" style={s.backBtn} onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={16} />
          Dashboard
        </button>

        {pageStatus === "loading" && (
          <div style={s.messageCard} className="no-print">
            <Loader2 size={26} color="#a5b4fc" style={{ animation: "fxspin 0.9s linear infinite" }} />
            <p style={s.messageText}>Preparing your report...</p>
          </div>
        )}

        {pageStatus === "error" && (
          <div style={s.messageCard} className="no-print">
            <div style={{ ...s.iconCircle, background: "rgba(255,155,155,0.14)" }}>
              <AlertTriangle size={24} color="#ff9b9b" />
            </div>
            <h1 style={s.messageTitle}>Something went wrong</h1>
            <p style={s.messageText}>Please check your connection and try refreshing the page.</p>
          </div>
        )}

        {pageStatus === "locked" && (
          <div style={s.messageCard} className="no-print">
            <div style={{ ...s.iconCircle, background: "rgba(99,102,241,0.16)" }}>
              <Lock size={24} color="#a5b4fc" />
            </div>
            <h1 style={s.messageTitle}>The career report is part of Pro Max</h1>
            <p style={s.messageText}>
              Get a printable report with your profile, career facts, progress, skill check, study
              plan and free resources, built automatically for you.
            </p>
            <button style={s.primaryBtn} onClick={() => setShowPricing(true)}>
              See Plans
            </button>
          </div>
        )}

        {pageStatus === "ready" && (
          <>
            <div className="no-print" style={s.controls}>
              <div style={s.heading}>
                <div style={s.headingIcon}>
                  <FileText size={22} />
                </div>
                <h1 style={s.h1}>Your Personal Career Report</h1>
                <p style={s.subtext}>
                  Pick a career and your weekly study hours. The report builds itself.
                </p>
              </div>

              <label style={s.label} htmlFor="report-career">
                Career
              </label>
              <select
                id="report-career"
                style={s.select}
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

              <label style={s.label} htmlFor="report-hours">
                Hours you can study each week
              </label>
              <select
                id="report-hours"
                style={s.select}
                value={hoursPerWeek}
                onChange={(e) => handleHoursChange(parseInt(e.target.value, 10))}
              >
                {HOUR_OPTIONS.map((h) => (
                  <option key={h} value={h}>
                    {h} hours a week
                  </option>
                ))}
              </select>

              {reportReady && (
                <button style={s.printBtn} onClick={() => window.print()}>
                  <Printer size={16} />
                  Print or Save as PDF
                </button>
              )}
            </div>

            {!selectedSlug && (
              <div style={s.emptyCard} className="no-print">
                <p style={s.emptyText}>Choose a career above to build your report.</p>
              </div>
            )}

            {selectedSlug && stepsLoading && (
              <div style={s.messageCard} className="no-print">
                <Loader2 size={24} color="#a5b4fc" style={{ animation: "fxspin 0.9s linear infinite" }} />
                <p style={s.messageText}>Building your report...</p>
              </div>
            )}

            {selectedSlug && stepsError && !stepsLoading && (
              <div style={s.emptyCard} className="no-print">
                <p style={s.errorText} role="alert">
                  We could not load this roadmap. Please check your connection and try again.
                </p>
              </div>
            )}

            {selectedSlug && career && !stepsLoading && !stepsError && steps.length === 0 && (
              <div style={s.emptyCard} className="no-print">
                <p style={s.emptyText}>Roadmap content for this career is being added soon.</p>
              </div>
            )}

            {reportReady && (
              <div style={s.paper} className="fx-report">
                <div style={s.paperHead} className="fx-avoid">
                  <div style={s.brand}>Futurixia</div>
                  <div style={s.kicker}>Personal Career Report</div>
                  <h2 style={s.studentName}>{profile.full_name}</h2>
                  <p style={s.metaLine}>
                    Prepared for the career of <strong>{career.title}</strong> on {generatedOn}
                  </p>
                </div>

                <div style={s.section} className="fx-avoid">
                  <h3 style={s.sectionTitle}>1. Your profile</h3>
                  <div style={s.grid}>
                    <div style={s.fact}>
                      <span style={s.factLabel}>Country</span>
                      <span style={s.factValue}>{profile.country || "Not given"}</span>
                    </div>
                    <div style={s.fact}>
                      <span style={s.factLabel}>Current stage</span>
                      <span style={s.factValue}>{stageLabel || "Not given"}</span>
                    </div>
                    <div style={s.fact}>
                      <span style={s.factLabel}>Education</span>
                      <span style={s.factValue}>
                        {[profile.education_level, profile.class_or_course]
                          .filter(Boolean)
                          .join(" · ") || "Not given"}
                      </span>
                    </div>
                    <div style={s.fact}>
                      <span style={s.factLabel}>Experience level</span>
                      <span style={s.factValue}>
                        {profile.experience_level
                          ? profile.experience_level.replace(/_/g, " ")
                          : "Not given"}
                      </span>
                    </div>
                  </div>
                  <p style={s.smallLabel}>Interests</p>
                  <p style={s.text}>{interests.length ? interests.join(", ") : "None listed"}</p>
                  <p style={s.smallLabel}>Skills</p>
                  <p style={s.text}>{skills.length ? skills.join(", ") : "None listed"}</p>
                  {profile.career_goal_notes && (
                    <>
                      <p style={s.smallLabel}>Why this path interests you</p>
                      <p style={s.text}>{profile.career_goal_notes}</p>
                    </>
                  )}
                </div>

                <div style={s.section}>
                  <h3 style={s.sectionTitle}>2. About the career: {career.title}</h3>
                  <p style={s.text}>{career.short_description}</p>

                  <div style={s.grid} className="fx-avoid">
                    <div style={s.fact}>
                      <span style={s.factLabel}>Category</span>
                      <span style={s.factValue}>{career.category || "Not given"}</span>
                    </div>
                    <div style={s.fact}>
                      <span style={s.factLabel}>Job demand</span>
                      <span style={s.factValue}>{career.job_demand || "Not available yet"}</span>
                    </div>
                    <div style={s.fact}>
                      <span style={s.factLabel}>Typical salary</span>
                      <span style={s.factValue}>{career.salary_range || "Not available yet"}</span>
                    </div>
                  </div>

                  {career.salary_range && (
                    <p style={s.note}>
                      {career.salary_context ? `Context: ${career.salary_context}. ` : ""}
                      {career.salary_source ? `Source: ${career.salary_source}` : ""}
                      {career.salary_year ? ` (${career.salary_year}). ` : ""}
                      {showSalaryNote
                        ? "This figure may not reflect your own country, because confirmed data for it is not available here yet. "
                        : ""}
                      Salaries vary widely, so treat this as a rough guide.
                    </p>
                  )}

                  {INFO_FIELDS.filter(([key]) => career[key]).map(([key, label]) => (
                    <div key={key} style={s.infoBlock} className="fx-avoid">
                      <p style={s.smallLabel}>{label}</p>
                      <p style={s.text}>{career[key]}</p>
                    </div>
                  ))}

                  {relatedTitles.length > 0 && (
                    <div style={s.infoBlock} className="fx-avoid">
                      <p style={s.smallLabel}>Related careers</p>
                      <p style={s.text}>{relatedTitles.join(", ")}</p>
                    </div>
                  )}
                </div>

                <div style={s.section} className="fx-avoid">
                  <h3 style={s.sectionTitle}>3. Your progress</h3>
                  <p style={s.text}>
                    <strong>{percent}%</strong> complete: {completed.length} of {steps.length} steps
                    done.
                  </p>
                  <div style={s.barTrack}>
                    <div style={{ ...s.barFill, width: `${percent}%` }} />
                  </div>

                  {remaining.length === 0 ? (
                    <p style={s.text}>You have finished every step of this roadmap.</p>
                  ) : (
                    <>
                      <p style={s.smallLabel}>Your next steps</p>
                      {nextSteps.map((st, i) => (
                        <p key={st.id} style={s.listLine}>
                          {i + 1}. {st.title}{" "}
                          <span style={s.muted}>
                            ({TYPE_LABELS[st.step_type] || "Step"}, about {stepHours(st)} hours)
                          </span>
                        </p>
                      ))}
                    </>
                  )}
                </div>

                <div style={s.section} className="fx-avoid">
                  <h3 style={s.sectionTitle}>4. Skill check</h3>
                  {!skillCheck.hasCareerSkills && (
                    <p style={s.text}>Skill information is not available for this career yet.</p>
                  )}
                  {skillCheck.hasCareerSkills && !skillCheck.hasStudentSkills && (
                    <p style={s.text}>
                      No skills are listed in your profile yet. Add them in Edit Profile to see how
                      you match.
                    </p>
                  )}
                  {skillCheck.hasCareerSkills && skillCheck.hasStudentSkills && (
                    <>
                      <p style={s.smallLabel}>Skills you already have</p>
                      <p style={s.text}>
                        {skillCheck.have.length ? skillCheck.have.join(", ") : "None matched yet"}
                      </p>
                      <p style={s.smallLabel}>Skills to build</p>
                      {skillCheck.missing.length === 0 ? (
                        <p style={s.text}>You already cover every core skill listed.</p>
                      ) : (
                        skillCheck.missing.map((m) => (
                          <p key={m.skill} style={s.listLine}>
                            {m.skill}
                            {m.related.length > 0 && (
                              <span style={s.muted}>
                                {" "}
                                (practice it in: {m.related.map((r) => r.title).join("; ")})
                              </span>
                            )}
                          </p>
                        ))
                      )}
                      <p style={s.note}>
                        This only compares the skills listed in your profile. It is a guide, not a
                        test.
                      </p>
                    </>
                  )}
                </div>

                {remaining.length > 0 && (
                  <div style={s.section} className="fx-avoid">
                    <h3 style={s.sectionTitle}>5. Your study plan</h3>
                    <p style={s.text}>
                      At {hoursPerWeek} hours a week, the work left is about {plan.totalHours} hours,
                      which takes about {plan.totalWeeks} {plan.totalWeeks === 1 ? "week" : "weeks"}.
                      Estimated finish: <strong>{formatDay(plan.finishDate)}</strong>.
                    </p>
                    {plan.weeks.slice(0, 4).map((w) => (
                      <div key={w.week} style={s.weekBlock}>
                        <p style={s.weekTitle}>
                          Week {w.week}, finish by {formatDay(w.due)}
                        </p>
                        {w.items.map((item) => (
                          <p key={item.step.id} style={s.listLine}>
                            {item.step.title} <span style={s.muted}>({item.hours} h)</span>
                          </p>
                        ))}
                      </div>
                    ))}
                    {plan.weeks.length > 4 && (
                      <p style={s.muted}>
                        ...and {plan.weeks.length - 4} more weeks. The Smart Coach page has the full
                        plan and a calendar download.
                      </p>
                    )}
                    <p style={s.note}>
                      Time estimates are planning guides based on the type of step, not promises.
                    </p>
                  </div>
                )}

                <div style={s.section} className="fx-avoid">
                  <h3 style={s.sectionTitle}>6. Free resources for your next steps</h3>
                  {resourceGroups.length === 0 ? (
                    <p style={s.text}>
                      Resources appear here when your next steps match our free learning sites.
                    </p>
                  ) : (
                    resourceGroups.map((g) => (
                      <div key={g.step.id} style={s.infoBlock}>
                        <p style={s.smallLabel}>{g.step.title}</p>
                        {g.list.map((r) => (
                          <p key={r.id} style={s.listLine}>
                            {r.title}
                            {r.provider ? `, ${r.provider}` : ""}{" "}
                            <span style={s.link}>{r.url}</span>
                          </p>
                        ))}
                      </div>
                    ))
                  )}
                </div>

                <div style={s.section} className="fx-avoid">
                  <h3 style={s.sectionTitle}>7. Other careers that match your interests</h3>
                  {matches.length === 0 ? (
                    <p style={s.text}>
                      Add more interests and skills in Edit Profile to see other careers that match
                      you.
                    </p>
                  ) : (
                    matches.map((m) => (
                      <div key={m.c.id} style={s.infoBlock}>
                        <p style={s.matchTitle}>
                          {m.c.title} <span style={s.muted}>({m.c.category})</span>
                        </p>
                        {m.reasons[0] && <p style={s.text}>{m.reasons[0]}.</p>}
                      </div>
                    ))
                  )}
                </div>

                <p style={s.disclaimer}>
                  This report was generated automatically by Futurixia on {generatedOn} from your
                  profile and progress. Salaries, requirements and time estimates are general
                  guidance only. Please confirm exams, licensing and eligibility with the official
                  authority in your country before making decisions.
                </p>
              </div>
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

const s = {
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
    maxWidth: "860px",
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
  controls: {
    background: "rgba(15,17,32,0.88)",
    borderRadius: "22px",
    padding: "26px 24px",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
  },
  heading: { textAlign: "center", marginBottom: "10px" },
  headingIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "54px",
    height: "54px",
    borderRadius: "16px",
    background: "rgba(99,102,241,0.16)",
    color: "#a5b4fc",
    margin: "0 auto 14px",
  },
  h1: { fontSize: "1.6rem", fontWeight: 800, marginBottom: "8px" },
  subtext: { color: "#a9adc4", fontSize: "0.92rem", lineHeight: 1.6 },
  label: {
    display: "block",
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#9599b0",
    margin: "16px 0 8px",
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
  printBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    marginTop: "20px",
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
  emptyCard: {
    background: "rgba(15,17,32,0.6)",
    borderRadius: "18px",
    padding: "22px",
    textAlign: "center",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
  },
  emptyText: { color: "#9599b0", fontSize: "0.9rem", lineHeight: 1.6 },
  errorText: { color: "#ff9b9b", fontSize: "0.88rem", lineHeight: 1.5 },

  paper: {
    background: "#ffffff",
    color: "#1b1d2e",
    borderRadius: "18px",
    padding: "clamp(20px, 5vw, 44px)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  paperHead: {
    borderBottom: "3px solid #6366f1",
    paddingBottom: "18px",
    marginBottom: "10px",
  },
  brand: { fontSize: "1.3rem", fontWeight: 800, color: "#4f46e5" },
  kicker: {
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#0891b2",
    margin: "2px 0 14px",
  },
  studentName: { fontSize: "1.7rem", fontWeight: 800, color: "#1b1d2e", wordBreak: "break-word" },
  metaLine: { color: "#4b4f66", fontSize: "0.9rem", marginTop: "4px" },
  section: { marginTop: "26px" },
  sectionTitle: {
    fontSize: "1.05rem",
    fontWeight: 800,
    color: "#4f46e5",
    borderBottom: "1px solid #e0e7ff",
    paddingBottom: "6px",
    marginBottom: "12px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "10px",
    margin: "12px 0",
  },
  fact: {
    background: "#f5f6ff",
    borderRadius: "10px",
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  factLabel: {
    fontSize: "0.66rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#7d8299",
  },
  factValue: { fontSize: "0.92rem", fontWeight: 600, color: "#1b1d2e", wordBreak: "break-word" },
  smallLabel: {
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#0891b2",
    margin: "12px 0 3px",
  },
  text: { color: "#2e3147", fontSize: "0.92rem", lineHeight: 1.65, wordBreak: "break-word" },
  note: { color: "#6b6f86", fontSize: "0.78rem", lineHeight: 1.55, marginTop: "10px" },
  muted: { color: "#7d8299", fontSize: "0.82rem" },
  link: { color: "#4f46e5", fontSize: "0.8rem", wordBreak: "break-all" },
  infoBlock: { marginTop: "8px" },
  listLine: { color: "#2e3147", fontSize: "0.9rem", lineHeight: 1.6, margin: "3px 0", wordBreak: "break-word" },
  matchTitle: { color: "#1b1d2e", fontSize: "0.95rem", fontWeight: 700 },
  barTrack: {
    width: "100%",
    height: "10px",
    background: "#e5e7f5",
    borderRadius: "10px",
    overflow: "hidden",
    margin: "8px 0 4px",
  },
  barFill: {
    height: "100%",
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    borderRadius: "10px",
  },
  weekBlock: {
    background: "#f5f6ff",
    borderRadius: "10px",
    padding: "10px 14px",
    margin: "8px 0",
  },
  weekTitle: { color: "#4f46e5", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" },
  disclaimer: {
    marginTop: "30px",
    paddingTop: "14px",
    borderTop: "1px solid #e5e7f5",
    color: "#7d8299",
    fontSize: "0.72rem",
    lineHeight: 1.6,
  },
}

export default Report