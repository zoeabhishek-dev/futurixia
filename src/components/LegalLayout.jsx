import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, List, Mail } from "lucide-react"
import Logo from "./Logo"
import ContactModal from "./ContactModal"
import { LEGAL } from "../lib/legalInfo"

function Block({ block }) {
  if (typeof block === "string") return <p style={styles.p}>{block}</p>

  if (Array.isArray(block)) {
    return (
      <ul style={styles.ul}>
        {block.map((item) => (
          <li key={item} style={styles.li}>
            {item}
          </li>
        ))}
      </ul>
    )
  }

  if (block && block.note) {
    return (
      <div style={styles.note} role="note">
        {block.note}
      </div>
    )
  }

  if (block && block.table) {
    return (
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {block.table.head.map((h) => (
                <th key={h} style={styles.th} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.table.rows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell, i) => (
                  <td key={i} style={i === 0 ? { ...styles.td, ...styles.tdFirst } : styles.td}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return null
}

function LegalLayout({ title, intro, sections }) {
  const [showContact, setShowContact] = useState(false)

  useEffect(() => {
    document.title = `${title} | Futurixia`
    window.scrollTo(0, 0)
  }, [title])

  return (
    <div style={styles.page}>
      <style>{css}</style>

      <header style={styles.header}>
        <Link to="/" aria-label="Futurixia home" style={{ display: "inline-flex", lineHeight: 0 }}>
          <Logo height={52} mobileHeight={42} />
        </Link>
        <Link to="/" style={styles.backLink}>
          <ArrowLeft size={15} />
          Back to Futurixia
        </Link>
      </header>

      <main style={styles.main}>
        <h1 style={styles.h1}>{title}</h1>
        <p style={styles.updated}>Last updated: {LEGAL.lastUpdated}</p>
        {intro && <p style={styles.intro}>{intro}</p>}

        <details style={styles.toc} className="fx-legal-toc">
          <summary style={styles.tocSummary}>
            <List size={16} />
            On this page
          </summary>
          <ol style={styles.tocList}>
            {sections.map((s) => (
              <li key={s.id} style={styles.tocItem}>
                <a href={`#${s.id}`} className="fx-legal-link">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </details>

        {sections.map((s, index) => (
          <section key={s.id} id={s.id} style={styles.section}>
            <h2 style={styles.h2}>
              <span style={styles.num}>{index + 1}.</span> {s.title}
            </h2>
            {s.body.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </section>
        ))}

        <footer style={styles.footer}>
          <nav style={styles.footerNav} aria-label="Legal">
            <Link to="/privacy" className="fx-legal-link">
              Privacy Policy
            </Link>
            <Link to="/terms" className="fx-legal-link">
              Terms of Service
            </Link>
            <Link to="/founder" className="fx-legal-link">
              Founder
            </Link>
            <button style={styles.contactBtn} onClick={() => setShowContact(true)}>
              <Mail size={15} />
              Contact us
            </button>
          </nav>
          <p style={styles.footerNote}>© {new Date().getFullYear()} Futurixia</p>
        </footer>
      </main>

      <ContactModal mode="general" isOpen={showContact} onClose={() => setShowContact(false)} />
    </div>
  )
}

const css = `
.fx-legal-link { color: #60a5fa; text-decoration: underline; text-underline-offset: 3px; }
.fx-legal-link:hover { color: #93c5fd; }
.fx-legal-toc summary { list-style: none; cursor: pointer; }
.fx-legal-toc summary::-webkit-details-marker { display: none; }
.fx-legal-section-anchor { scroll-margin-top: 16px; }
@media (max-width: 560px) {
  .fx-legal-main { padding: 0 16px 60px !important; }
}
`

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--fx-bg)",
    color: "#ffffff",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  header: {
    maxWidth: "820px",
    margin: "0 auto",
    padding: "20px 20px 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
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
  main: { maxWidth: "820px", margin: "0 auto", padding: "0 20px 80px" },
  h1: { fontSize: "clamp(1.7rem, 5vw, 2.3rem)", fontWeight: 800, margin: "18px 0 6px", lineHeight: 1.2 },
  updated: { color: "var(--fx-muted)", fontSize: "0.86rem", margin: "0 0 14px" },
  intro: { color: "var(--fx-text-2)", fontSize: "1rem", lineHeight: 1.7, margin: "0 0 18px" },
  toc: {
    background: "rgba(255,255,255,0.05)",
    borderRadius: "14px",
    padding: "14px 16px",
    margin: "0 0 28px",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
  },
  tocSummary: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.92rem",
    fontWeight: 700,
    color: "var(--fx-accent-softer)",
  },
  tocList: { margin: "12px 0 0", paddingLeft: "22px", display: "flex", flexDirection: "column", gap: "7px" },
  tocItem: { fontSize: "0.9rem", color: "var(--fx-muted-2)" },
  section: { margin: "0 0 30px", scrollMarginTop: "16px" },
  h2: { fontSize: "1.2rem", fontWeight: 700, margin: "0 0 12px", lineHeight: 1.35 },
  num: { color: "var(--fx-accent-soft)" },
  p: { color: "var(--fx-text-2)", fontSize: "0.96rem", lineHeight: 1.75, margin: "0 0 12px", wordBreak: "break-word" },
  ul: { margin: "0 0 12px", paddingLeft: "22px", display: "flex", flexDirection: "column", gap: "9px" },
  li: { color: "var(--fx-text-2)", fontSize: "0.95rem", lineHeight: 1.7, wordBreak: "break-word" },
  note: {
    background: "rgba(var(--fx-primary-rgb), 0.16)",
    color: "var(--fx-accent-softest)",
    borderRadius: "12px",
    padding: "13px 15px",
    fontSize: "0.93rem",
    lineHeight: 1.65,
    margin: "0 0 12px",
    boxShadow: "inset 0 0 0 1px rgba(var(--fx-primary-rgb), 0.4)",
  },
  tableWrap: { overflowX: "auto", margin: "0 0 14px", borderRadius: "12px", boxShadow: "0 0 0 1px rgba(255,255,255,0.1)" },
  table: { width: "100%", minWidth: "560px", borderCollapse: "collapse", fontSize: "0.88rem" },
  th: { textAlign: "left", padding: "11px 13px", background: "rgba(255,255,255,0.07)", color: "#ffffff", fontWeight: 700 },
  td: { padding: "11px 13px", color: "var(--fx-text-2)", verticalAlign: "top", lineHeight: 1.55, borderTop: "1px solid rgba(255,255,255,0.08)" },
  tdFirst: { color: "#ffffff", fontWeight: 700, whiteSpace: "nowrap" },
  footer: { marginTop: "36px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.1)" },
  footerNav: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "18px", fontSize: "0.9rem" },
  contactBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
    border: "none",
    padding: "9px 16px",
    borderRadius: "30px",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  footerNote: { color: "var(--fx-muted-3)", fontSize: "0.8rem", marginTop: "14px" },
}

export default LegalLayout
