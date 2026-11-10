import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { BookOpen, CheckCircle2, Compass, FileText, Flame, Footprints, ChevronRight, Sparkles } from "lucide-react"
import BadgeIcon from "./BadgeIcon"
import { fetchOverview } from "../lib/gamify"

const MISSION_ICONS = {
  steps_1: Footprints,
  steps_3: Footprints,
  new_career: Compass,
  reflect: BookOpen,
  report: FileText,
}

function missionLink(id, continueTo) {
  if (id === "report") return "/report"
  if (id === "new_career") return "/careers"
  return continueTo || "/careers"
}

// Level, XP, streak, today's missions and badges, all read from the database.
function GamePanel({ continueTo }) {
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    const result = await fetchOverview()
    if (result) {
      setData(result)
      setFailed(false)
    } else {
      setFailed(true)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const onData = (event) => {
      if (event.detail && event.detail.stats) setData(event.detail)
    }
    window.addEventListener("fx-gamify", onData)
    return () => window.removeEventListener("fx-gamify", onData)
  }, [])

  if (failed && !data) return null

  if (!data) {
    return (
      <section style={{ ...styles.panel, minHeight: "180px" }} aria-busy="true" aria-label="Loading your progress">
        <p style={styles.muted}>Loading your missions...</p>
      </section>
    )
  }

  const { stats, missions, badges } = data
  const span = Math.max(stats.next_level_xp - stats.level_start_xp, 1)
  const pct = Math.min(100, Math.max(0, Math.round(((stats.xp - stats.level_start_xp) / span) * 100)))
  const doneCount = missions.filter((m) => m.done).length
  const earned = badges.filter((b) => b.earned_at)
  const latest = [...earned].sort((a, b) => new Date(b.earned_at) - new Date(a.earned_at)).slice(0, 4)
  const upcoming = badges
    .filter((b) => !b.earned_at)
    .sort((a, b) => b.value / b.threshold - a.value / a.threshold)
  const next = upcoming[0]
  const shown = [...latest, ...upcoming.slice(0, Math.max(0, 6 - latest.length - 1))].slice(0, 6)

  return (
    <section className="fx-glow fx-glow-live fxg-panel" style={styles.panel} aria-label="Your progress and missions">
      <style>{css}</style>

      <div style={styles.topRow}>
        <div style={styles.levelBlock}>
          <div style={styles.levelBadge} aria-label={`Level ${stats.level}`}>
            {stats.level}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={styles.levelTitle}>{stats.level_title}</p>
            <p style={styles.xpText}>
              {stats.xp} XP · {Math.max(stats.next_level_xp - stats.xp, 0)} XP to level {stats.level + 1}
            </p>
          </div>
        </div>

        <div style={styles.streakChip} title="Learn on consecutive days to grow your streak">
          <Flame size={18} color="#fb923c" />
          <span>
            <strong>{stats.streak}</strong>-day streak
          </span>
          {stats.longest_streak > 0 && <small style={styles.best}>Best {stats.longest_streak}</small>}
        </div>
      </div>

      <div
        role="progressbar"
        aria-label="Progress to the next level"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        style={styles.barTrack}
      >
        <div style={{ ...styles.barFill, width: `${pct}%` }} />
      </div>

      <div className="fxg-cols">
        <div>
          <div style={styles.sectionHead}>
            <h2 style={styles.h2}>Today’s missions</h2>
            <span style={styles.count}>
              {doneCount}/{missions.length} done
            </span>
          </div>

          <ul style={styles.list}>
            {missions.map((m) => {
              const Icon = MISSION_ICONS[m.id] || Sparkles
              return (
                <li key={m.id} style={{ ...styles.mission, ...(m.done ? styles.missionDone : {}) }}>
                  <span style={styles.missionIcon} aria-hidden="true">
                    {m.done ? <CheckCircle2 size={18} color="#4ade80" /> : <Icon size={18} />}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={styles.missionTitle}>{m.title}</p>
                    <p style={styles.missionDesc}>{m.description}</p>
                  </div>
                  <div style={styles.missionSide}>
                    <span style={styles.xpChip}>+{m.xp} XP</span>
                    {m.done ? (
                      <span style={styles.doneText}>Done</span>
                    ) : (
                      <Link to={missionLink(m.id, continueTo)} style={styles.go}>
                        {m.progress}/{m.target}
                        <ChevronRight size={14} />
                      </Link>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          <p style={styles.hint}>Finish all three for a +30 XP bonus. Missions change every day.</p>
        </div>

        <div>
          <div style={styles.sectionHead}>
            <h2 style={styles.h2}>Badges</h2>
            <Link to="/achievements" style={styles.viewAll}>
              All {earned.length}/{badges.length}
              <ChevronRight size={14} />
            </Link>
          </div>

          <ul style={styles.badgeGrid}>
            {shown.map((b) => (
              <li key={b.id} style={styles.badgeItem} title={b.description}>
                <BadgeIcon icon={b.icon} tier={b.tier} earned={Boolean(b.earned_at)} size={50} />
                <span style={styles.badgeName}>{b.name}</span>
              </li>
            ))}
          </ul>

          {next && (
            <div style={styles.nextBox}>
              <div style={styles.nextTop}>
                <span style={styles.nextLabel}>Next badge: {next.name}</span>
                <span style={styles.nextCount}>
                  {next.value}/{next.threshold}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={`Progress to the ${next.name} badge`}
                aria-valuemin={0}
                aria-valuemax={next.threshold}
                aria-valuenow={next.value}
                style={styles.smallTrack}
              >
                <div style={{ ...styles.smallFill, width: `${Math.round((next.value / next.threshold) * 100)}%` }} />
              </div>
              <p style={styles.nextDesc}>{next.description}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

const css = `
.fxg-cols { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 26px; margin-top: 20px; }
@media (max-width: 820px) { .fxg-cols { grid-template-columns: minmax(0, 1fr); gap: 22px; } }
@media (prefers-reduced-motion: reduce) { .fxg-bar { transition: none !important; } }
`

const styles = {
  panel: {
    borderRadius: "22px",
    padding: "22px",
    color: "#ffffff",
    background: "rgba(255,255,255,0.04)",
    "--fx-glow-fill": "var(--fx-surface)",
  },
  muted: { color: "var(--fx-muted-2)", fontSize: "0.9rem", margin: 0 },
  topRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", flexWrap: "wrap" },
  levelBlock: { display: "flex", alignItems: "center", gap: "14px", minWidth: 0 },
  levelBadge: {
    width: "54px",
    height: "54px",
    flexShrink: 0,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.45rem",
    fontWeight: 800,
    background: "linear-gradient(135deg, var(--fx-primary), var(--fx-secondary))",
    boxShadow: "0 0 0 3px rgba(255,255,255,0.14), 0 8px 22px rgba(var(--fx-primary-rgb), 0.45)",
  },
  levelTitle: { margin: 0, fontSize: "1.1rem", fontWeight: 800 },
  xpText: { margin: "3px 0 0", fontSize: "0.82rem", color: "var(--fx-muted-2)" },
  streakChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 14px",
    borderRadius: "30px",
    fontSize: "0.88rem",
    background: "rgba(251,146,60,0.14)",
    boxShadow: "inset 0 0 0 1px rgba(251,146,60,0.45)",
  },
  best: { color: "var(--fx-muted-2)", fontSize: "0.72rem", marginLeft: "2px" },
  barTrack: { height: "10px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", margin: "16px 0 0", overflow: "hidden" },
  barFill: {
    height: "100%",
    borderRadius: "10px",
    background: "linear-gradient(90deg, var(--fx-glow-1), var(--fx-glow-3))",
    transition: "width 0.6s ease",
  },
  sectionHead: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "10px" },
  h2: { margin: 0, fontSize: "1rem", fontWeight: 800 },
  count: { fontSize: "0.78rem", color: "var(--fx-muted-2)", fontWeight: 700 },
  list: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "9px" },
  mission: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 13px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.05)",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
  },
  missionDone: { background: "rgba(74,222,128,0.08)", boxShadow: "inset 0 0 0 1px rgba(74,222,128,0.35)" },
  missionIcon: {
    width: "34px",
    height: "34px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    background: "rgba(var(--fx-primary-rgb), 0.22)",
    color: "var(--fx-accent-softer)",
  },
  missionTitle: { margin: 0, fontSize: "0.92rem", fontWeight: 700 },
  missionDesc: { margin: "2px 0 0", fontSize: "0.78rem", color: "var(--fx-muted-2)", lineHeight: 1.4 },
  missionSide: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px", flexShrink: 0 },
  xpChip: {
    fontSize: "0.72rem",
    fontWeight: 800,
    padding: "3px 9px",
    borderRadius: "20px",
    color: "var(--fx-accent-softest)",
    background: "rgba(var(--fx-primary-rgb), 0.3)",
  },
  doneText: { fontSize: "0.74rem", fontWeight: 700, color: "#4ade80" },
  go: {
    display: "inline-flex",
    alignItems: "center",
    gap: "2px",
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#60a5fa",
    textDecoration: "none",
  },
  hint: { margin: "10px 0 0", fontSize: "0.76rem", color: "var(--fx-muted)" },
  viewAll: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#60a5fa",
    textDecoration: "none",
  },
  badgeGrid: { listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px 8px" },
  badgeItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", textAlign: "center" },
  badgeName: { fontSize: "0.72rem", fontWeight: 700, lineHeight: 1.25, color: "var(--fx-text-2)" },
  nextBox: { marginTop: "14px", padding: "12px 13px", borderRadius: "14px", background: "rgba(255,255,255,0.05)" },
  nextTop: { display: "flex", justifyContent: "space-between", gap: "8px", fontSize: "0.8rem", fontWeight: 700 },
  nextLabel: { minWidth: 0 },
  nextCount: { color: "var(--fx-muted-2)", flexShrink: 0 },
  smallTrack: { height: "7px", borderRadius: "8px", background: "rgba(255,255,255,0.1)", margin: "8px 0 6px", overflow: "hidden" },
  smallFill: { height: "100%", borderRadius: "8px", background: "linear-gradient(90deg, #fbbf24, #fb923c)" },
  nextDesc: { margin: 0, fontSize: "0.74rem", color: "var(--fx-muted)" },
}

export default GamePanel
