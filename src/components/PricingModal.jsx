import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X, Check, Sparkles, Crown, Lock } from "lucide-react"

function detectIsIndia() {
  try {
    const locale = navigator.language || navigator.languages?.[0] || ""
    return locale.toLowerCase().includes("in")
  } catch {
    return false
  }
}

function PricingModal({ isOpen, onClose, studentCountry }) {
  const [showComingSoon, setShowComingSoon] = useState(false)
  const isIndia = studentCountry ? studentCountry === "India" : detectIsIndia()

  const tiers = [
    {
      name: "Free",
      icon: Sparkles,
      priceINR: "₹0",
      priceUSD: "$0",
      tagline: "Your complete roadmap, free",
      features: [
        "Browse all 100+ careers",
        "Complete step-by-step roadmap for every career",
        "Personalized starting steps for your stage",
        "Progress tracking and completion history",
        "Discovery quiz and career comparison",
      ],
      locked: [
        "Free resources, videos and official websites",
        "Detailed guidance on every step",
      ],
    },
    {
      name: "Pro",
      icon: Crown,
      priceINR: "₹299",
      priceUSD: "$4.99",
      period: "/ month",
      tagline: "Extra help on every step",
      highlight: true,
      features: [
        "Everything in Free",
        "Free learning resources, videos and official websites matched to each step",
        "Detailed guidance on every step: how to approach it, why it matters, what to achieve",
        "Estimated time and practice tasks where available",
      ],
      locked: [],
    },
    {
      name: "Pro Max",
      icon: Crown,
      priceINR: "₹499",
      priceUSD: "$8.99",
      period: "/ month",
      tagline: "Pro, plus what is coming next",
      badge: "Upcoming features",
      features: [
        "Everything in Pro",
        "Completion certificates (coming soon)",
        "1-on-1 career guidance (coming soon)",
        "Early access to new features as they launch",
      ],
      locked: [],
    },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={styles.overlay}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            style={styles.card}
            onClick={(e) => e.stopPropagation()}
          >
            <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>

            <h3 style={styles.title}>Pricing</h3>
            <p style={styles.subtitle}>
              Every career roadmap is free. Upgrade for resources and detailed guidance on every step.
            </p>

            <div style={styles.tiersRow}>
              {tiers.map((tier) => {
                const Icon = tier.icon
                return (
                  <div
                    key={tier.name}
                    style={{ ...styles.tierCard, ...(tier.highlight ? styles.tierCardHighlight : {}) }}
                  >
                    <div style={styles.tierIconWrap}>
                      <Icon size={20} color={tier.highlight ? "#67e8f9" : "#a5b4fc"} />
                    </div>
                    <h4 style={styles.tierName}>{tier.name}</h4>
                    {tier.badge && <span style={styles.badge}>{tier.badge}</span>}
                    <p style={styles.tierTagline}>{tier.tagline}</p>
                    <div style={styles.priceRow}>
                      <span style={styles.price}>{isIndia ? tier.priceINR : tier.priceUSD}</span>
                      {tier.period && <span style={styles.period}>{tier.period}</span>}
                    </div>
                    {isIndia && tier.priceUSD !== "$0" && (
                      <span style={styles.altPrice}>or {tier.priceUSD}{tier.period}</span>
                    )}

                    <ul style={styles.featureList}>
                      {tier.features.map((f) => (
                        <li key={f} style={styles.featureItem}>
                          <Check size={14} color="#4ade80" style={{ flexShrink: 0, marginTop: 2 }} />
                          <span>{f}</span>
                        </li>
                      ))}
                      {tier.locked.map((f) => (
                        <li key={f} style={styles.lockedItem}>
                          <Lock size={13} color="#7d8299" style={{ flexShrink: 0, marginTop: 2 }} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      style={tier.name === "Free" ? styles.currentBtn : styles.subscribeBtn}
                      onClick={() => tier.name !== "Free" && setShowComingSoon(true)}
                      disabled={tier.name === "Free"}
                    >
                      {tier.name === "Free" ? "Included For Everyone" : `Get ${tier.name}`}
                    </button>
                  </div>
                )
              })}
            </div>

            {showComingSoon && (
              <p style={styles.comingSoonNote}>
                Online payments are being set up. Subscriptions will be available to purchase very soon.
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const styles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px", overflowY: "auto" },
  card: { position: "relative", background: "#0f1120", borderRadius: "22px", padding: "34px", maxWidth: "900px", width: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" },
  closeBtn: { position: "absolute", top: "18px", right: "18px", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" },
  title: { fontSize: "1.5rem", fontWeight: 800, color: "#fff", textAlign: "center", marginBottom: "8px" },
  subtitle: { color: "#a9adc4", fontSize: "0.9rem", textAlign: "center", marginBottom: "28px" },
  tiersRow: { display: "flex", gap: "18px", flexWrap: "wrap", justifyContent: "center" },
  tierCard: { flex: "1 1 240px", maxWidth: "280px", background: "rgba(255,255,255,0.04)", borderRadius: "18px", padding: "24px 20px", boxShadow: "0 0 0 1px rgba(255,255,255,0.08)", display: "flex", flexDirection: "column" },
  tierCardHighlight: { background: "rgba(99,102,241,0.1)", boxShadow: "0 0 0 2px rgba(99,102,241,0.5)" },
  tierIconWrap: { display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", marginBottom: "12px" },
  tierName: { fontSize: "1.1rem", fontWeight: 800, color: "#fff" },
  badge: { display: "inline-block", alignSelf: "flex-start", marginTop: "6px", background: "rgba(251,191,36,0.14)", color: "#fbbf24", fontSize: "0.68rem", fontWeight: 700, padding: "4px 10px", borderRadius: "20px" },
  tierTagline: { color: "#9599b0", fontSize: "0.8rem", marginTop: "6px", marginBottom: "14px" },
  priceRow: { display: "flex", alignItems: "baseline", gap: "6px" },
  price: { fontSize: "1.7rem", fontWeight: 800, color: "#fff" },
  period: { color: "#9599b0", fontSize: "0.8rem" },
  altPrice: { color: "#7d8299", fontSize: "0.75rem", marginTop: "2px", marginBottom: "6px" },
  featureList: { listStyle: "none", padding: 0, margin: "16px 0 20px", flex: 1 },
  featureItem: { display: "flex", alignItems: "flex-start", gap: "8px", color: "#c9cbdb", fontSize: "0.82rem", marginBottom: "10px", lineHeight: 1.4 },
  lockedItem: { display: "flex", alignItems: "flex-start", gap: "8px", color: "#7d8299", fontSize: "0.82rem", marginBottom: "10px", lineHeight: 1.4 },
  subscribeBtn: { background: "linear-gradient(90deg, #6366f1, #22d3ee)", color: "#fff", border: "none", padding: "12px", borderRadius: "14px", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer" },
  currentBtn: { background: "rgba(255,255,255,0.06)", color: "#9599b0", border: "none", padding: "12px", borderRadius: "14px", fontSize: "0.88rem", fontWeight: 700, cursor: "default" },
  comingSoonNote: { textAlign: "center", color: "#fbbf24", fontSize: "0.85rem", marginTop: "20px" },
}

export default PricingModal