import { useEffect, useRef, useState } from "react"
import { Award, TrendingUp, Zap } from "lucide-react"

const ICONS = { xp: Zap, level: TrendingUp, badge: Award }

// Small pop-ups for XP, level-ups and new badges. Listens for the "fx-gamify" event from lib/gamify.js.
function XpToast() {
  const [items, setItems] = useState([])
  const counter = useRef(0)

  useEffect(() => {
    const onData = (event) => {
      const data = event.detail
      if (!data || !data.stats) return

      const key = `fx_last_xp_${data.stats.user_id}`
      const levelKey = `fx_last_level_${data.stats.user_id}`
      let lastXp = null
      let lastLevel = null
      try {
        const a = window.localStorage.getItem(key)
        const b = window.localStorage.getItem(levelKey)
        lastXp = a === null ? null : Number(a)
        lastLevel = b === null ? null : Number(b)
        window.localStorage.setItem(key, String(data.stats.xp))
        window.localStorage.setItem(levelKey, String(data.stats.level))
      } catch (err) {
        // Storage can be blocked; there are simply no pop-ups then.
      }

      const messages = []
      if (lastXp !== null && data.stats.xp > lastXp) {
        messages.push({ kind: "xp", text: `+${data.stats.xp - lastXp} XP` })
      }
      if (lastLevel !== null && data.stats.level > lastLevel) {
        messages.push({ kind: "level", text: `Level ${data.stats.level}: ${data.stats.level_title}` })
      }
      ;(data.new_badges || []).slice(0, 3).forEach((badge) => {
        messages.push({ kind: "badge", text: `Badge unlocked: ${badge.name}` })
      })

      if (messages.length === 0) return

      const added = messages.map((m) => ({ ...m, id: (counter.current += 1) }))
      setItems((current) => [...current, ...added].slice(-4))
      added.forEach((m) => {
        setTimeout(() => setItems((current) => current.filter((x) => x.id !== m.id)), 3800)
      })
    }

    window.addEventListener("fx-gamify", onData)
    return () => window.removeEventListener("fx-gamify", onData)
  }, [])

  if (items.length === 0) return null

  return (
    <div style={styles.wrap} aria-live="polite" role="status">
      {items.map((item) => {
        const Icon = ICONS[item.kind] || Zap
        return (
          <div key={item.id} style={{ ...styles.toast, ...(item.kind === "badge" ? styles.badge : {}) }}>
            <Icon size={16} />
            <span>{item.text}</span>
          </div>
        )
      })}
    </div>
  )
}

const styles = {
  wrap: {
    position: "fixed",
    top: "14px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 450,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    pointerEvents: "none",
    width: "max-content",
    maxWidth: "92vw",
  },
  toast: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "var(--fx-surface)",
    color: "#ffffff",
    padding: "10px 18px",
    borderRadius: "30px",
    fontSize: "0.88rem",
    fontWeight: 800,
    fontFamily: "Inter, system-ui, sans-serif",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(var(--fx-glow-rgb), 0.55)",
  },
  badge: {
    boxShadow: "0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(251,191,36,0.7)",
  },
}

export default XpToast
