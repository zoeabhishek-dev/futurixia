import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Printer,
  Link2,
  Loader2,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Award,
} from "lucide-react"
import { supabase } from "../supabaseClient"
import PricingModal from "../components/PricingModal"

function Certificate() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState("loading")
  const [message, setMessage] = useState("")
  const [cert, setCert] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showPricing, setShowPricing] = useState(false)
  const [country, setCountry] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user
        if (!user) {
          navigate("/login")
          return
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_tier, country")
          .eq("id", user.id)
          .maybeSingle()

        setCountry(profile?.country || null)

        if (profile?.subscription_tier !== "pro_max") {
          setStatus("locked")
          return
        }

        const { data: career } = await supabase
          .from("careers")
          .select("id, title")
          .eq("slug", slug)
          .maybeSingle()

        if (!career) {
          setMessage("We could not find that career.")
          setStatus("error")
          return
        }

        const { data: existing } = await supabase
          .from("certificates")
          .select("*")
          .eq("user_id", user.id)
          .eq("career_id", career.id)
          .maybeSingle()

        if (existing) {
          setCert(existing)
          setStatus("ready")
          return
        }

        const { error: issueError } = await supabase.rpc("issue_certificate", {
          p_career_id: career.id,
        })

        if (issueError) {
          setMessage(issueError.message || "We could not issue your certificate right now.")
          setStatus("notready")
          return
        }

        const { data: created } = await supabase
          .from("certificates")
          .select("*")
          .eq("user_id", user.id)
          .eq("career_id", career.id)
          .maybeSingle()

        if (created) {
          setCert(created)
          setStatus("ready")
        } else {
          setMessage("Your certificate was created but could not be loaded. Please refresh.")
          setStatus("error")
        }
      } catch (err) {
        setMessage("Something went wrong. Please check your connection and try again.")
        setStatus("error")
      }
    }

    load()
  }, [slug, navigate])

  const verifyUrl = cert ? `${window.location.origin}/verify/${cert.id}` : ""

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      window.prompt("Copy this verification link:", verifyUrl)
    }
  }

  const issuedDate = cert
    ? new Date(cert.issued_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : ""

  return (
    <div style={styles.page} className="fx-cert-page">
      <style>{`
        @page { size: A4 landscape; margin: 10mm; }
        .fx-cert { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print {
          body { background: #ffffff !important; }
          .no-print { display: none !important; }
          .aurora-bg { display: none !important; }
          .fx-cert-page { background: #ffffff !important; padding: 0 !important; min-height: auto !important; }
          .fx-cert { box-shadow: none !important; max-width: 100% !important; }
        }
      `}</style>

      <div className="aurora-bg no-print">
        <div className="aurora-blob blob-a" />
        <div className="aurora-blob blob-b" />
        <div className="aurora-blob blob-c" />
      </div>

      <div style={styles.container}>
        <button
          className="no-print"
          style={styles.backBtn}
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={16} />
          Dashboard
        </button>

        {status === "loading" && (
          <div style={styles.messageCard} className="no-print">
            <motionSpinner />
            <p style={styles.messageText}>Preparing your certificate...</p>
          </div>
        )}

        {status === "locked" && (
          <div style={styles.messageCard} className="no-print">
            <div style={{ ...styles.iconCircle, background: "rgba(99,102,241,0.16)" }}>
              <Lock size={24} color="#a5b4fc" />
            </div>
            <h1 style={styles.messageTitle}>Certificates are part of Pro Max</h1>
            <p style={styles.messageText}>
              Finish a roadmap and get a certificate with a unique ID that anyone can verify online.
            </p>
            <button style={styles.primaryBtn} onClick={() => setShowPricing(true)}>
              See Plans
            </button>
          </div>
        )}

        {status === "notready" && (
          <div style={styles.messageCard} className="no-print">
            <div style={{ ...styles.iconCircle, background: "rgba(251,191,36,0.14)" }}>
              <AlertTriangle size={24} color="#fbbf24" />
            </div>
            <h1 style={styles.messageTitle}>Not quite yet</h1>
            <p style={styles.messageText}>{message}</p>
            <button style={styles.primaryBtn} onClick={() => navigate(`/career/${slug}`)}>
              Back to Roadmap
            </button>
          </div>
        )}

        {status === "error" && (
          <div style={styles.messageCard} className="no-print">
            <div style={{ ...styles.iconCircle, background: "rgba(255,155,155,0.14)" }}>
              <AlertTriangle size={24} color="#ff9b9b" />
            </div>
            <h1 style={styles.messageTitle}>Something went wrong</h1>
            <p style={styles.messageText}>{message}</p>
            <button style={styles.primaryBtn} onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </button>
          </div>
        )}

        {status === "ready" && cert && (
          <>
            <div className="no-print" style={styles.actionsRow}>
              <button style={styles.primaryBtn} onClick={() => window.print()}>
                <Printer size={16} />
                Print or Save as PDF
              </button>
              <button style={styles.secondaryBtn} onClick={copyLink}>
                {copied ? <CheckCircle2 size={16} color="#4ade80" /> : <Link2 size={16} />}
                {copied ? "Link copied" : "Copy Verification Link"}
              </button>
            </div>

            <div style={styles.cert} className="fx-cert">
              <div style={styles.certInner}>
                <div style={styles.seal}>
                  <Award size={30} color="#ffffff" />
                </div>
                <div style={styles.certBrand}>Futurixia</div>
                <div style={styles.certKicker}>Certificate of Completion</div>

                <p style={styles.certLine}>This certifies that</p>
                <h1 style={styles.certName}>{cert.student_name}</h1>
                <p style={styles.certLine}>
                  has completed every step of the Futurixia career roadmap for
                </p>
                <h2 style={styles.certCareer}>{cert.career_title}</h2>
                <p style={styles.certMeta}>
                  {cert.total_steps} of {cert.total_steps} steps completed
                </p>

                <div style={styles.certFooter}>
                  <div style={styles.certFooterItem}>
                    <span style={styles.certFooterLabel}>Date issued</span>
                    <strong style={styles.certFooterValue}>{issuedDate}</strong>
                  </div>
                  <div style={styles.certFooterItem}>
                    <span style={styles.certFooterLabel}>Certificate ID</span>
                    <strong style={styles.certFooterValue}>{cert.id}</strong>
                  </div>
                </div>

                <p style={styles.certVerify}>Verify this certificate at {verifyUrl}</p>
                <p style={styles.certDisclaimer}>
                  This certificate recognises completion of a self-guided learning roadmap on
                  Futurixia. It is not a professional licence or an academic qualification.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        studentCountry={country}
      />
    </div>
  )
}

function motionSpinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
      <Loader2 size={26} color="#a5b4fc" style={{ animation: "fxspin 0.9s linear infinite" }} />
      <style>{`@keyframes fxspin { to { transform: rotate(360deg); } }`}</style>
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
    padding: "24px 16px 60px",
    overflow: "hidden",
  },
  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: "900px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
  },
  backBtn: {
    alignSelf: "flex-start",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(255,255,255,0.09)",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "30px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  messageCard: {
    width: "100%",
    maxWidth: "440px",
    background: "rgba(15,17,32,0.88)",
    borderRadius: "22px",
    padding: "34px 28px",
    textAlign: "center",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.1)",
  },
  iconCircle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "54px",
    height: "54px",
    borderRadius: "50%",
    margin: "0 auto 16px",
  },
  messageTitle: { fontSize: "1.3rem", fontWeight: 800, marginBottom: "8px" },
  messageText: { color: "#a9adc4", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "20px" },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    color: "#fff",
    border: "none",
    padding: "13px 24px",
    borderRadius: "30px",
    fontSize: "0.9rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    border: "none",
    padding: "13px 24px",
    borderRadius: "30px",
    fontSize: "0.9rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)",
  },
  actionsRow: { display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" },
  cert: {
    width: "100%",
    maxWidth: "860px",
    background: "linear-gradient(135deg, #6366f1, #22d3ee)",
    padding: "6px",
    borderRadius: "20px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
  },
  certInner: {
    background: "#fffdf8",
    color: "#1b1d2e",
    borderRadius: "15px",
    padding: "clamp(24px, 5vw, 52px)",
    textAlign: "center",
  },
  seal: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "#4f46e5",
    margin: "0 auto 14px",
    boxShadow: "0 0 0 6px #e0e7ff",
  },
  certBrand: { fontSize: "1.3rem", fontWeight: 800, color: "#4f46e5", marginBottom: "4px" },
  certKicker: {
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "#0891b2",
    marginBottom: "26px",
  },
  certLine: { fontSize: "0.95rem", color: "#4b4f66", margin: "8px 0" },
  certName: {
    display: "inline-block",
    fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
    fontWeight: 800,
    color: "#1b1d2e",
    padding: "4px 18px 8px",
    borderBottom: "2px solid #c7d2fe",
    margin: "8px 0",
    wordBreak: "break-word",
  },
  certCareer: {
    fontSize: "clamp(1.3rem, 3.5vw, 2rem)",
    fontWeight: 800,
    color: "#4f46e5",
    margin: "8px 0",
  },
  certMeta: { fontSize: "0.9rem", color: "#4b4f66", marginBottom: "28px" },
  certFooter: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "16px",
    borderTop: "1px solid #e6dfc8",
    paddingTop: "18px",
    textAlign: "left",
  },
  certFooterItem: { display: "flex", flexDirection: "column", gap: "4px" },
  certFooterLabel: {
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#7d8299",
  },
  certFooterValue: { fontSize: "0.92rem", color: "#1b1d2e", wordBreak: "break-all" },
  certVerify: { fontSize: "0.72rem", color: "#7d8299", marginTop: "18px", wordBreak: "break-all" },
  certDisclaimer: { fontSize: "0.68rem", color: "#9a9db0", marginTop: "10px", lineHeight: 1.5 },
}

export default Certificate