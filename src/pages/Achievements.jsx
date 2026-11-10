import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Flame } from "lucide-react"
import { supabase } from "../supabaseClient"
import Logo from "../components/Logo"
import BadgeIcon, { TIER_COLORS } from "../components/BadgeIcon"
import { fetchOverview } from "../lib/gamify"

const TIER_LABELS = { gold: "Gold", silver: "Silver", bronze: "Bronze" }

function formatDate(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

function Achievements() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [status, setStatus] = useState("loading")

  useEffect(() => {
    document.title = "Achievements | Futurixia"
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData?.session) {
        navigate("/login")
        return
      }
      const result = await fetchOverview()
      if (result) {
        setData(result)
        setStatus("ready")
      } else {
        setStatus("error")
      }
    }
    load()
  }, [navigate])

  if (status === "loading") {
    return (
      <div style={styles.center}>
        <p style={{ color: "var(--fx-muted-2)" }}>Loading your achievements...</p>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div style={styles.center}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <p style={{ color: "var(--fx-muted-2)", lineHeight: 1.6 }}>
            We could not load your achievements right now. Please try again in a moment.
          </p>
          <Link to="/dashboard" style={styles.backLink}>
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const { stats, badges } = data
  const earned = badges.filter((b) => b.earned_at)

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <Logo height={52} mobileHeight={42} />
        <Link to="/dashboard" style={styles.backLink}>
          <ArrowLeft size={15} />
          Dashboard
        </Link>
      </header>

      <main style={styles.main}>
        <h1 style={styles.h1}>Achievements</h1>

        <section style={styles.summary} aria-label="Summary">
          <div style={styles.sumItem}>
            <span style={styles.sumValue}>Level {stats.level}</span>
            <span style={styles.sumLabel}>{stats.level_title}</span>
          </div>
          <div style={styles.sumItem}>
            <span style={styles.sumValue}>{stats.xp}</span>
            <span style={styles.sumLabel}>Total XP</span>
          </div>
          <div style={styles.sumItem}>
            <span style={styles.sumValue}>
              <Flame size={18} color="#fb923c" style={{ verticalAlign: "-3px", marginRight: 4 }} />
              {stats.streak}
            </span>
            <span style={styles.sumLabel}>Day streak (best {stats.longest_streak})</span>
          </div>
          <div style={styles.sumItem}>
            <span style={styles.sumValue}>
              {earned.length}/{badges.length}
            </span>
            <span style={styles.sumLabel}>Badges earned</span>
          </div>
        </section>

        {["gold", "silver", "bronze"].map((tier) => {
          const list = badges.filter((b) => b.tier === tier)
          if (list.length === 0) return null
          return (
            <section key={tier} style={{ marginTop: 28 }} aria-label={`${TIER_LABELS[tier]} badges`}>
              <h2 style={{ ...styles.h2, color: TIER_COLORS[tier] }}>{TIER_LABELS[tier]}</h2>
              <ul style={styles.grid}>
                {list.map((b) => {
                  const isEarned = Boolean(b.earned_at)
                  const pct = Math.round((b.value / b.threshold) * 100)
                  return (
                    <li key={b.id} style={{ ...styles.card, ...(isEarned ? {} : styles.cardLocked) }}>
                      <BadgeIcon icon={b.icon} tier={b.tier} earned={isEarned} size={54} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={styles.name}>{b.name}</p>
                        <p style={styles.desc}>{b.description}</p>
                        {isEarned ? (
                          <p style={styles.earned}>
                            Earned {formatDate(b.earned_at)}
                            {b.xp > 0 ? ` · +${b.xp} XP` : ""}
                          </p>
                        ) : (
                          <>
                            <div
                              role="progressbar"
                              aria-label={`${b.name} progress`}
                              aria-valuemin={0}
                              aria-valuemax={b.threshold}
                              aria-valuenow={b.value}
                              style={styles.track}
                            >
                              <div style={{ ...styles.fill, width: `${pct}%` }} />
                            </div>
                            <p style={styles.progress}>
                              {b.value}/{b.threshold}
                              {b.xp > 0 ? ` · +${b.xp} XP` : ""}
                            </p>
                          </>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </main>
    </div>
  )
}

const styles = {
  page: { minHeight: "100vh", background: "var(--fx-bg)", color: "#ffffff", fontFamily: "Inter, system-ui, sans-serif" },
  center: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--fx-bg)",
    color: "#ffffff",
    padding: "20px",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  header: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "20px 20px 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: "var(--fx-text-2)",
    fontSize: "0.85rem",
    fontWeight: 600,
    textDecoration: "none",
    background: "rgba(255,255,255,0.08)",
    padding: "9px 16px",
    borderRadius: "30px",
    marginTop: "10px",
  },
  main: { maxWidth: "900px", margin: "0 auto", padding: "0 20px 70px" },
  h1: { fontSize: "clamp(1.6rem, 5vw, 2.1rem)", fontWeight: 800, margin: "14px 0 16px" },
  summary: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" },
  sumItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "16px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.05)",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.09)",
  },
  sumValue: { fontSize: "1.35rem", fontWeight: 800 },
  sumLabel: { fontSize: "0.78rem", color: "var(--fx-muted-2)" },
  h2: { fontSize: "1rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 12px" },
  grid: { listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: "12px" },
  card: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
    padding: "15px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.05)",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
  },
  cardLocked: { background: "rgba(255,255,255,0.025)" },
  name: { margin: 0, fontSize: "0.95rem", fontWeight: 800 },
  desc: { margin: "3px 0 8px", fontSize: "0.8rem", color: "var(--fx-muted-2)", lineHeight: 1.45 },
  earned: { margin: 0, fontSize: "0.76rem", fontWeight: 700, color: "#4ade80" },
  track: { height: "7px", borderRadius: "8px", background: "rgba(255,255,255,0.1)", overflow: "hidden" },
  fill: { height: "100%", borderRadius: "8px", background: "linear-gradient(90deg, #fbbf24, #fb923c)" },
  progress: { margin: "6px 0 0", fontSize: "0.76rem", color: "var(--fx-muted-2)", fontWeight: 600 },
}

export default Achievements
