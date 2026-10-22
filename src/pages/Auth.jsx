import { useState, useEffect } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import { supabase } from "../supabaseClient"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function friendlyError(error) {
  const msg = (error?.message || "").toLowerCase()
  if (msg.includes("invalid login credentials")) {
    return "That email and password do not match. Please check them, or use Forgot password."
  }
  if (msg.includes("already registered") || msg.includes("already been registered")) {
    return "An account with this email already exists. Try logging in instead."
  }
  if (msg.includes("rate limit") || msg.includes("too many") || msg.includes("security purposes")) {
    return "Too many attempts. Please wait a minute and try again."
  }
  if (msg.includes("failed to fetch") || msg.includes("network")) {
    return "Could not reach the server. Please check your internet connection."
  }
  if (msg.includes("password should be")) {
    return "That password is too weak. Use at least 8 characters with letters and numbers."
  }
  return error?.message || "Something went wrong. Please try again."
}

function passwordProblem(pw) {
  if (pw.length < 8) return "Password must be at least 8 characters."
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) {
    return "Password must include at least one letter and one number."
  }
  return ""
}

function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState(location.state?.mode === "forgot" ? "forgot" : "login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data?.session) {
        navigate("/dashboard")
      } else {
        setCheckingSession(false)
      }
    }
    checkSession()
  }, [navigate])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const switchMode = (newMode) => {
    setMode(newMode)
    setError("")
    setNotice("")
    setPassword("")
    setConfirmPassword("")
    setShowPassword(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setNotice("")

    const cleanEmail = email.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setError("Please enter a valid email address.")
      return
    }

    if (mode === "forgot") {
      if (cooldown > 0) return
      setLoading(true)
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      setLoading(false)
      if (resetError) {
        setError(friendlyError(resetError))
        return
      }
      setNotice(
        "If an account exists for this email, a reset link is on its way. Please check your inbox and your spam folder."
      )
      setCooldown(60)
      return
    }

    if (!password) {
      setError("Please enter your password.")
      return
    }

    if (mode === "signup") {
      const problem = passwordProblem(password)
      if (problem) {
        setError(problem)
        return
      }
      if (password !== confirmPassword) {
        setError("The two passwords do not match.")
        return
      }
    }

    setLoading(true)
    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })
        if (signInError) throw signInError
        navigate("/dashboard")
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        })
        if (signUpError) throw signUpError

        if (data?.user && data.user.identities && data.user.identities.length === 0) {
          setError("An account with this email already exists. Try logging in instead.")
        } else if (data?.session) {
          navigate("/dashboard")
        } else {
          setNotice(
            "Account created. Please check your email to confirm your address, then log in."
          )
        }
      }
    } catch (err) {
      setError(friendlyError(err))
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setError("")
    setNotice("")
    setGoogleLoading(true)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (oauthError) {
      setError(friendlyError(oauthError))
      setGoogleLoading(false)
    }
  }

  if (checkingSession) return null

  const titles = {
    login: "Welcome back",
    signup: "Create your account",
    forgot: "Reset your password",
  }
  const subtitles = {
    login: "Log in to continue your career roadmap.",
    signup: "Join Futurixia and start building your roadmap.",
    forgot: "Enter your email and we will send you a link to set a new password.",
  }
  const submitLabel =
    mode === "login"
      ? "Log In"
      : mode === "signup"
      ? "Create Account"
      : cooldown > 0
      ? `Send again in ${cooldown}s`
      : "Send Reset Link"

  const hasLetterAndNumber = /[A-Za-z]/.test(password) && /[0-9]/.test(password)

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
        <Link to="/" style={styles.backLink}>
          <ArrowLeft size={15} />
          Back to home
        </Link>

        <div style={styles.logo}>Futurixia</div>
        <h1 style={styles.title}>{titles[mode]}</h1>
        <p style={styles.subtitle}>{subtitles[mode]}</p>

        <form onSubmit={handleSubmit} noValidate>
          <label style={styles.label} htmlFor="auth-email">
            Email
          </label>
          <div style={styles.inputWrap}>
            <Mail size={17} color="#9599b0" />
            <input
              id="auth-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>

          {mode !== "forgot" && (
            <>
              <label style={styles.label} htmlFor="auth-password">
                Password
              </label>
              <div style={styles.inputWrap}>
                <Lock size={17} color="#9599b0" />
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder={mode === "login" ? "Your password" : "At least 8 characters"}
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

              {mode === "login" && (
                <div style={styles.forgotRow}>
                  <button
                    type="button"
                    style={styles.linkBtn}
                    onClick={() => switchMode("forgot")}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {mode === "signup" && (
                <>
                  <p style={styles.hint}>
                    <span style={{ color: password.length >= 8 ? "#4ade80" : "#9599b0" }}>
                      {password.length >= 8 ? "✓" : "•"} At least 8 characters
                    </span>
                    <br />
                    <span style={{ color: hasLetterAndNumber ? "#4ade80" : "#9599b0" }}>
                      {hasLetterAndNumber ? "✓" : "•"} A letter and a number
                    </span>
                  </p>

                  <label style={styles.label} htmlFor="auth-confirm">
                    Confirm password
                  </label>
                  <div style={styles.inputWrap}>
                    <Lock size={17} color="#9599b0" />
                    <input
                      id="auth-confirm"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Type the password again"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={styles.input}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {error && (
            <p style={styles.errorText} role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p style={styles.noticeText} role="status">
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{notice}</span>
            </p>
          )}

          <button
            type="submit"
            style={{
              ...styles.primaryBtn,
              ...(loading || (mode === "forgot" && cooldown > 0) ? styles.btnDisabled : {}),
            }}
            disabled={loading || (mode === "forgot" && cooldown > 0)}
          >
            {loading ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                style={{ display: "inline-flex" }}
              >
                <Loader2 size={18} />
              </motion.span>
            ) : (
              submitLabel
            )}
          </button>
        </form>

        {mode !== "forgot" && (
          <>
            <div style={styles.divider}>
              <span style={styles.dividerLine} />
              <span style={styles.dividerText}>or</span>
              <span style={styles.dividerLine} />
            </div>

            <button
              type="button"
              style={{ ...styles.googleBtn, ...(googleLoading ? styles.btnDisabled : {}) }}
              onClick={handleGoogle}
              disabled={googleLoading}
            >
              <span style={styles.googleG}>G</span>
              {googleLoading ? "Opening Google..." : "Continue with Google"}
            </button>
          </>
        )}

        <div style={styles.switchRow}>
          {mode === "login" && (
            <>
              New to Futurixia?{" "}
              <button type="button" style={styles.linkBtn} onClick={() => switchMode("signup")}>
                Create an account
              </button>
            </>
          )}
          {mode === "signup" && (
            <>
              Already have an account?{" "}
              <button type="button" style={styles.linkBtn} onClick={() => switchMode("login")}>
                Log in
              </button>
            </>
          )}
          {mode === "forgot" && (
            <button type="button" style={styles.linkBtn} onClick={() => switchMode("login")}>
              Back to log in
            </button>
          )}
        </div>

        {mode === "signup" && (
          <p style={styles.legalNote}>
            By creating an account you agree to the Terms of Service and Privacy Policy, which you
            can read in the footer of our homepage.
          </p>
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
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: "#9599b0",
    fontSize: "0.82rem",
    textDecoration: "none",
    marginBottom: "18px",
  },
  logo: {
    fontSize: "1.4rem",
    fontWeight: 800,
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "10px",
  },
  title: { fontSize: "1.5rem", fontWeight: 800, marginBottom: "6px" },
  subtitle: { color: "#a9adc4", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "22px" },
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
  forgotRow: { textAlign: "right", marginTop: "10px" },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#a5b4fc",
    fontSize: "0.85rem",
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
    fontFamily: "inherit",
  },
  hint: { fontSize: "0.78rem", lineHeight: 1.6, marginTop: "10px" },
  errorText: {
    color: "#ff9b9b",
    fontSize: "0.85rem",
    lineHeight: 1.5,
    marginTop: "16px",
  },
  noticeText: {
    display: "flex",
    gap: "8px",
    color: "#86efac",
    fontSize: "0.85rem",
    lineHeight: 1.5,
    marginTop: "16px",
  },
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
  divider: { display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" },
  dividerLine: { flex: 1, height: "1px", background: "rgba(255,255,255,0.12)" },
  dividerText: { color: "#7d8299", fontSize: "0.78rem" },
  googleBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    background: "rgba(255,255,255,0.07)",
    color: "#fff",
    border: "none",
    padding: "13px",
    borderRadius: "14px",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)",
    fontFamily: "inherit",
  },
  googleG: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#fff",
    color: "#4285f4",
    fontWeight: 800,
    fontSize: "0.8rem",
  },
  switchRow: {
    textAlign: "center",
    color: "#a9adc4",
    fontSize: "0.88rem",
    marginTop: "22px",
  },
  legalNote: {
    color: "#7d8299",
    fontSize: "0.72rem",
    lineHeight: 1.5,
    textAlign: "center",
    marginTop: "14px",
  },
}

export default Auth