import { useEffect, useState } from "react"
import { X, Check, Crown, Palette } from "lucide-react"
import { Link } from "react-router-dom"
import { PLANS, formatPrice } from "../lib/plans"
import { useTheme } from "../lib/theme"

function PricingModal({ isOpen, onClose }) {
  const { plan } = useTheme()
  const [notice, setNotice] = useState("")

  useEffect(() => {
    if (!isOpen) {
      setNotice("")
      return undefined
    }
    const onKey = (e) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const buttonFor = (item) => {
    if (plan === item.id) return { label: "Your current plan", disabled: true }
    if (item.id === "free") return { label: plan ? "Included in every plan" : "Free for everyone", disabled: true }
    return { label: `Get ${item.name}`, disabled: false }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        style={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Plans and pricing"
        onClick={(e) => e.stopPropagation()}
      >
        <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <h2 style={styles.title}>Choose your plan</h2>
        <p style={styles.sub}>Simple monthly pricing in Indian rupees.</p>

        <div style={styles.grid}>
          {PLANS.map((item) => {
            const action = buttonFor(item)
            const paid = item.id !== "free"
            return (
              <div
                key={item.id}
                style={{
                  ...styles.card,
                  boxShadow:
                    item.id === "pro_max"
                      ? "0 0 0 2px var(--fx-glow-2)"
                      : "0 0 0 1px rgba(255,255,255,0.12)",
                }}
              >
                {item.id === "pro_max" && <span style={styles.badge}>Most complete</span>}

                <h3 style={styles.planName}>
                  {paid && <Crown size={16} color="var(--fx-accent-soft)" />}
                  {item.name}
                </h3>

                <p style={styles.price}>
                  <strong style={styles.priceNum}>{formatPrice(item.price)}</strong>
                  <span style={styles.perMonth}>/month</span>
                </p>

                <p style={styles.tagline}>{item.tagline}</p>

                <p style={styles.themeLine}>
                  <Palette size={14} color="var(--fx-accent-soft)" style={{ flexShrink: 0 }} />
                  {item.theme}
                </p>

                <ul style={styles.list}>
                  {item.features.map((feature) => (
                    <li key={feature} style={styles.listItem}>
                      <Check size={15} color="var(--fx-glow-2)" style={{ flexShrink: 0, marginTop: 3 }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  style={{ ...styles.actionBtn, ...(action.disabled ? styles.actionBtnOff : {}) }}
                  disabled={action.disabled}
                  onClick={() =>
                    setNotice(
                      "Online payments are opening soon. We will let you know as soon as Pro and Pro Max can be purchased."
                    )
                  }
                >
                  {action.label}
                </button>
              </div>
            )
          })}
        </div>

        <p style={styles.legalLine}>
          See our{" "}
          <Link to="/terms" style={styles.legalLink}>
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" style={styles.legalLink}>
            Privacy Policy
          </Link>
          .
        </p>

        {notice && (
          <p role="status" style={styles.notice}>
            {notice}
          </p>
        )}
      </div>
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
    borderRadius: "24px",
    padding: "30px 22px 26px",
    width: "100%",
    maxWidth: "980px",
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
  title: { fontSize: "1.5rem", fontWeight: 800, margin: 0, textAlign: "center" },
  sub: { color: "var(--fx-muted-2)", fontSize: "0.9rem", textAlign: "center", margin: "6px 0 22px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" },
  card: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "20px",
    padding: "22px 20px",
  },
  badge: {
    position: "absolute",
    top: "-11px",
    right: "16px",
    background: "linear-gradient(90deg, var(--fx-primary), var(--fx-secondary))",
    color: "#ffffff",
    fontSize: "0.68rem",
    fontWeight: 800,
    padding: "4px 12px",
    borderRadius: "20px",
  },
  planName: { display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem", fontWeight: 800, margin: 0 },
  price: { display: "flex", alignItems: "baseline", gap: "4px", margin: "10px 0 2px" },
  priceNum: { fontSize: "2rem", fontWeight: 800 },
  perMonth: { color: "var(--fx-muted-2)", fontSize: "0.85rem" },
  tagline: { color: "var(--fx-text-2)", fontSize: "0.86rem", margin: "0 0 10px" },
  themeLine: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(var(--fx-primary-rgb), 0.18)",
    color: "var(--fx-accent-softer)",
    fontSize: "0.78rem",
    fontWeight: 600,
    padding: "8px 10px",
    borderRadius: "10px",
    margin: "0 0 14px",
  },
  list: { listStyle: "none", padding: 0, margin: "0 0 18px", display: "flex", flexDirection: "column", gap: "9px", flex: 1 },
  listItem: { display: "flex", gap: "9px", fontSize: "0.84rem", lineHeight: 1.45, color: "var(--fx-text-2)" },
  actionBtn: {
    background: "linear-gradient(90deg, var(--fx-primary), var(--fx-secondary))",
    color: "#ffffff",
    border: "none",
    padding: "13px",
    borderRadius: "14px",
    fontSize: "0.9rem",
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  actionBtnOff: {
    background: "rgba(255,255,255,0.08)",
    color: "var(--fx-muted-2)",
    cursor: "default",
  },
  legalLine: {
    textAlign: "center",
    color: "var(--fx-muted-2)",
    fontSize: "0.8rem",
    marginTop: "16px",
  },
  legalLink: { color: "#60a5fa" },
  notice: {
    marginTop: "18px",
    textAlign: "center",
    color: "var(--fx-accent-softer)",
    fontSize: "0.86rem",
    background: "rgba(var(--fx-primary-rgb), 0.18)",
    borderRadius: "12px",
    padding: "12px 14px",
  },
}

export default PricingModal