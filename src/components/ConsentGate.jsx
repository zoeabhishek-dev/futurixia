import { useCallback, useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { LogOut, ShieldCheck, Loader2 } from "lucide-react"
import { supabase } from "../supabaseClient"
import { LEGAL } from "../lib/legalInfo"

// Pages where the screen is not shown, so people can read the documents or delete their account.
const SKIP = ["/privacy", "/terms", "/settings", "/login", "/reset-password", "/verify"]

function ConsentGate() {
  const location = useLocation()
  const navigate = useNavigate()
  const [state, setState] = useState({ status: "done", ageKnown: true, minor: false })
  const [agree, setAgree] = useState(false)
  const [guardian, setGuardian] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const skipped = SKIP.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`))

  const check = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData?.session?.user
      if (!user) {
        setState({ status: "done", ageKnown: true, minor: false })
        return
      }

      const { data, error: readError } = await supabase
        .from("profiles")
        .select("age, terms_version, guardian_consent_at")
        .eq("id", user.id)
        .maybeSingle()

      // No profile yet (or the new columns are not in the database yet): do not block anyone.
      if (readError || !data) {
        setState({ status: "done", ageKnown: true, minor: false })
        return
      }

      const age = Number.isFinite(Number(data.age)) && data.age !== null ? Number(data.age) : null

      if (age !== null && age < LEGAL.minimumAge) {
        setState({ status: "blocked", ageKnown: true, minor: true })
        return
      }

      const minor = age !== null && age < 18
      const needsTerms = data.terms_version !== LEGAL.termsVersion
      const needsGuardian = minor && !data.guardian_consent_at

      setState({
        status: needsTerms || needsGuardian ? "needs" : "done",
        ageKnown: age !== null,
        minor,
      })
    } catch (err) {
      setState({ status: "done", ageKnown: true, minor: false })
    }
  }, [])

  useEffect(() => {
    check()
  }, [check, location.pathname])

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setState({ status: "done", ageKnown: true, minor: false })
      else if (event === "SIGNED_IN" || event === "USER_UPDATED") setTimeout(check, 0)
    })
    return () => listener.subscription.unsubscribe()
  }, [check])

  const logOut = async () => {
    await supabase.auth.signOut()
    navigate("/")
  }

  const submit = async () => {
    setError("")
    setSaving(true)
    const needsGuardianFlag = state.minor || !state.ageKnown
    const confirmed = state.minor ? guardian : agree
    const { error: rpcError } = await supabase.rpc("record_consent", {
      p_version: LEGAL.termsVersion,
      p_guardian_confirmed: needsGuardianFlag ? confirmed : false,
    })
    setSaving(false)
    if (rpcError) {
      setError(rpcError.message || "We could not save this. Please try again.")
      return
    }
    setAgree(false)
    setGuardian(false)
    setState((s) => ({ ...s, status: "done" }))
  }

  if (skipped || state.status === "done") return null

  if (state.status === "blocked") {
    return (
      <div style={styles.overlay} role="dialog" aria-modal="true" aria-label="Age requirement">
        <div style={styles.card}>
          <div style={styles.icon}>
            <ShieldCheck size={24} color="var(--fx-accent-soft)" />
          </div>
          <h2 style={styles.title}>Futurixia is for students aged {LEGAL.minimumAge} and above</h2>
          <p style={styles.text}>
            The age on this profile is below our minimum age, so we cannot continue to provide the service. You can
            log out, or delete this account and the information saved with it.
          </p>
          <div style={styles.actions}>
            <button style={styles.secondaryBtn} onClick={logOut}>
              <LogOut size={15} />
              Log out
            </button>
            <button style={styles.primaryBtn} onClick={() => navigate("/settings")}>
              Account settings
            </button>
          </div>
        </div>
      </div>
    )
  }

  const unknownAge = !state.ageKnown
  const ready = state.minor ? agree && guardian : agree

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-label="Terms and privacy">
      <div style={styles.card}>
        <div style={styles.icon}>
          <ShieldCheck size={24} color="var(--fx-accent-soft)" />
        </div>
        <h2 style={styles.title}>Before you continue</h2>
        <p style={styles.text}>
          Please read how Futurixia works and how we handle your information. Both pages open in a new tab.
        </p>
        <p style={styles.links}>
          <a href="/terms" target="_blank" rel="noopener noreferrer" style={styles.link}>
            Terms of Service
          </a>
          <a href="/privacy" target="_blank" rel="noopener noreferrer" style={styles.link}>
            Privacy Policy
          </a>
        </p>

        <label style={styles.check}>
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={styles.box} />
          <span>
            {unknownAge
              ? "I have read and agree to the Terms of Service and Privacy Policy. I am 18 or older, or my parent or guardian has read them and agrees to my use of Futurixia."
              : "I have read and agree to the Terms of Service and the Privacy Policy."}
          </span>
        </label>

        {state.minor && (
          <>
            <p style={styles.minorNote}>
              You are under 18, so a parent or guardian needs to be involved. We rely on your confirmation below and do
              not check it independently.
            </p>
            <label style={styles.check}>
              <input
                type="checkbox"
                checked={guardian}
                onChange={(e) => setGuardian(e.target.checked)}
                style={styles.box}
              />
              <span>
                My parent or guardian has read the Terms of Service and the Privacy Policy and agrees to my use of
                Futurixia.
              </span>
            </label>
          </>
        )}

        {error && (
          <p role="alert" style={styles.error}>
            {error}
          </p>
        )}

        <div style={styles.actions}>
          <button style={styles.secondaryBtn} onClick={logOut}>
            <LogOut size={15} />
            Log out
          </button>
          <button
            style={{ ...styles.primaryBtn, ...(ready && !saving ? {} : styles.primaryOff) }}
            onClick={submit}
            disabled={!ready || saving}
          >
            {saving ? <Loader2 size={15} style={{ animation: "fxspin 0.9s linear infinite" }} /> : null}
            I agree and continue
          </button>
        </div>
      </div>
      <style>{`@keyframes fxspin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 500,
    background: "rgba(0,0,0,0.78)",
    backdropFilter: "blur(5px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    overflowY: "auto",
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    background: "var(--fx-surface)",
    color: "#ffffff",
    borderRadius: "22px",
    padding: "26px 22px 22px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  icon: {
    width: "46px",
    height: "46px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "14px",
    background: "rgba(var(--fx-primary-rgb), 0.25)",
    marginBottom: "12px",
  },
  title: { fontSize: "1.25rem", fontWeight: 800, margin: "0 0 8px", lineHeight: 1.3 },
  text: { color: "var(--fx-muted-2)", fontSize: "0.9rem", lineHeight: 1.6, margin: "0 0 12px" },
  links: { display: "flex", gap: "18px", flexWrap: "wrap", margin: "0 0 16px", fontSize: "0.9rem" },
  link: { color: "#60a5fa", textDecoration: "underline", textUnderlineOffset: "3px", fontWeight: 600 },
  check: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
    fontSize: "0.88rem",
    lineHeight: 1.55,
    color: "var(--fx-text-2)",
    margin: "0 0 12px",
    cursor: "pointer",
  },
  box: { width: "20px", height: "20px", marginTop: "1px", flexShrink: 0, accentColor: "var(--fx-primary-light)" },
  minorNote: {
    background: "rgba(var(--fx-primary-rgb), 0.16)",
    color: "var(--fx-accent-softest)",
    borderRadius: "12px",
    padding: "11px 13px",
    fontSize: "0.84rem",
    lineHeight: 1.55,
    margin: "4px 0 12px",
  },
  error: { color: "#fca5a5", fontSize: "0.85rem", margin: "0 0 10px" },
  actions: { display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" },
  primaryBtn: {
    flex: 1,
    minWidth: "150px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: "linear-gradient(90deg, var(--fx-primary), var(--fx-secondary))",
    color: "#ffffff",
    border: "none",
    padding: "13px 16px",
    borderRadius: "14px",
    fontSize: "0.9rem",
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  primaryOff: { opacity: 0.45, cursor: "not-allowed" },
  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    background: "rgba(255,255,255,0.09)",
    color: "#ffffff",
    border: "none",
    padding: "13px 16px",
    borderRadius: "14px",
    fontSize: "0.88rem",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
}

export default ConsentGate
