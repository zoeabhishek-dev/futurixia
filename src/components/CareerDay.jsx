import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Sunrise,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  Info,
  Lightbulb,
  CheckCircle2,
  Clock,
  MapPin,
} from "lucide-react"
import { supabase } from "../supabaseClient"

const QUESTIONS = [
  {
    key: "interest",
    title: "How interesting did the daily activities seem?",
    options: [
      { value: "very", label: "Very interesting" },
      { value: "some", label: "Some activities interest me" },
      { value: "little", label: "Not very interesting" },
    ],
  },
  {
    key: "challenges",
    title: "How do you feel about the challenges?",
    options: [
      { value: "willing", label: "I am willing to learn to handle them" },
      { value: "unsure", label: "I am not sure yet" },
      { value: "concerned", label: "Some challenges concern me" },
    ],
  },
  {
    key: "next",
    title: "What would you like to do next?",
    options: [
      { value: "activity", label: "Try a practical activity" },
      { value: "compare", label: "Compare this career with another" },
      { value: "research", label: "Research qualifications and career pathways" },
    ],
  },
]

const INTEREST_FEEDBACK = {
  very: "It is great that several parts of this day caught your interest. Interest is a good reason to keep exploring, and the best way to learn more is to test it with real activities.",
  some: "Finding some parts interesting and others less so is completely normal. Most careers are a mix, so notice which activities you would be happy to do again and again.",
  little: "It is useful to learn early that parts of a career do not appeal to you. That is not a failure, it is information. You could look at a career with a different kind of day.",
}

const CHALLENGE_FEEDBACK = {
  willing: "Being willing to learn how to handle the challenges is a helpful attitude. Skills can be built step by step, and the roadmap shows how.",
  unsure: "Feeling unsure is fine, and you do not need to decide now. Talking to someone who works in this career or trying a small activity can make the challenges clearer.",
  concerned: "It is sensible to take challenges seriously. Concerns are worth exploring rather than ignoring: find out how people in this career manage them, and whether some roles or specializations have less of that challenge.",
}

const NEXT_FEEDBACK = {
  activity: {
    text: "A small, safe activity is a good way to find out how this kind of work feels. Try the activity in this section and note what you enjoyed and what you did not.",
    button: "Go to the practical activity",
  },
  compare: {
    text: "Comparing careers side by side can make your own preferences clearer. Choose a career with a very different kind of day and see how the facts differ.",
    button: "Compare with another career",
  },
  research: {
    text: "Checking the education and exams needed will show how long the path is and what it asks of you. The roadmap below lists the steps in order.",
    button: "See the roadmap steps",
  },
}

function asList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

function formatDate(value) {
  if (!value) return ""
  const d = new Date(`${value}T12:00:00`)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
}

function Section({ title, id, children }) {
  return (
    <section style={c.section} id={id}>
      <h3 style={c.sectionTitle}>{title}</h3>
      {children}
    </section>
  )
}

function Chips({ items }) {
  return (
    <div style={c.chips}>
      {items.map((item) => (
        <span key={item} style={c.chip}>
          {item}
        </span>
      ))}
    </div>
  )
}

function CareerDay({ career, userId }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState("idle")
  const [data, setData] = useState(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [answers, setAnswers] = useState({ interest: "", challenges: "", next: "" })
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState("")
  const [activityDone, setActivityDone] = useState(false)
  const [saveState, setSaveState] = useState("idle")

  useEffect(() => {
    if (!open || hasLoaded) return
    let active = true

    const load = async () => {
      setStatus("loading")

      try {
        const res = await fetch(`/career-days/${career.slug}.json`)
        if (!res.ok) {
          if (active) setStatus("missing")
        } else {
          let json = null
          try {
            json = await res.json()
          } catch (parseError) {
            json = null
          }
          if (!active) return
          if (!json || !Array.isArray(json.timeline)) {
            setStatus("missing")
          } else {
            setData(json)
            setStatus("ready")
          }
        }
      } catch (fetchError) {
        if (active) setStatus("error")
      }

      if (userId && career.id) {
        const { data: row } = await supabase
          .from("career_day_responses")
          .select("*")
          .eq("user_id", userId)
          .eq("career_id", career.id)
          .maybeSingle()

        if (active && row) {
          setActivityDone(!!row.activity_done)
          if (row.interest && row.challenges_feeling && row.next_action) {
            setAnswers({
              interest: row.interest,
              challenges: row.challenges_feeling,
              next: row.next_action,
            })
            setSubmitted(true)
          }
        }
      }

      if (active) setHasLoaded(true)
    }

    load()
    return () => {
      active = false
    }
  }, [open, hasLoaded, career.slug, career.id, userId])

  const saveResponse = async (fields) => {
    if (!userId) return true
    setSaveState("saving")
    const { error } = await supabase.from("career_day_responses").upsert(
      {
        user_id: userId,
        career_id: career.id,
        ...fields,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,career_id" }
    )
    if (error) {
      setSaveState("error")
      return false
    }
    setSaveState("saved")
    return true
  }

  const toggleActivity = async (checked) => {
    setActivityDone(checked)
    const ok = await saveResponse({ activity_done: checked })
    if (!ok) setActivityDone(!checked)
  }

  const submitReflection = async (e) => {
    e.preventDefault()
    if (!answers.interest || !answers.challenges || !answers.next) {
      setFormError("Please answer all three questions to see your feedback.")
      return
    }
    setFormError("")
    setSubmitted(true)
    await saveResponse({
      interest: answers.interest,
      challenges_feeling: answers.challenges,
      next_action: answers.next,
    })
  }

  const scrollToId = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const goNext = () => {
    if (answers.next === "activity") scrollToId("try-it-yourself")
    else if (answers.next === "compare") navigate(`/compare?a=${career.slug}`)
    else scrollToId("roadmap-start")
  }

  const overview = (data && data.overview) || {}
  const overviewBlocks = [
    ["What they do", overview.summary],
    ["Problems they solve", overview.problems],
    ["Who they work with", overview.worksWith],
    ["Where they work", overview.workplaces],
  ].filter(([, value]) => value)

  const timeline = asList(data && data.timeline)
  const responsibilities = asList(data && data.responsibilities)
  const challenges = asList(data && data.challenges)
  const skills = asList(data && data.skills)
  const rewards = asList(data && data.rewards)
  const tradeoffs = asList(data && data.tradeoffs)
  const activity = (data && data.activity) || null
  const activitySteps = asList(activity && activity.steps)
  const nextInfo = NEXT_FEEDBACK[answers.next]

  return (
    <div style={c.wrap}>
      <style>{`@keyframes fxspin { to { transform: rotate(360deg); } }`}</style>

      <button
        style={c.toggle}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls="career-day-panel"
      >
        <Sunrise size={17} />
        A Day in This Career
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div style={c.panel} id="career-day-panel">
          {status === "loading" && (
            <div style={c.centerBox}>
              <Loader2 size={24} color="#a5b4fc" style={{ animation: "fxspin 0.9s linear infinite" }} />
              <p style={c.mutedText}>Loading...</p>
            </div>
          )}

          {status === "error" && (
            <div style={c.centerBox} role="alert">
              <AlertTriangle size={24} color="#ff9b9b" />
              <p style={c.mutedText}>
                We could not load this section. Please check your connection and try again later.
              </p>
            </div>
          )}

          {status === "missing" && (
            <div style={c.centerBox}>
              <Info size={24} color="#a5b4fc" />
              <p style={c.mutedText}>
                We have not written "A Day in This Career" for {career.title} yet. We are adding
                careers one at a time, and we would rather show nothing than guess.
              </p>
            </div>
          )}

          {status === "ready" && data && (
            <>
              <div style={c.notice}>
                <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  This is an example of a typical day, not a promise. Real working days depend on
                  the specialization, employer, location and experience.
                </span>
              </div>

              {overviewBlocks.length > 0 && (
                <Section title="Career overview">
                  <div style={c.grid}>
                    {overviewBlocks.map(([label, value]) => (
                      <div key={label} style={c.infoBox}>
                        <span style={c.infoLabel}>{label}</span>
                        <p style={c.text}>{value}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {timeline.length > 0 && (
                <Section title="A typical working day">
                  <ol style={c.timeline}>
                    {timeline.map((item, i) => (
                      <li key={`${item.title}-${i}`} style={c.timelineItem}>
                        <span style={c.dot} />
                        <div style={c.timeCard}>
                          <span style={c.timePill}>
                            <Clock size={12} />
                            {item.time}
                          </span>
                          <h4 style={c.itemTitle}>{item.title}</h4>
                          <p style={c.text}>{item.description}</p>
                          {item.why && (
                            <p style={c.why}>
                              <strong>Why it matters: </strong>
                              {item.why}
                            </p>
                          )}
                          {asList(item.skills).length > 0 && <Chips items={asList(item.skills)} />}
                        </div>
                      </li>
                    ))}
                  </ol>
                </Section>
              )}

              {responsibilities.length > 0 && (
                <Section title="Real responsibilities">
                  <ul style={c.list}>
                    {responsibilities.map((r) => (
                      <li key={r} style={c.listItem}>
                        <CheckCircle2 size={15} color="#67e8f9" style={{ flexShrink: 0, marginTop: 3 }} />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {challenges.length > 0 && (
                <Section title="The difficult parts">
                  <div style={c.grid}>
                    {challenges.map((ch) => (
                      <div key={ch} style={c.challengeCard}>
                        <AlertTriangle size={15} color="#fbbf24" style={{ flexShrink: 0, marginTop: 3 }} />
                        <span style={c.text}>{ch}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {skills.length > 0 && (
                <Section title="Skills used every day">
                  <Chips items={skills} />
                </Section>
              )}

              {data.workEnvironment && (
                <Section title="Work environment">
                  <div style={c.envBox}>
                    <MapPin size={16} color="#a5b4fc" style={{ flexShrink: 0, marginTop: 3 }} />
                    <p style={c.text}>{data.workEnvironment}</p>
                  </div>
                </Section>
              )}

              {(rewards.length > 0 || tradeoffs.length > 0) && (
                <Section title="Rewards and trade-offs">
                  <div style={c.grid}>
                    {rewards.length > 0 && (
                      <div style={c.rewardBox}>
                        <span style={c.infoLabel}>What people may find rewarding</span>
                        <ul style={c.plainList}>
                          {rewards.map((r) => (
                            <li key={r} style={c.plainItem}>
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {tradeoffs.length > 0 && (
                      <div style={c.tradeoffBox}>
                        <span style={c.infoLabel}>Trade-offs to think about</span>
                        <ul style={c.plainList}>
                          {tradeoffs.map((t) => (
                            <li key={t} style={c.plainItem}>
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Section>
              )}

              {activity && activitySteps.length > 0 && (
                <Section title="Try it yourself" id="try-it-yourself">
                  <div style={c.activityBox}>
                    <div style={c.activityHead}>
                      <Lightbulb size={18} color="#fde047" />
                      <h4 style={c.itemTitle}>{activity.title}</h4>
                    </div>
                    <ol style={c.steps}>
                      {activitySteps.map((step) => (
                        <li key={step} style={c.stepItem}>
                          {step}
                        </li>
                      ))}
                    </ol>
                    {activity.outcome && (
                      <p style={c.text}>
                        <strong>What you may learn: </strong>
                        {activity.outcome}
                      </p>
                    )}
                    {activity.safety && (
                      <p style={c.safety}>
                        <strong>Stay safe: </strong>
                        {activity.safety}
                      </p>
                    )}
                    <label style={c.checkLabel}>
                      <input
                        type="checkbox"
                        checked={activityDone}
                        onChange={(e) => toggleActivity(e.target.checked)}
                        style={c.checkInput}
                      />
                      <span>I tried this activity</span>
                    </label>
                    <p style={c.footNote}>
                      Activities are for exploring a career. They are not qualifications and do not
                      prove any skill.
                    </p>
                  </div>
                </Section>
              )}

              <Section title="Career reality check">
                {!submitted ? (
                  <form onSubmit={submitReflection} noValidate>
                    <p style={c.mutedText}>
                      Three quick questions to help you think. There are no right or wrong answers.
                    </p>

                    {QUESTIONS.map((q) => (
                      <fieldset key={q.key} style={c.fieldset}>
                        <legend style={c.legend}>{q.title}</legend>
                        {q.options.map((opt) => (
                          <label
                            key={opt.value}
                            style={{
                              ...c.radioLabel,
                              ...(answers[q.key] === opt.value ? c.radioLabelOn : {}),
                            }}
                          >
                            <input
                              type="radio"
                              name={`${career.slug}-${q.key}`}
                              value={opt.value}
                              checked={answers[q.key] === opt.value}
                              onChange={() => setAnswers((prev) => ({ ...prev, [q.key]: opt.value }))}
                              style={c.radioInput}
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </fieldset>
                    ))}

                    {formError && (
                      <p style={c.errorText} role="alert">
                        {formError}
                      </p>
                    )}

                    <button type="submit" style={c.primaryBtn}>
                      See my feedback
                    </button>
                  </form>
                ) : (
                  <div style={c.feedback} role="status">
                    <h4 style={c.itemTitle}>Your reflection</h4>
                    <p style={c.text}>{INTEREST_FEEDBACK[answers.interest]}</p>
                    <p style={c.text}>{CHALLENGE_FEEDBACK[answers.challenges]}</p>
                    {nextInfo && (
                      <>
                        <p style={c.text}>{nextInfo.text}</p>
                        <button style={c.primaryBtn} onClick={goNext}>
                          {nextInfo.button}
                        </button>
                      </>
                    )}
                    <p style={c.footNote}>
                      This reflection is not a test. It does not say whether you are suited to this
                      career, and only you can decide that. Your views can change as you learn more.
                    </p>
                    <button style={c.secondaryBtn} onClick={() => setSubmitted(false)}>
                      Change my answers
                    </button>
                  </div>
                )}

                {!userId && (
                  <p style={c.footNote}>
                    Log in to save your answers and your activity progress to your account.
                  </p>
                )}
                {userId && saveState === "saving" && <p style={c.footNote}>Saving...</p>}
                {userId && saveState === "saved" && (
                  <p style={c.savedNote}>Saved to your account. Only you can see it.</p>
                )}
                {userId && saveState === "error" && (
                  <p style={c.errorText} role="alert">
                    We could not save this. It is shown here, but it may be lost when you leave the
                    page.
                  </p>
                )}
              </Section>

              <p style={c.footNote}>
                {data.source}{" "}
                {data.lastReviewed ? `Written on ${formatDate(data.lastReviewed)}. ` : ""}
                {data.reviewedBy
                  ? `Reviewed by ${data.reviewedBy}.`
                  : "Not yet reviewed by a working professional."}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const c = {
  wrap: { marginBottom: "28px" },
  toggle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    color: "#c7d2fe",
    border: "none",
    padding: "14px",
    borderRadius: "16px",
    fontSize: "0.9rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
    fontFamily: "inherit",
  },
  panel: {
    marginTop: "16px",
    background: "rgba(15,17,32,0.6)",
    borderRadius: "18px",
    padding: "22px 20px",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
  },
  centerBox: { textAlign: "center", padding: "10px 6px" },
  notice: {
    display: "flex",
    gap: "10px",
    background: "rgba(99,102,241,0.1)",
    color: "#c7d2fe",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "0.82rem",
    lineHeight: 1.5,
    marginBottom: "6px",
  },
  section: { marginTop: "26px" },
  sectionTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: "#a5b4fc",
    marginBottom: "12px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "12px",
  },
  infoBox: { background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "14px 16px" },
  infoLabel: {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#67e8f9",
    marginBottom: "6px",
  },
  text: { color: "#c9cbdb", fontSize: "0.88rem", lineHeight: 1.65, wordBreak: "break-word" },
  mutedText: { color: "#a9adc4", fontSize: "0.88rem", lineHeight: 1.6, marginTop: "8px" },
  timeline: {
    listStyle: "none",
    margin: 0,
    padding: "0 0 0 22px",
    borderLeft: "2px solid rgba(99,102,241,0.45)",
  },
  timelineItem: { position: "relative", marginBottom: "16px" },
  dot: {
    position: "absolute",
    left: "-30px",
    top: "18px",
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    background: "#22d3ee",
    boxShadow: "0 0 0 4px #0f1120",
  },
  timeCard: { background: "rgba(255,255,255,0.05)", borderRadius: "14px", padding: "14px 16px" },
  timePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(34,211,238,0.12)",
    color: "#67e8f9",
    fontSize: "0.74rem",
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: "20px",
  },
  itemTitle: { fontSize: "1rem", fontWeight: 700, color: "#fff", margin: "8px 0 6px" },
  why: { color: "#a9adc4", fontSize: "0.84rem", lineHeight: 1.6, marginTop: "8px" },
  chips: { display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" },
  chip: {
    background: "rgba(99,102,241,0.18)",
    color: "#c7d2fe",
    fontSize: "0.76rem",
    fontWeight: 600,
    padding: "5px 12px",
    borderRadius: "20px",
  },
  list: { listStyle: "none", margin: 0, padding: 0 },
  listItem: {
    display: "flex",
    gap: "10px",
    color: "#c9cbdb",
    fontSize: "0.88rem",
    lineHeight: 1.6,
    marginBottom: "8px",
  },
  challengeCard: {
    display: "flex",
    gap: "10px",
    background: "rgba(251,191,36,0.07)",
    borderRadius: "12px",
    padding: "12px 14px",
  },
  envBox: {
    display: "flex",
    gap: "10px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "12px",
    padding: "14px 16px",
  },
  rewardBox: { background: "rgba(74,222,128,0.07)", borderRadius: "12px", padding: "14px 16px" },
  tradeoffBox: { background: "rgba(255,155,155,0.07)", borderRadius: "12px", padding: "14px 16px" },
  plainList: { margin: 0, paddingLeft: "18px" },
  plainItem: { color: "#c9cbdb", fontSize: "0.86rem", lineHeight: 1.6, marginBottom: "6px" },
  activityBox: { background: "rgba(253,224,71,0.06)", borderRadius: "14px", padding: "16px 18px" },
  activityHead: { display: "flex", alignItems: "center", gap: "10px" },
  steps: { margin: "10px 0 12px", paddingLeft: "20px" },
  stepItem: { color: "#c9cbdb", fontSize: "0.88rem", lineHeight: 1.65, marginBottom: "6px" },
  safety: { color: "#fde68a", fontSize: "0.84rem", lineHeight: 1.6, marginTop: "8px" },
  checkLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#fff",
    fontSize: "0.9rem",
    fontWeight: 600,
    marginTop: "14px",
    cursor: "pointer",
  },
  checkInput: { width: "18px", height: "18px", accentColor: "#6366f1", cursor: "pointer" },
  footNote: { color: "#7d8299", fontSize: "0.74rem", lineHeight: 1.6, marginTop: "12px" },
  savedNote: { color: "#86efac", fontSize: "0.78rem", marginTop: "10px" },
  errorText: { color: "#ff9b9b", fontSize: "0.85rem", lineHeight: 1.5, marginTop: "12px" },
  fieldset: { border: "none", padding: 0, margin: "18px 0 0", minWidth: 0 },
  legend: { color: "#fff", fontSize: "0.92rem", fontWeight: 700, marginBottom: "10px", padding: 0 },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "12px",
    padding: "11px 14px",
    marginBottom: "8px",
    color: "#c9cbdb",
    fontSize: "0.88rem",
    cursor: "pointer",
  },
  radioLabelOn: {
    background: "rgba(99,102,241,0.2)",
    color: "#fff",
    boxShadow: "inset 0 0 0 1px rgba(99,102,241,0.6)",
  },
  radioInput: { width: "17px", height: "17px", accentColor: "#6366f1", cursor: "pointer", flexShrink: 0 },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "14px",
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    color: "#fff",
    border: "none",
    padding: "12px 24px",
    borderRadius: "30px",
    fontSize: "0.88rem",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "12px",
    background: "rgba(255,255,255,0.08)",
    color: "#e0e1ff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "30px",
    fontSize: "0.82rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)",
    fontFamily: "inherit",
  },
  feedback: { background: "rgba(99,102,241,0.08)", borderRadius: "14px", padding: "16px 18px" },
}

export default CareerDay