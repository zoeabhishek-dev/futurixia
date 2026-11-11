import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  UserCircle,
  ShieldCheck,
  FileText,
  Trash2,
  LogOut,
  AlertTriangle,
  Loader2,
  Crown,
  CheckCircle2,
} from "lucide-react"
import { supabase } from "../supabaseClient"
import Logo from "../components/Logo"
import { useTheme } from "../lib/theme"

const PLAN_LABELS = { free: "Free", pro: "Pro", pro_max: "Pro Max" }

function formatDate(value) {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
}

function AccountSettings() {
  const navigate = useNavigate()
  const { plan } = useTheme()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [expires, setExpires] = useState(null)
  const [tier, setTier] = useState("free")

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!showLogoutConfirm) return undefined
    const onKey = (e) => {
      if (e.key === "Escape" && !loggingOut) setShowLogoutConfirm(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [showLogoutConfirm, loggingOut])

  const [showDelete, setShowDelete] = useState(false)
  const [typed, setTyped] = useState("")
  const [understood, setUnderstood] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")
  const [deleted, setDeleted] = useState(false)

  useEffect(() => {
    document.title = "Account Settings | Futurixia"
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) {
        navigate("/login")
        return
      }
      setEmail(user.email || "")

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, subscription_tier, subscription_expires_at")
        .eq("id", user.id)
        .maybeSingle()

      if (profile) {
        setName(profile.full_name || "")
        setTier(profile.subscription_tier || "free")
        setExpires(profile.subscription_expires_at)
      }
      setLoading(false)
    }
    load()
  }, [navigate])

  useEffect(() => {
    if (!showDelete) return undefined
    const onKey = (e) => {
      if (e.key === "Escape" && !deleting) closeDelete()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDelete, deleting])

  const closeDelete = () => {
    setShowDelete(false)
    setTyped("")
    setUnderstood(false)
    setError("")
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    navigate("/")
  }

  const deleteAccount = async () => {
    setError("")
    setDeleting(true)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token
      if (!token) throw new Error("Your session has expired. Please log in again and retry.")

      const response = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ confirm: "DELETE" }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || result.ok !== true) {
        throw new Error(result.error || "The deletion service did not answer. It only works on the live website, not on localhost. Please try again there or contact us.")
      }

      try {
        await supabase.auth.signOut({ scope: "local" })
      } catch (err) {
        // The login no longer exists on the server, so a local sign-out is enough.
      }
      try {
        Object.keys(window.localStorage)
          .filter((key) => key.startsWith("fx"))
          .forEach((key) => window.localStorage.removeItem(key))
      } catch (err) {
        // Storage can be blocked.
      }

      setShowDelete(false)
      setDeleted(true)
      setTimeout(() => navigate("/"), 4000)
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.")
      setDeleting(false)
    }
  }

  if (deleted) {
    return (
      <div style={styles.center}>
        <div style={styles.doneCard}>
          <CheckCircle2 size={40} color="#4ade80" />
          <h1 style={styles.doneTitle}>Your account has been deleted</h1>
          <p style={styles.doneText}>
            Your login and the information saved with it have been removed. You will be taken to the home page in a
            moment.
          </p>
          <Link to="/" style={styles.linkBtn}>
            Go to the home page
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={styles.center}>
        <p style={{ color: "var(--fx-muted-2)" }}>Loading your settings...</p>
      </div>
    )
  }

  const currentPlan = plan || tier || "free"
  const canDelete = typed === "DELETE" && understood && !deleting

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <Logo height={52} mobileHeight={42} />
        <Link to="/dashboard" style={styles.backLink}>
          <ArrowLeft size={15} />
          Dashboard
        </Link>
      </header>

      <main style={styles.main}>
        <h1 style={styles.h1}>Account settings</h1>

        <section style={styles.card}>
          <h2 style={styles.h2}>Your account</h2>
          <dl style={styles.dl}>
            <div style={styles.row}>
              <dt style={styles.dt}>Name</dt>
              <dd style={styles.dd}>{name || "Not set"}</dd>
            </div>
            <div style={styles.row}>
              <dt style={styles.dt}>Email</dt>
              <dd style={styles.dd}>{email}</dd>
            </div>
            <div style={styles.row}>
              <dt style={styles.dt}>Plan</dt>
              <dd style={styles.dd}>
                {currentPlan !== "free" && <Crown size={14} color="var(--fx-accent-soft)" style={{ marginRight: 6 }} />}
                {PLAN_LABELS[currentPlan] || "Free"}
                {currentPlan !== "free" && expires ? ` (ends ${formatDate(expires)})` : ""}
              </dd>
            </div>
          </dl>
          <Link to="/create-profile" style={styles.ghostBtn}>
            <UserCircle size={16} />
            Edit profile
          </Link>
        </section>

        <section style={styles.card}>
          <h2 style={styles.h2}>Privacy and terms</h2>
          <p style={styles.text}>See what we collect and how it is used, and the rules for using Futurixia.</p>
          <div style={styles.btnRow}>
            <Link to="/privacy" style={styles.ghostBtn}>
              <ShieldCheck size={16} />
              Privacy Policy
            </Link>
            <Link to="/terms" style={styles.ghostBtn}>
              <FileText size={16} />
              Terms of Service
            </Link>
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.h2}>Log out</h2>
          <p style={styles.text}>Sign out of Futurixia on this device. Your progress stays saved.</p>
          <button
            style={{ ...styles.ghostBtn, border: "none", cursor: "pointer", fontFamily: "inherit" }}
            onClick={() => setShowLogoutConfirm(true)}
          >
            <LogOut size={16} />
            Log out
          </button>
        </section>

        <section style={{ ...styles.card, ...styles.danger }}>
          <h2 style={{ ...styles.h2, color: "#fca5a5" }}>Delete account</h2>
          <p style={styles.text}>
            This permanently deletes your login and the information saved with it. It cannot be undone.
          </p>
          <button style={styles.dangerBtn} onClick={() => setShowDelete(true)}>
            <Trash2 size={16} />
            Delete my account
          </button>
        </section>
      </main>

      {showLogoutConfirm && (
        <div style={styles.overlay} onClick={() => !loggingOut && setShowLogoutConfirm(false)}>
          <div
            style={{ ...styles.modal, boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(248,113,113,0.55)" }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="fx-logout-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ ...styles.warnIcon, background: "rgba(248,113,113,0.16)" }}>
              <AlertTriangle size={24} color="#f87171" />
            </div>
            <h2 id="fx-logout-title" style={{ ...styles.modalTitle, color: "#fca5a5" }}>
              Are you sure you want to log out?
            </h2>
            <p style={styles.text}>
              You will need to log in again to see your dashboard, missions and progress. Your progress stays saved.
            </p>
            <div style={styles.btnRow}>
              <button style={styles.cancelBtn} onClick={() => setShowLogoutConfirm(false)} disabled={loggingOut}>
                Cancel
              </button>
              <button style={styles.confirmBtn} onClick={handleLogout} disabled={loggingOut}>
                {loggingOut ? (
                  <Loader2 size={15} style={{ animation: "fxspin 0.9s linear infinite" }} />
                ) : (
                  <LogOut size={15} />
                )}
                {loggingOut ? "Logging out..." : "Yes, log out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDelete && (
        <div style={styles.overlay} onClick={() => !deleting && closeDelete()}>
          <div
            style={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Delete account"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.warnIcon}>
              <AlertTriangle size={24} color="#fbbf24" />
            </div>
            <h2 style={styles.modalTitle}>Delete your account?</h2>
            <p style={styles.text}>This will permanently delete:</p>
            <ul style={styles.ul}>
              <li>your login and profile</li>
              <li>your progress, listed skills and completed roadmaps</li>
              <li>your reflections in “A Day in This Career”</li>
              <li>your certificates. Their verification links will stop working</li>
            </ul>
            <p style={styles.text}>
              This cannot be undone. Anonymous feedback is not linked to your account, so it stays. If you have a
              question about a paid plan, please contact us before deleting.
            </p>

            <label style={styles.check}>
              <input
                type="checkbox"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
                style={styles.box}
              />
              <span>I understand that this is permanent.</span>
            </label>

            <label htmlFor="fx-delete-confirm" style={styles.label}>
              Type <strong>DELETE</strong> to confirm
            </label>
            <input
              id="fx-delete-confirm"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              style={styles.input}
            />

            {error && (
              <p role="alert" style={styles.error}>
                {error}
              </p>
            )}

            <div style={styles.btnRow}>
              <button style={styles.cancelBtn} onClick={closeDelete} disabled={deleting}>
                Cancel
              </button>
              <button
                style={{ ...styles.confirmBtn, ...(canDelete ? {} : styles.confirmOff) }}
                onClick={deleteAccount}
                disabled={!canDelete}
              >
                {deleting ? <Loader2 size={15} style={{ animation: "fxspin 0.9s linear infinite" }} /> : <Trash2 size={15} />}
                {deleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes fxspin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const styles = {
  page: { minHeight: "100vh", background: "var(--fx-bg)", color: "#ffffff", fontFamily: "Inter, system-ui, sans-serif" },
  center: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--fx-bg)",
    color: "#ffffff",
    padding: "20px",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  header: {
    maxWidth: "720px",
    margin: "0 auto",
    padding: "20px 20px 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: "var(--fx-text-2)",
    fontSize: "0.85rem",
    fontWeight: 600,
    textDecoration: "none",
    background: "rgba(255,255,255,0.08)",
    padding: "9px 16px",
    borderRadius: "30px",
  },
  main: { maxWidth: "720px", margin: "0 auto", padding: "0 20px 70px", display: "flex", flexDirection: "column", gap: "18px" },
  h1: { fontSize: "clamp(1.6rem, 5vw, 2.1rem)", fontWeight: 800, margin: "14px 0 4px" },
  card: {
    background: "rgba(255,255,255,0.05)",
    borderRadius: "20px",
    padding: "22px",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
  },
  danger: { boxShadow: "0 0 0 1px rgba(248,113,113,0.5)", background: "rgba(248,113,113,0.06)" },
  h2: { fontSize: "1.05rem", fontWeight: 700, margin: "0 0 12px" },
  dl: { margin: "0 0 16px", display: "flex", flexDirection: "column", gap: "10px" },
  row: { display: "flex", flexWrap: "wrap", gap: "4px 14px", alignItems: "baseline" },
  dt: { width: "70px", color: "var(--fx-muted)", fontSize: "0.85rem" },
  dd: { margin: 0, fontSize: "0.95rem", fontWeight: 600, wordBreak: "break-word", display: "flex", alignItems: "center" },
  text: { color: "var(--fx-muted-2)", fontSize: "0.9rem", lineHeight: 1.6, margin: "0 0 14px" },
  btnRow: { display: "flex", gap: "10px", flexWrap: "wrap" },
  ghostBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,255,255,0.09)",
    color: "#ffffff",
    textDecoration: "none",
    padding: "11px 18px",
    borderRadius: "30px",
    fontSize: "0.88rem",
    fontWeight: 700,
  },
  dangerBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "#b91c1c",
    color: "#ffffff",
    border: "none",
    padding: "12px 20px",
    borderRadius: "30px",
    fontSize: "0.9rem",
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    overflowY: "auto",
  },
  modal: {
    width: "100%",
    maxWidth: "440px",
    background: "var(--fx-surface)",
    borderRadius: "22px",
    padding: "26px 22px 22px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
  },
  warnIcon: {
    width: "46px",
    height: "46px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "14px",
    background: "rgba(251,191,36,0.14)",
    marginBottom: "12px",
  },
  modalTitle: { fontSize: "1.2rem", fontWeight: 800, margin: "0 0 10px" },
  ul: { margin: "0 0 12px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px", color: "var(--fx-text-2)", fontSize: "0.9rem", lineHeight: 1.5 },
  check: { display: "flex", gap: "10px", alignItems: "center", fontSize: "0.9rem", color: "var(--fx-text-2)", margin: "0 0 14px", cursor: "pointer" },
  box: { width: "20px", height: "20px", flexShrink: 0, accentColor: "#ef4444" },
  label: { display: "block", fontSize: "0.85rem", color: "var(--fx-text-2)", marginBottom: "6px" },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.07)",
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "1rem",
    fontFamily: "inherit",
    marginBottom: "14px",
    outline: "none",
  },
  error: { color: "#fca5a5", fontSize: "0.85rem", margin: "0 0 12px", lineHeight: 1.5 },
  cancelBtn: {
    flex: 1,
    background: "rgba(255,255,255,0.09)",
    color: "#ffffff",
    border: "none",
    padding: "13px",
    borderRadius: "14px",
    fontSize: "0.9rem",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  confirmBtn: {
    flex: 1.4,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: "#b91c1c",
    color: "#ffffff",
    border: "none",
    padding: "13px",
    borderRadius: "14px",
    fontSize: "0.9rem",
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  confirmOff: { opacity: 0.4, cursor: "not-allowed" },
  doneCard: { maxWidth: "420px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
  doneTitle: { fontSize: "1.4rem", fontWeight: 800, margin: 0 },
  doneText: { color: "var(--fx-muted-2)", fontSize: "0.92rem", lineHeight: 1.6, margin: 0 },
  linkBtn: {
    marginTop: "6px",
    background: "linear-gradient(90deg, var(--fx-primary), var(--fx-secondary))",
    color: "#ffffff",
    textDecoration: "none",
    padding: "12px 22px",
    borderRadius: "30px",
    fontWeight: 700,
    fontSize: "0.9rem",
  },
}

export default AccountSettings
