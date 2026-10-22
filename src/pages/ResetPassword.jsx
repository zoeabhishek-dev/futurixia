import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Eye, EyeOff, Lock, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"
import { supabase } from "../supabaseClient"

function passwordProblem(pw) {
  if (pw.length < 8) return "Password must be at least 8 characters."
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) {
    return "Password must include at least one letter and one number."
  }
  return ""
}

function ResetPassword() {
  const navigate = useNavigate()
  const [status, setStatus] = useState("checking")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && active) setStatus("ready")
    })

    const check = async () => {
      const { data } = await supabase.auth.getSession()
      if (!active) return
      setStatus((prev) => (prev === "ready" ? prev : data?.session ? "ready" : "invalid"))
    }
    check()

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (status !== "done") return
    const timer = setTimeout(() => navigate("/dashboard"), 2500)
    return () => clearTimeout(timer)
  }, [status, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    const problem = passwordProblem(password)
    if (problem) {
      setError(problem)
      return
    }
    if (password !== confirmPassword) {
      setError("The two passwords do not match.")
      return
    }

    setSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSaving(false)

    if (updateError) {
      const msg = (updateError.message || "").toLowerCase()
      if (msg.includes("different from the old password")) {
        setError("Your new password must be different from your old one.")
      } else if (msg.includes("failed to fetch") || msg.includes("network")) {
        setError("Could not reach the server. Please check your internet connection.")
      } else {
        setError(updateError.message || "Could not update your password. Please try again.")
      }
      return
    }

    setStatus("done")
  }

  return (
    <div style={styles.page}>
      <div className="aurora-bg">
        <div className="aurora-blob blob-a" />
        <div className="aurora-blob blob-b" />
        <div className="aurora-blob blob-c" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={styles.card}
      >
        <div style={styles.logo}>Futurixia</div>

        {status === "checking" && <p style={styles.subtitle}>Checking your reset link...</p>}

        {status === "invalid" && (
          <div style={styles.centerBlock}>
            <div style={{ ...styles.iconCircle, background: "rgba(251,191,36,0.14)" }}>
              <AlertTriangle size={26} color="#fbbf24" />
            </div>
            <h1 style={styles.title}>This link has expired</h1>
            <p style={styles.subtitle}>
              Reset links work only once and expire after a short time. Please request a new one.
            </p>
            <button
              style={styles.primaryBtn}
              onClick={() => navigate("/login", { state: { mode: "forgot" } })}
            >
              Request a New Link
            </button>
            <Link to="/login" style={styles.backLink}>
              Back to log in
            </Link>
          </div>
        )}

        {status === "ready" && (
          <>
            <h1 style={styles.title}>Set a new password</h1>
            <p style={styles.subtitle}>Choose a strong password you have not used before.</p>

            <form onSubmit={handleSubmit} noValidate>
              <label style={styles.label} htmlFor="new-password">
                New password
              </label>
              <div style={styles.inputWrap}>
                <Lock size={17} color="#9599b0" />
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                />
                <button
                  type="button"
                  style={styles.eyeBtn}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <label style={styles.label} htmlFor="confirm-new-password">
                Confirm new password
              </label>
              <div style={styles.inputWrap}>
                <Lock size={17} color="#9599b0" />
                <input
                  id="confirm-new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Type it again"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={styles.input}
                />
              </div>

              {error && (
                <p style={styles.errorText} role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                style={{ ...styles.primaryBtn, ...(saving ? styles.btnDisabled : {}) }}
                disabled={saving}
              >
                {saving ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    style={{ display: "inline-flex" }}
                  >
                    <Loader2 size={18} />
                  </motion.span>
                ) : (
                  "Save New Password"
                )}
              </button>
            </form>
          </>
        )}

        {status === "done" && (
          <div style={styles.centerBlock}>
            <div style={{ ...styles.iconCircle, background: "rgba(74,222,128,0.14)" }}>
              <CheckCircle2 size={28} color="#4ade80" />
            </div>
            <h1 style={styles.title}>Password updated</h1>
            <p style={styles.subtitle}>Taking you to your dashboard...</p>
          </div>
        )}
      </motion.div>
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    overflow: "hidden",
  },
  card: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: "420px",
    background: "rgba(15,17,32,0.88)",
    backdropFilter: "blur(14px)",
    borderRadius: "24px",
    padding: "32px 28px",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 30px 80px rgba(0,0,0,0.5)",
  },
  logo: {
    fontSize: "1.4rem",
    fontWeight: 800,
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "14px",
  },
  title: { fontSize: "1.5rem", fontWeight: 800, marginBottom: "6px" },
  subtitle: { color: "#a9adc4", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "22px" },
  centerBlock: { textAlign: "center" },
  iconCircle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    margin: "0 auto 16px",
  },
  label: {
    display: "block",
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#9599b0",
    marginBottom: "6px",
    marginTop: "14px",
  },
  inputWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(255,255,255,0.07)",
    borderRadius: "14px",
    padding: "0 14px",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
  },
  input: {
    flex: 1,
    minWidth: 0,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#fff",
    fontSize: "16px",
    padding: "14px 0",
    fontFamily: "inherit",
  },
  eyeBtn: {
    background: "transparent",
    border: "none",
    color: "#9599b0",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: "6px",
  },
  errorText: { color: "#ff9b9b", fontSize: "0.85rem", lineHeight: 1.5, marginTop: "16px" },
  primaryBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: "20px",
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "14px",
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnDisabled: { opacity: 0.65, cursor: "not-allowed" },
  backLink: {
    display: "inline-block",
    marginTop: "18px",
    color: "#a5b4fc",
    fontSize: "0.85rem",
    fontWeight: 700,
  },
}

export default ResetPassword