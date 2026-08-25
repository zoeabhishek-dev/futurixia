import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react"
import { supabase } from "../supabaseClient"
import "./Auth.css"

function Auth() {
  const [mode, setMode] = useState("login") // "login" or "signup"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [checkingSession, setCheckingSession] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const checkExistingSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data?.session) {
        navigate("/dashboard")
      } else {
        setCheckingSession(false)
      }
    }
    checkExistingSession()
  }, [navigate])

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    setSuccessMsg("")
    setLoading(true)

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password })
      setLoading(false)
      if (error) {
        setErrorMsg(error.message)
      } else {
        setSuccessMsg("Account created! Check your email to confirm, then log in.")
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (error) {
        setErrorMsg(error.message)
      } else {
        navigate("/dashboard")
      }
    }
  }

  const handleGoogleLogin = async () => {
    setErrorMsg("")
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/dashboard",
      },
    })
  }

  if (checkingSession) {
    return null
  }

  return (
    <div className="auth-page">
      <div className="aurora-bg">
        <div className="aurora-blob blob-a" />
        <div className="aurora-blob blob-b" />
        <div className="aurora-blob blob-c" />
      </div>

      <Link to="/" className="auth-logo">Futurixia</Link>

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="auth-subtitle">
          {mode === "login"
            ? "Log in to continue building your career roadmap."
            : "Start your journey to your dream career."}
        </p>

        <button className="google-btn" onClick={handleGoogleLogin} type="button">
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.8-.4-4.1z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.8 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 15.6 3 8.4 7.9 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 45c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.6 36.4 26.9 37 24 37c-5.3 0-9.7-3.4-11.3-8.1l-6.7 5.1C8.4 40.1 15.6 45 24 45z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.4c-.5.4 7.2-5.3 7.2-15 0-1.4-.1-2.8-.4-4.1z"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <form onSubmit={handleEmailAuth}>
          <div className="input-group">
            <Mail size={18} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock size={18} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {errorMsg && <p className="auth-error">{errorMsg}</p>}
          {successMsg && <p className="auth-success">{successMsg}</p>}

          <button className="auth-submit-btn" type="submit" disabled={loading}>
            {loading ? (
              <Loader2 size={18} className="spin" />
            ) : (
              <>
                {mode === "login" ? "Log In" : "Sign Up"}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <span
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login")
              setErrorMsg("")
              setSuccessMsg("")
            }}
          >
            {mode === "login" ? "Sign Up" : "Log In"}
          </span>
        </p>
      </motion.div>
    </div>
  )
}

export default Auth