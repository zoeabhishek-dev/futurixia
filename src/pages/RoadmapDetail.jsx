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
  Wallet,
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
  const [career, setCareer] = useState(null)
  const [steps, setSteps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) {
        navigate("/login")
        return
      }

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

      setSteps(stepsData || [])
      setLoading(false)
    }

    load()
  }, [slug, navigate])

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

          <div style={styles.stepCountPill}>
            {steps.length} steps to get there
          </div>
        </motion.div>

        <div style={styles.timeline}>
          {steps.map((step, i) => {
            const Icon = STEP_TYPE_ICONS[step.step_type] || CheckCircle2
            const color = STEP_TYPE_COLORS[step.step_type] || "#a5b4fc"

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.6) }}
                style={styles.stepRow}
              >
                <div style={styles.stepLeft}>
                  <div style={{ ...styles.stepIconCircle, background: `${color}2e`, color, boxShadow: `0 0 0 2px ${color}55` }}>
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  {i < steps.length - 1 && <div style={styles.stepLine} />}
                </div>

                <div style={styles.stepCard}>
                  <span style={{ ...styles.stepBadge, color }}>
                    Step {step.step_order} · {step.step_type}
                  </span>
                  <h3 style={styles.stepTitle}>{step.title}</h3>
                  <p style={styles.stepDesc}>{step.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {steps.length === 0 && (
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
    margin: "20px 0 50px",
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
  stepCountPill: {
    display: "block",
    color: "#9599b0",
    fontSize: "0.82rem",
    marginTop: "14px",
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
  },
  stepLine: {
    width: "2px",
    flex: 1,
    background: "rgba(255,255,255,0.15)",
    margin: "6px 0",
  },
  stepCard: {
    flex: 1,
    background: "rgba(15,17,32,0.85)",
    borderRadius: "18px",
    padding: "22px 24px",
    marginBottom: "24px",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.09), 0 10px 30px rgba(0,0,0,0.35)",
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
    margin: "8px 0 8px",
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