import { useEffect, useState } from "react"
import { X, Check, Palette, Loader2 } from "lucide-react"
import { THEMES } from "../lib/themes"
import { useTheme } from "../lib/theme"

function ThemePicker({ isOpen, onClose }) {
  const { theme, canChoose, setTheme } = useTheme()
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isOpen) return undefined
    const onKey = (e) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  if (!isOpen || !canChoose) return null

  const choose = async (id) => {
    if (id === theme || savingId) return
    setError("")
    setSavingId(id)
    const result = await setTheme(id)
    setSavingId(null)
    if (!result.ok) {
      setError(result.message || "We could not save your theme. Please try again.")
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        style={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Choose a theme"
        onClick={(e) => e.stopPropagation()}
      >
        <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <div style={styles.iconWrap}>
          <Palette size={22} color="var(--fx-accent-soft)" />
        </div>
        <h2 style={styles.title}>Choose your theme</h2>
        <p style={styles.sub}>Your choice is saved to your account and follows you on every device.</p>

        <div style={styles.grid} role="radiogroup" aria-label="Themes">
          {THEMES.map((item) => {
            const selected = item.id === theme
            return (
              <button
                key={item.id}
                role="radio"
                aria-checked={selected}
                onClick={() => choose(item.id)}
                style={{
                  ...styles.option,
                  boxShadow: selected
                    ? `0 0 0 2px ${item.swatch[2]}`
                    : "0 0 0 1px rgba(255,255,255,0.12)",
                }}
              >
                <span style={{ ...styles.preview, background: item.bg }}>
                  <span
                    style={{
                      ...styles.previewBar,
                      background: `linear-gradient(90deg, ${item.swatch[0]}, ${item.swatch[1]})`,
                    }}
                  />
                  <span style={{ ...styles.previewDot, background: item.swatch[2] }} />
                </span>

                <span style={styles.optionName}>
                  {item.name}
                  {savingId === item.id && <Loader2 size={14} style={{ animation: "fxspin 0.9s linear infinite" }} />}
                  {selected && savingId !== item.id && <Check size={15} color={item.swatch[2]} />}
                </span>
                <span style={styles.optionBlurb}>{item.blurb}</span>
              </button>
            )
          })}
        </div>

        {error && (
          <p role="alert" style={styles.error}>
            {error}
          </p>
        )}
      </div>
      <style>{`@keyframes fxspin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
    padding: "16px",
  },
  modal: {
    position: "relative",
    background: "var(--fx-surface)",
    color: "#ffffff",
    borderRadius: "22px",
    padding: "30px 24px 26px",
    width: "100%",
    maxWidth: "520px",
    maxHeight: "92vh",
    overflowY: "auto",
    boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  closeBtn: {
    position: "absolute",
    top: "14px",
    right: "14px",
    width: "34px",
    height: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
  },
  iconWrap: {
    width: "46px",
    height: "46px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "14px",
    background: "rgba(var(--fx-primary-rgb), 0.25)",
    marginBottom: "12px",
  },
  title: { fontSize: "1.3rem", fontWeight: 800, margin: 0 },
  sub: { color: "var(--fx-muted-2)", fontSize: "0.88rem", lineHeight: 1.5, margin: "6px 0 18px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" },
  option: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    textAlign: "left",
    background: "rgba(255,255,255,0.04)",
    color: "#ffffff",
    border: "none",
    borderRadius: "16px",
    padding: "12px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  preview: {
    position: "relative",
    display: "block",
    height: "64px",
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
  },
  previewBar: {
    position: "absolute",
    left: "10px",
    right: "34px",
    bottom: "12px",
    height: "10px",
    borderRadius: "6px",
  },
  previewDot: {
    position: "absolute",
    right: "10px",
    bottom: "10px",
    width: "14px",
    height: "14px",
    borderRadius: "50%",
  },
  optionName: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    fontSize: "0.92rem",
    fontWeight: 700,
  },
  optionBlurb: { fontSize: "0.76rem", color: "var(--fx-muted-2)", lineHeight: 1.4 },
  error: { color: "#fca5a5", fontSize: "0.84rem", marginTop: "14px" },
}

export default ThemePicker