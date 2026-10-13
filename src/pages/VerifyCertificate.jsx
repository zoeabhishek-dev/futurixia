import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, ShieldCheck, ShieldX, Search, Loader2, AlertTriangle } from "lucide-react"
import { supabase } from "../supabaseClient"

function VerifyCertificate() {
  const { certId } = useParams()
  const [input, setInput] = useState(certId || "")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState("idle")
  const [data, setData] = useState(null)

  const verify = async (rawId) => {
    const id = (rawId || "").trim()
    if (!id) return
    setLoading(true)
    setResult("idle")
    setData(null)

    const { data: rows, error } = await supabase.rpc("verify_certificate", { p_id: id })

    setLoading(false)

    if (error) {
      setResult("error")
      return
    }
    if (rows && rows.length > 0) {
      setData(rows[0])
      setResult("valid")
    } else {
      setResult("invalid")
    }
  }

  useEffect(() => {
    if (certId) {
      setInput(certId)
      verify(certId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certId])

  const handleSubmit = (e) => {
    e.preventDefault()
    verify(input)
  }

  return (
    <div style={styles.page}>
      <div className="aurora-bg">
        <div className="aurora-blob blob-a" />
        <div className="aurora-blob blob-b" />
        <div className="aurora-blob blob-c" />
      </div>

      <div style={styles.card}>
        <Link to="/" style={styles.backLink}>
          <ArrowLeft size={15} />
          Back to home
        </Link>

        <div style={styles.logo}>Futurixia</div>
        <h1 style={styles.title}>Verify a Certificate</h1>
        <p style={styles.subtitle}>
          Enter the certificate ID printed on a Futurixia certificate to confirm it is genuine.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={styles.inputWrap}>
            <Search size={17} color="#9599b0" />
            <input
              type="text"
              placeholder="For example FX-3A9C0B7D12EF"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={styles.input}
              aria-label="Certificate ID"
            />
          </div>
          <button
            type="submit"
            style={{ ...styles.primaryBtn, ...(loading ? styles.btnDisabled : {}) }}
            disabled={loading}
          >
            {loading ? <Loader2 size={18} style={{ animation: "fxspin 0.9s linear infinite" }} /> : "Verify"}
          </button>
          <style>{`@keyframes fxspin { to { transform: rotate(360deg); } }`}</style>
        </form>

        {result === "valid" && data && (
          <div style={styles.validBox} role="status">
            <div style={styles.resultHead}>
              <ShieldCheck size={22} color="#4ade80" />
              <strong style={{ color: "#4ade80" }}>This certificate is genuine</strong>
            </div>
            <p style={styles.line}>
              <span style={styles.label}>Awarded to</span>
              {data.student_name}
            </p>
            <p style={styles.line}>
              <span style={styles.label}>Career roadmap</span>
              {data.career_title}
            </p>
            <p style={styles.line}>
              <span style={styles.label}>Steps completed</span>
              {data.total_steps} of {data.total_steps}
            </p>
            <p style={styles.line}>
              <span style={styles.label}>Date issued</span>
              {new Date(data.issued_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        )}

        {result === "invalid" && (
          <div style={styles.invalidBox} role="alert">
            <div style={styles.resultHead}>
              <ShieldX size={22} color="#ff9b9b" />
              <strong style={{ color: "#ff9b9b" }}>No certificate found</strong>
            </div>
            <p style={styles.smallText}>
              Please check the ID for typing mistakes and try again.
            </p>
          </div>
        )}

        {result === "error" && (
          <div style={styles.invalidBox} role="alert">
            <div style={styles.resultHead}>
              <AlertTriangle size={22} color="#fbbf24" />
              <strong style={{ color: "#fbbf24" }}>Could not check right now</strong>
            </div>
            <p style={styles.smallText}>Please check your connection and try again.</p>
          </div>
        )}

        <p style={styles.disclaimer}>
          A Futurixia certificate recognises completion of a self-guided learning roadmap. It is not
          a professional licence or an academic qualification.
        </p>
      </div>
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
    maxWidth: "460px",
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
  primaryBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: "16px",
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
  validBox: {
    marginTop: "22px",
    background: "rgba(74,222,128,0.08)",
    borderRadius: "16px",
    padding: "18px 20px",
  },
  invalidBox: {
    marginTop: "22px",
    background: "rgba(255,155,155,0.08)",
    borderRadius: "16px",
    padding: "18px 20px",
  },
  resultHead: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" },
  line: { fontSize: "0.95rem", color: "#fff", margin: "8px 0", lineHeight: 1.4 },
  label: {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#9599b0",
    marginBottom: "2px",
  },
  smallText: { color: "#c9cbdb", fontSize: "0.85rem", lineHeight: 1.5 },
  disclaimer: { color: "#7d8299", fontSize: "0.72rem", lineHeight: 1.5, marginTop: "22px" },
}

export default VerifyCertificate