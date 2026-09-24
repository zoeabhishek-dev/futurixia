import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Loader2, CheckCircle2, Mail } from "lucide-react"

function ContactModal({ isOpen, onClose }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSending(true)

    try {
      const endpoint = import.meta.env.VITE_FORMSPREE_ENDPOINT

      if (!endpoint) {
        setError("Contact form is not configured yet. Please try again later.")
        setSending(false)
        return
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      })

      if (response.ok) {
        setSent(true)
        setName("")
        setEmail("")
        setMessage("")
      } else {
        setError("Something went wrong sending your message. Please try again.")
      }
    } catch (err) {
      setError("Something went wrong sending your message. Please try again.")
    }

    setSending(false)
  }

  const handleClose = () => {
    setSent(false)
    setError("")
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={styles.overlay}
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            style={styles.card}
            onClick={(e) => e.stopPropagation()}
          >
            <button style={styles.closeBtn} onClick={handleClose}>
              <X size={18} />
            </button>

            {sent ? (
              <div style={styles.sentState}>
                <div style={styles.sentIcon}>
                  <CheckCircle2 size={28} color="#4ade80" />
                </div>
                <h3 style={styles.title}>Message Sent!</h3>
                <p style={styles.subtext}>
                  Thanks for reaching out. We will review your message and get back to you soon.
                </p>
                <button style={styles.primaryBtn} onClick={handleClose}>
                  Close
                </button>
              </div>
            ) : (
              <>
                <div style={styles.iconWrap}>
                  <Mail size={22} color="#a5b4fc" />
                </div>
                <h3 style={styles.title}>Contact Us</h3>
                <p style={styles.subtext}>
                  Can't find a career, or have feedback for Futurixia? Send us a message below.
                </p>

                <form onSubmit={handleSubmit}>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={styles.input}
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={styles.input}
                  />
                  <textarea
                    placeholder="Your message... e.g. 'Please add Chartered Financial Analyst as a career'"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    style={{ ...styles.input, minHeight: "100px", resize: "vertical" }}
                  />

                  {error && <p style={styles.errorText}>{error}</p>}

                  <button type="submit" style={styles.primaryBtn} disabled={sending}>
                    {sending ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                        style={{ display: "inline-flex" }}
                      >
                        <Loader2 size={16} />
                      </motion.span>
                    ) : (
                      <>
                        Send Message
                        <Send size={16} />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px",
  },
  card: {
    position: "relative", background: "#0f1120", borderRadius: "22px", padding: "34px",
    maxWidth: "420px", width: "100%", boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
  },
  closeBtn: {
    position: "absolute", top: "18px", right: "18px", background: "rgba(255,255,255,0.08)",
    border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex",
    alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer",
  },
  iconWrap: {
    display: "flex", alignItems: "center", justifyContent: "center", width: "54px", height: "54px",
    borderRadius: "16px", background: "rgba(99,102,241,0.16)", marginBottom: "16px",
  },
  title: { fontSize: "1.3rem", fontWeight: 800, color: "#fff", marginBottom: "8px" },
  subtext: { color: "#a9adc4", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "22px" },
  input: {
    width: "100%", background: "rgba(255,255,255,0.07)", border: "none", outline: "none",
    color: "#fff", fontSize: "0.9rem", padding: "13px 16px", borderRadius: "14px",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)", marginBottom: "14px", fontFamily: "inherit",
  },
  errorText: { color: "#ff9b9b", fontSize: "0.85rem", marginBottom: "14px" },
  primaryBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%",
    background: "linear-gradient(90deg, #6366f1, #22d3ee)", color: "#fff", border: "none",
    padding: "14px", borderRadius: "14px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer",
  },
  sentState: { textAlign: "center" },
  sentIcon: {
    display: "flex", alignItems: "center", justifyContent: "center", width: "54px", height: "54px",
    borderRadius: "50%", background: "rgba(74,222,128,0.14)", margin: "0 auto 16px",
  },
}

export default ContactModal