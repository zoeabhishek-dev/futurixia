import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Printer,
  Link2,
  Share2,
  Loader2,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Award,
} from "lucide-react"
import { supabase } from "../supabaseClient"
import PricingModal from "../components/PricingModal"

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
      <Loader2 size={26} color="#a5b4fc" style={{ animation: "fxspin 0.9s linear infinite" }} />
    </div>
  )
}

function Corner({ pos }) {
  const places = {
    tl: { top: 14, left: 14, transform: "none" },
    tr: { top: 14, right: 14, transform: "scaleX(-1)" },
    bl: { bottom: 14, left: 14, transform: "scaleY(-1)" },
    br: { bottom: 14, right: 14, transform: "scale(-1, -1)" },
  }
  return (
    <svg
      width="58"
      height="58"
      viewBox="0 0 58 58"
      aria-hidden="true"
      style={{ position: "absolute", ...places[pos] }}
    >
      <path d="M2 56V8Q2 2 8 2h48" fill="none" stroke="#c9a24b" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M10 56V14Q10 10 14 10h42" fill="none" stroke="#c9a24b" strokeWidth="1" opacity="0.65" />
      <circle cx="2" cy="2" r="3.2" fill="#c9a24b" />
    </svg>
  )
}

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

  const shareCertificate = async () => {
    if (!cert) return
    const text = `I completed the ${cert.career_title} career roadmap on Futurixia.`
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Futurixia certificate", text, url: verifyUrl })
      } catch (err) {
        // The person closed the share sheet.
      }
    } else {
      copyLink()
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
        @keyframes fxspin { to { transform: rotate(360deg); } }
        @page { size: A4 landscape; margin: 8mm; }
        .fx-cert { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media (max-width: 560px) {
          .fx-cert-footer { grid-template-columns: 1fr !important; text-align: center !important; gap: 18px !important; }
          .fx-cert-footer > div { text-align: center !important; }
        }
        @media print {
          body { background: #ffffff !important; }
          .no-print { display: none !important; }
          .aurora-bg { display: none !important; }
          .fx-cert-page { background: #ffffff !important; padding: 0 !important; min-height: auto !important; overflow: visible !important; }
          .fx-cert { box-shadow: none !important; max-width: 100% !important; break-inside: avoid; page-break-inside: avoid; }
          .fx-cert-body { padding: 8mm 14mm !important; }
        }
      `}</style>

      <div className="aurora-bg no-print">
        <div className="aurora-blob blob-a" />
        <div className="aurora-blob blob-b" />
        <div className="aurora-blob blob-c" />
      </div>

      <div style={styles.container}>
        <button className="no-print" style={styles.backBtn} onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={16} />
          Dashboard
        </button>

        {status === "loading" && (
          <div style={styles.messageCard} className="no-print">
            <Spinner />
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
              <button style={styles.secondaryBtn} onClick={shareCertificate}>
                <Share2 size={16} />
                Share
              </button>
              <button style={styles.secondaryBtn} onClick={copyLink}>
                {copied ? <CheckCircle2 size={16} color="#4ade80" /> : <Link2 size={16} />}
                {copied ? "Link copied" : "Copy Verification Link"}
              </button>
            </div>

            <p className="no-print" style={styles.printTip}>
              Tip: when printing, switch off "Headers and footers" for a clean certificate.
            </p>

            <div style={styles.certOuter} className="fx-cert">
              <div style={styles.certPaper}>
                <div style={styles.innerBorder} aria-hidden="true" />
                <Corner pos="tl" />
                <Corner pos="tr" />
                <Corner pos="bl" />
                <Corner pos="br" />

                <div style={styles.certBody} className="fx-cert-body">
                  <div style={styles.brandRow}>
                    <span style={styles.brandMark}>F</span>
                    <span style={styles.brandName}>Futurixia</span>
                  </div>
                  <p style={styles.kicker}>Career Roadmap Achievement</p>

                  <h1 style={styles.certTitle}>Certificate</h1>
                  <p style={styles.certSubtitle}>of Completion</p>

                  <div style={styles.dividerRow} aria-hidden="true">
                    <span style={styles.dividerLine} />
                    <Award size={18} color="#c9a24b" />
                    <span style={styles.dividerLine} />
                  </div>

                  <p style={styles.presented}>This certificate is proudly presented to</p>
                  <h2 style={styles.certName}>{cert.student_name}</h2>
                  <div style={styles.nameRule} aria-hidden="true" />

                  <p style={styles.certLine}>
                    for successfully completing every step of the Futurixia career roadmap for
                  </p>
                  <h3 style={styles.certCareer}>{cert.career_title}</h3>
                  <p style={styles.certMeta}>
                    {cert.total_steps} of {cert.total_steps} steps completed
                  </p>

                  <div style={styles.footerGrid} className="fx-cert-footer">
                    <div style={{ textAlign: "left" }}>
                      <span style={styles.footerLabel}>Date issued</span>
                      <strong style={styles.footerValue}>{issuedDate}</strong>
                    </div>

                    <div style={styles.sealWrap} aria-hidden="true">
                      <div style={styles.ribbonL} />
                      <div style={styles.ribbonR} />
                      <div style={styles.sealOuter}>
                        <div style={styles.sealInner}>
                          <Award size={26} color="#6b4e0f" />
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span style={styles.footerLabel}>Certificate ID</span>
                      <strong style={styles.footerValue}>{cert.id}</strong>
                    </div>
                  </div>

                  <p style={styles.verify}>Verify this certificate at {verifyUrl}</p>
                  <p style={styles.disclaimer}>
                    This certificate recognises completion of a self-guided learning roadmap on
                    Futurixia. It is not a professional licence or an academic qualification.
                  </p>
                </div>
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

const SERIF = 'Georgia, "Times New Roman", serif'

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
    maxWidth: "940px",
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
    fontFamily: "inherit",
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
    fontFamily: "inherit",
  },
  actionsRow: { display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" },
  printTip: { color: "#7d8299", fontSize: "0.78rem", textAlign: "center", marginTop: "-8px" },

  certOuter: {
    width: "100%",
    maxWidth: "900px",
    background: "linear-gradient(135deg, #3730a3, #0e7490 50%, #c9a24b)",
    padding: "8px",
    borderRadius: "20px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
  },
  certPaper: {
    position: "relative",
    background:
      "radial-gradient(circle at 50% 0%, rgba(99,102,241,0.08), transparent 55%), radial-gradient(circle at 100% 100%, rgba(201,162,75,0.12), transparent 45%), #fffdf6",
    borderRadius: "13px",
    color: "#1e1b4b",
    overflow: "hidden",
  },
  innerBorder: {
    position: "absolute",
    inset: "12px",
    border: "1px solid rgba(201,162,75,0.75)",
    borderRadius: "6px",
    pointerEvents: "none",
  },
  certBody: {
    position: "relative",
    padding: "clamp(34px, 6vw, 58px) clamp(26px, 6vw, 70px) clamp(26px, 5vw, 40px)",
    textAlign: "center",
  },
  brandRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" },
  brandMark: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "30px",
    height: "30px",
    borderRadius: "9px",
    background: "linear-gradient(135deg, #4338ca, #0891b2)",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "1rem",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  brandName: {
    fontSize: "1.35rem",
    fontWeight: 800,
    color: "#3730a3",
    fontFamily: "Inter, system-ui, sans-serif",
    letterSpacing: "0.02em",
  },
  kicker: {
    marginTop: "6px",
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.32em",
    textTransform: "uppercase",
    color: "#0e7490",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  certTitle: {
    marginTop: "18px",
    fontFamily: SERIF,
    fontSize: "clamp(2rem, 6.5vw, 3.5rem)",
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#1e1b4b",
    lineHeight: 1.1,
  },
  certSubtitle: {
    marginTop: "6px",
    fontFamily: SERIF,
    fontSize: "clamp(0.78rem, 2vw, 1rem)",
    letterSpacing: "0.5em",
    textTransform: "uppercase",
    color: "#9a7b2f",
    paddingLeft: "0.5em",
  },
  dividerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
    margin: "18px auto 14px",
    maxWidth: "340px",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "linear-gradient(90deg, transparent, #c9a24b, transparent)",
  },
  presented: {
    fontFamily: SERIF,
    fontStyle: "italic",
    fontSize: "clamp(0.85rem, 2.4vw, 1.02rem)",
    color: "#4b4f66",
  },
  certName: {
    margin: "10px auto 4px",
    fontFamily: SERIF,
    fontStyle: "italic",
    fontWeight: 700,
    fontSize: "clamp(1.9rem, 6.5vw, 3.2rem)",
    color: "#111827",
    lineHeight: 1.15,
    wordBreak: "break-word",
  },
  nameRule: {
    width: "min(420px, 80%)",
    height: "2px",
    margin: "0 auto 16px",
    background: "linear-gradient(90deg, transparent, #c9a24b, transparent)",
  },
  certLine: {
    fontFamily: SERIF,
    fontSize: "clamp(0.85rem, 2.4vw, 1.02rem)",
    color: "#4b4f66",
    maxWidth: "560px",
    margin: "0 auto",
    lineHeight: 1.6,
  },
  certCareer: {
    margin: "10px 0 4px",
    fontFamily: SERIF,
    fontWeight: 700,
    fontSize: "clamp(1.3rem, 4vw, 2.1rem)",
    color: "#3730a3",
    lineHeight: 1.2,
    wordBreak: "break-word",
  },
  certMeta: {
    fontSize: "0.82rem",
    fontWeight: 600,
    letterSpacing: "0.04em",
    color: "#6b6f86",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  footerGrid: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "end",
    gap: "16px",
    marginTop: "24px",
  },
  footerLabel: {
    display: "block",
    fontSize: "0.64rem",
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#8a8da3",
    marginBottom: "4px",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  footerValue: {
    display: "block",
    fontSize: "0.92rem",
    color: "#1e1b4b",
    wordBreak: "break-all",
    fontFamily: SERIF,
  },
  sealWrap: { position: "relative", width: "92px", height: "112px", margin: "0 auto" },
  ribbonL: {
    position: "absolute",
    top: "58px",
    left: "20px",
    width: "22px",
    height: "48px",
    background: "linear-gradient(180deg, #4338ca, #312e81)",
    transform: "rotate(14deg)",
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)",
  },
  ribbonR: {
    position: "absolute",
    top: "58px",
    left: "50px",
    width: "22px",
    height: "48px",
    background: "linear-gradient(180deg, #4338ca, #312e81)",
    transform: "rotate(-14deg)",
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)",
  },
  sealOuter: {
    position: "absolute",
    top: 0,
    left: "6px",
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f6e27a, #c9a24b 50%, #8a6a1c)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(138,106,28,0.35)",
  },
  sealInner: {
    width: "62px",
    height: "62px",
    borderRadius: "50%",
    border: "2px dashed rgba(255,255,255,0.75)",
    background: "radial-gradient(circle at 30% 30%, #fff3b0, #d4af37)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  verify: {
    marginTop: "18px",
    fontSize: "0.7rem",
    color: "#8a8da3",
    wordBreak: "break-all",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  disclaimer: {
    marginTop: "8px",
    fontSize: "0.66rem",
    color: "#9a9db0",
    lineHeight: 1.5,
    maxWidth: "620px",
    marginLeft: "auto",
    marginRight: "auto",
    fontFamily: "Inter, system-ui, sans-serif",
  },
}

export default Certificate