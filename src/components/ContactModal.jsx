import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Loader2, CheckCircle2, Mail, Compass } from "lucide-react"

function ContactModal({ isOpen, onClose, mode = "general", initialCareerName = "" }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
    careerName: initialCareerName,
    country: "",
    whyInterested: "",
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen) {
      setForm((prev) => ({ ...prev, careerName: initialCareerName }))
    }
  }, [isOpen, initialCareerName])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") handleClose()
    }
    if (isOpen) document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const validate = () => {
    if (mode === "request") {
      if (!form.careerName.trim()) return "Please tell us which career you are looking for."
      if (!form.country.trim()) return "Please tell us your country."
      if (!isValidEmail(form.email)) return "Please enter a valid email address."
      if (!form.whyInterested.trim()) return "Please tell us why you are interested in this career."
      return ""
    }
    if (!form.name.trim()) return "Please enter your name."
    if (!isValidEmail(form.email)) return "Please enter a valid email address."
    if (!form.message.trim()) return "Please enter a message."
    return ""
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError("")
    setSending(true)

    try {
      const endpoint = import.meta.env.VITE_FORMSPREE_ENDPOINT

      if (!endpoint) {
        setError("Contact form is not configured yet. Please try again later.")
        setSending(false)
        return
      }

      const payload =
        mode === "request"
          ? {
              formType: "Career Request",
              careerName: form.careerName,
              country: form.country,
              email: form.email,
              whyInterested: form.whyInterested,
              message: form.message,
            }
          : {
              formType: "General Contact",
              name: form.name,
              email: form.email,
              message: form.message,
            }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setSent(true)
        setForm({ name: "", email: "", message: "", careerName: "", country: "", whyInterested: "" })
      } else {
        let detail = ""
        try {
          const body = await response.json()
          detail = body?.errors?.[0]?.message || body?.error || ""
        } catch (parseErr) {
          detail = ""
        }
        setError(
          detail
            ? `Could not send your message: ${detail}`
            : `Could not send your message (status ${response.status}). Please try again.`
        )
      }
    } catch (err) {
      setError(`Could not send your message: ${err.message || "network error"}. Please check your connection.`)
    }

    setSending(false)
  }

  const handleClose = () => {
    setSent(false)
    setError("")
    onClose()
  }

  const title = mode === "request" ? "Request a Career" : "Contact Us"
  const subtitle =
    mode === "request"
      ? "Tell us which career is missing and we will consider adding it to Futurixia."
      : "Have feedback or a question for Futurixia? Send us a message below."

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={styles.overlay}
          onClick={handleClose}
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            style={styles.card}
            className="fx-contact-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
          >
            <button style={styles.closeBtn} onClick={handleClose} aria-label="Close dialog">
              <X size={18} />
            </button>

            {sent ? (
              <div style={styles.sentState}>
                <div style={styles.sentIcon}>
                  <CheckCircle2 size={28} color="#4ade80" />
                </div>
                <h3 style={styles.title} id="contact-modal-title">
                  Message Sent!
                </h3>
                <p style={styles.subtext}>
                  {mode === "request"
                    ? "Thanks for your suggestion. We will review it and consider adding this career."
                    : "Thanks for reaching out. We will review your message and get back to you soon."}
                </p>
                <button style={styles.primaryBtn} onClick={handleClose}>
                  Close
                </button>
              </div>
            ) : (
              <>
                <div style={styles.iconWrap}>
                  {mode === "request" ? (
                    <Compass size={22} color="#a5b4fc" />
                  ) : (
                    <Mail size={22} color="#a5b4fc" />
                  )}
                </div>
                <h3 style={styles.title} id="contact-modal-title">
                  {title}
                </h3>
                <p style={styles.subtext}>{subtitle}</p>

                <form onSubmit={handleSubmit} noValidate>
                  {mode === "request" ? (
                    <>
                      <label style={styles.fieldLabel} htmlFor="careerName">
                        Career Name
                      </label>
                      <input
                        id="careerName"
                        type="text"
                        placeholder="e.g. Chartered Financial Analyst"
                        value={form.careerName}
                        onChange={(e) => updateField("careerName", e.target.value)}
                        style={styles.input}
                      />

                      <label style={styles.fieldLabel} htmlFor="country">
                        Your Country
                      </label>
                      <input
                        id="country"
                        type="text"
                        placeholder="e.g. India"
                        value={form.country}
                        onChange={(e) => updateField("country", e.target.value)}
                        style={styles.input}
                      />

                      <label style={styles.fieldLabel} htmlFor="email">
                        Your Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        style={styles.input}
                      />

                      <label style={styles.fieldLabel} htmlFor="whyInterested">
                        Why Are You Interested in This Career?
                      </label>
                      <textarea
                        id="whyInterested"
                        placeholder="Tell us a little about why this career matters to you..."
                        value={form.whyInterested}
                        onChange={(e) => updateField("whyInterested", e.target.value)}
                        style={{ ...styles.input, minHeight: "80px", resize: "vertical" }}
                      />

                      <label style={styles.fieldLabel} htmlFor="optionalMessage">
                        Optional Message
                      </label>
                      <textarea
                        id="optionalMessage"
                        placeholder="Anything else you'd like to add..."
                        value={form.message}
                        onChange={(e) => updateField("message", e.target.value)}
                        style={{ ...styles.input, minHeight: "60px", resize: "vertical" }}
                      />
                    </>
                  ) : (
                    <>
                      <label style={styles.fieldLabel} htmlFor="name">
                        Your Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        placeholder="Your Name"
                        value={form.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        style={styles.input}
                      />

                      <label style={styles.fieldLabel} htmlFor="email">
                        Your Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="Your Email"
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        style={styles.input}
                      />

                      <label style={styles.fieldLabel} htmlFor="message">
                        Your Message
                      </label>
                      <textarea
                        id="message"
                        placeholder="Your message..."
                        value={form.message}
                        onChange={(e) => updateField("message", e.target.value)}
                        style={{ ...styles.input, minHeight: "100px", resize: "vertical" }}
                      />
                    </>
                  )}

                  {error && (
                    <p style={styles.errorText} role="alert">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    style={{ ...styles.primaryBtn, ...(sending ? styles.primaryBtnDisabled : {}) }}
                    disabled={sending}
                  >
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
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
    padding: "20px",
  },
  card: {
    position: "relative",
    background: "#0f1120",
    borderRadius: "22px",
    padding: "34px",
    maxWidth: "420px",
    width: "100%",
    boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
    maxHeight: "85vh",
    overflowY: "auto",
  },
  closeBtn: {
    position: "absolute",
    top: "18px",
    right: "18px",
    background: "rgba(255,255,255,0.08)",
    border: "none",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    cursor: "pointer",
  },
  iconWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "54px",
    height: "54px",
    borderRadius: "16px",
    background: "rgba(99,102,241,0.16)",
    marginBottom: "16px",
  },
  title: { fontSize: "1.3rem", fontWeight: 800, color: "#fff", marginBottom: "8px" },
  subtext: { color: "#a9adc4", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "22px" },
  fieldLabel: {
    display: "block",
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#9599b0",
    marginBottom: "6px",
    marginTop: "14px",
  },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.07)",
    border: "none",
    outline: "none",
    color: "#fff",
    fontSize: "0.9rem",
    padding: "13px 16px",
    borderRadius: "14px",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
    fontFamily: "inherit",
  },
  errorText: { color: "#ff9b9b", fontSize: "0.85rem", marginTop: "14px", marginBottom: "4px" },
  primaryBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "14px",
    fontSize: "0.95rem",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "20px",
  },
  primaryBtnDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
  sentState: { textAlign: "center" },
  sentIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "54px",
    height: "54px",
    borderRadius: "50%",
    background: "rgba(74,222,128,0.14)",
    margin: "0 auto 16px",
  },
}

export default ContactModal