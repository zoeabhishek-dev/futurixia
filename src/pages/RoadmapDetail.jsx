import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  GraduationCap,
  Sparkles,
  FolderKanban,
  Briefcase,
  FileCheck,
  Flag,
  CheckCircle2,
  Circle,
  Wallet,
  Trophy,
  Compass,
  Map,
} from "lucide-react"
import { supabase } from "../supabaseClient"

const STEP_TYPE_ICONS = {
  education: GraduationCap,
  skill: Sparkles,
  project: FolderKanban,
  experience: Briefcase,
  exam: FileCheck,
  milestone: Flag,
}

const STEP_TYPE_COLORS = {
  education: "#a5b4fc",
  skill: "#67e8f9",
  project: "#fdba74",
  experience: "#86efac",
  exam: "#f9a8d4",
  milestone: "#fde047",
}

function RoadmapDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [userId, setUserId] = useState(null)
  const [career, setCareer] = useState(null)
  const [introSteps, setIntroSteps] = useState([])
  const [coreSteps, setCoreSteps] = useState([])
  const [completedStepIds, setCompletedStepIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [savingStepId, setSavingStepId] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user

      if (!user) {
        navigate("/login")
        return
      }

      setUserId(user.id)

      const { data: profileData } = await supabase
        .from("profiles")
        .select("current_stage")
        .eq("id", user.id)
        .maybeSingle()

      const studentStage = profileData?.current_stage || null

      const { data: careerData, error: careerError } = await supabase
        .from("careers")
        .select("*")
        .eq("slug", slug)
        .maybeSingle()

      if (careerError || !careerData) {
        setLoading(false)
        return
      }

      setCareer(careerData)

      const { data: stepsData } = await supabase
        .from("roadmap_steps")
        .select("*")
        .eq("career_id", careerData.id)
        .order("step_order")

      const allSteps = stepsData || []

      const matchedIntro = studentStage
        ? allSteps
            .filter((s) => s.phase === "intro" && s.stage === studentStage)
            .sort((a, b) => a.step_order - b.step_order)
        : []

      const core = allSteps
        .filter((s) => s.phase === "core")
        .sort((a, b) => a.step_order - b.step_order)

      setIntroSteps(matchedIntro)
      setCoreSteps(core)

      const { data: progressData } = await supabase
        .from("user_progress")
        .select("step_id")
        .eq("user_id", user.id)

      if (progressData) {
        setCompletedStepIds(new Set(progressData.map((p) => p.step_id)))
      }

      setLoading(false)
    }

    load()
  }, [slug, navigate])

  const toggleStep = async (stepId) => {
    if (!userId || savingStepId) return
    setSavingStepId(stepId)

    const isCompleted = completedStepIds.has(stepId)

    if (isCompleted) {
      await supabase
        .from("user_progress")
        .delete()
        .eq("user_id", userId)
        .eq("step_id", stepId)

      setCompletedStepIds((prev) => {
        const next = new Set(prev)
        next.delete(stepId)
        return next
      })
    } else {
      await supabase
        .from("user_progress")
        .insert({ user_id: userId, step_id: stepId })

      setCompletedStepIds((prev) => new Set(prev).add(stepId))
    }

    setSavingStepId(null)
  }

  if (loading) {
    return (
      <div style={styles.centerPage}>
        <p>Loading roadmap...</p>
      </div>
    )
  }

  if (!career) {
    return (
      <div style={styles.centerPage}>
        <p>Career not found.</p>
        <button style={styles.backBtn} onClick={() => navigate("/careers")}>
          <ArrowLeft size={16} />
          Back to Careers
        </button>
      </div>
    )
  }

  const combinedSteps = [...introSteps, ...coreSteps]
  const completedCount = combinedSteps.filter((s) => completedStepIds.has(s.id)).length
  const progressPercent =
    combinedSteps.length > 0 ? Math.round((completedCount / combinedSteps.length) * 100) : 0

  const renderStepCard = (step, displayNumber, isFirstCoreStep) => {
    const Icon = STEP_TYPE_ICONS[step.step_type] || CheckCircle2
    const color = STEP_TYPE_COLORS[step.step_type] || "#a5b4fc"
    const isDone = completedStepIds.has(step.id)

    return (
      <div key={step.id}>
        {isFirstCoreStep && (
          <div style={styles.sectionDivider}>
            <Map size={16} />
            <span>Full Career Roadmap</span>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.3 }}
          style={styles.stepRow}
        >
          <div style={styles.stepLeft}>
            <div
              style={{
                ...styles.stepIconCircle,
                background: isDone ? "rgba(34,197,94,0.25)" : `${color}2e`,
                color: isDone ? "#4ade80" : color,
                boxShadow: isDone
                  ? "0 0 0 2px rgba(74,222,128,0.5)"
                  : `0 0 0 2px ${color}55`,
              }}
            >
              <Icon size={18} strokeWidth={2} />
            </div>
            {displayNumber < combinedSteps.length && (
              <div
                style={{
                  ...styles.stepLine,
                  background: isDone ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.15)",
                }}
              />
            )}
          </div>

          <div style={{ ...styles.stepCard, opacity: isDone ? 0.75 : 1 }}>
            <div style={styles.stepCardTop}>
              <span style={{ ...styles.stepBadge, color }}>
                Step {displayNumber} · {step.step_type}
                {step.phase === "intro" && " · Getting Started"}
              </span>
              <button
                style={{
                  ...styles.checkBtn,
                  background: isDone ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.07)",
                  color: isDone ? "#4ade80" : "#9599b0",
                }}
                onClick={() => toggleStep(step.id)}
                disabled={savingStepId === step.id}
              >
                {isDone ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                {isDone ? "Done" : "Mark Done"}
              </button>
            </div>
            <h3
              style={{
                ...styles.stepTitle,
                textDecoration: isDone ? "line-through" : "none",
              }}
            >
              {step.title}
            </h3>
            <p style={styles.stepDesc}>{step.description}</p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div className="aurora-bg" style={{ opacity: 0.5 }}>
        <div className="aurora-blob blob-a" />
        <div className="aurora-blob blob-b" />
        <div className="aurora-blob blob-c" />
      </div>

      <nav style={styles.nav}>
        <button style={styles.backBtn} onClick={() => navigate("/careers")}>
          <ArrowLeft size={16} />
          All Careers
        </button>
        <div style={styles.logo}>Futurixia</div>
        <span style={{ width: 110 }} />
      </nav>

      <div style={styles.content}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={styles.heroCard}
        >
          <span style={styles.category}>{career.category}</span>
          <h1 style={styles.title}>{career.title}</h1>
          <p style={styles.desc}>{career.short_description}</p>

          {career.salary_range && (
            <div style={styles.salaryPill}>
              <Wallet size={16} />
              <span>{career.salary_range}</span>
            </div>
          )}

          <div style={styles.progressSection}>
            <div style={styles.progressBarTrack}>
              <motion.div
                style={styles.progressBarFill}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div style={styles.progressLabelRow}>
              <span style={styles.progressLabel}>
                {completedCount} of {combinedSteps.length} steps completed
              </span>
              {progressPercent === 100 && combinedSteps.length > 0 && (
                <span style={styles.completeBadge}>
                  <Trophy size={13} />
                  Roadmap Complete!
                </span>
              )}
            </div>
          </div>

          {introSteps.length === 0 && (
            <p style={styles.introMissingNote}>
              Personalized starting steps for your stage are coming soon for this career — showing the full core roadmap below.
            </p>
          )}
        </motion.div>

        {introSteps.length > 0 && (
          <div style={styles.sectionDivider}>
            <Compass size={16} />
            <span>Getting Started From Where You Are</span>
          </div>
        )}

        <div style={styles.timeline}>
          {combinedSteps.map((step, i) =>
            renderStepCard(step, i + 1, introSteps.length > 0 && i === introSteps.length)
          )}
        </div>

        {combinedSteps.length === 0 && (
          <p style={styles.noSteps}>
            Roadmap content for this career is being added soon!
          </p>
        )}
      </div>
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
    overflow: "hidden",
  },
  centerPage: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    background: "#05070f",
    color: "#fff",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  nav: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "22px 40px",
    background: "rgba(5,7,15,0.75)",
    backdropFilter: "blur(14px)",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(255,255,255,0.09)",
    color: "#ffffff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "30px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  logo: {
    fontSize: "1.3rem",
    fontWeight: 800,
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  content: {
    position: "relative",
    zIndex: 1,
    maxWidth: "760px",
    margin: "0 auto",
    padding: "20px 24px 100px",
  },
  heroCard: {
    background: "rgba(15,17,32,0.85)",
    borderRadius: "24px",
    padding: "40px",
    textAlign: "center",
    margin: "20px 0 40px",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 20px 60px rgba(0,0,0,0.5)",
  },
  category: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#a5b4fc",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  title: {
    fontSize: "2.2rem",
    fontWeight: 800,
    margin: "10px 0 12px",
    color: "#ffffff",
  },
  desc: {
    color: "#c9cbdb",
    fontSize: "1rem",
    lineHeight: 1.6,
    maxWidth: "500px",
    margin: "0 auto",
  },
  salaryPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(34,197,94,0.15)",
    color: "#86efac",
    padding: "10px 20px",
    borderRadius: "30px",
    fontSize: "0.88rem",
    fontWeight: 600,
    marginTop: "22px",
    boxShadow: "0 0 0 1px rgba(134,239,172,0.25)",
  },
  progressSection: {
    marginTop: "28px",
    maxWidth: "420px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  progressBarTrack: {
    width: "100%",
    height: "10px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "10px",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    borderRadius: "10px",
  },
  progressLabelRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    marginTop: "10px",
    flexWrap: "wrap",
  },
  progressLabel: {
    color: "#9599b0",
    fontSize: "0.82rem",
  },
  completeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    background: "rgba(250,204,21,0.15)",
    color: "#fde047",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: 700,
  },
  introMissingNote: {
    marginTop: "20px",
    fontSize: "0.8rem",
    color: "#9599b0",
    fontStyle: "italic",
  },
  sectionDivider: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#a5b4fc",
    fontSize: "0.85rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    margin: "0 0 20px 4px",
  },
  timeline: {
    display: "flex",
    flexDirection: "column",
  },
  stepRow: {
    display: "flex",
    gap: "20px",
  },
  stepLeft: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  stepIconCircle: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "background 0.2s ease, color 0.2s ease",
  },
  stepLine: {
    width: "2px",
    flex: 1,
    margin: "6px 0",
    transition: "background 0.2s ease",
  },
  stepCard: {
    flex: 1,
    background: "rgba(15,17,32,0.85)",
    borderRadius: "18px",
    padding: "22px 24px",
    marginBottom: "24px",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.09), 0 10px 30px rgba(0,0,0,0.35)",
    transition: "opacity 0.2s ease",
  },
  stepCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  checkBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    border: "none",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  stepBadge: {
    fontSize: "0.72rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  stepTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    margin: "10px 0 8px",
    color: "#ffffff",
  },
  stepDesc: {
    color: "#c2c4d6",
    fontSize: "0.92rem",
    lineHeight: 1.6,
  },
  noSteps: {
    textAlign: "center",
    color: "#9599b0",
    padding: "40px 0",
  },
}

export default RoadmapDetail