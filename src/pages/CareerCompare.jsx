import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, Scale, Search, X } from "lucide-react"
import { supabase } from "../supabaseClient"

const FIELDS = [
  { key: "category", label: "Category" },
  { key: "short_description", label: "What They Do" },
  { key: "education_requirements", label: "Education Requirements" },
  { key: "exams_licensing", label: "Exams & Licensing" },
  { key: "core_skills", label: "Core Skills" },
  { key: "work_environment", label: "Work Areas" },
  { key: "career_progression", label: "Career Progression" },
  { key: "alternative_paths", label: "Related / Alternative Paths" },
]

function CareerCompare() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [allCareers, setAllCareers] = useState([])
  const [loading, setLoading] = useState(true)
  const [careerA, setCareerA] = useState(null)
  const [careerB, setCareerB] = useState(null)
  const [pickerOpenFor, setPickerOpenFor] = useState(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("careers").select("*").order("title")
      if (data) {
        setAllCareers(data)

        const slugA = searchParams.get("a")
        const slugB = searchParams.get("b")
        if (slugA) setCareerA(data.find((c) => c.slug === slugA) || null)
        if (slugB) setCareerB(data.find((c) => c.slug === slugB) || null)
      }
      setLoading(false)
    }
    load()
  }, [searchParams])

  const filteredPickerList = allCareers.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  )

  const selectCareer = (career) => {
    if (pickerOpenFor === "A") setCareerA(career)
    if (pickerOpenFor === "B") setCareerB(career)
    setPickerOpenFor(null)
    setQuery("")
  }

  const renderSlot = (career, slotLabel) => {
    if (!career) {
      return (
        <button style={styles.emptySlot} onClick={() => setPickerOpenFor(slotLabel)}>
          <Search size={20} color="#9599b0" />
          <span>Choose a career</span>
        </button>
      )
    }
    return (
      <div style={styles.filledSlot}>
        <h3 style={styles.slotTitle}>{career.title}</h3>
        <button
          style={styles.changeBtn}
          onClick={() => {
            if (slotLabel === "A") setCareerA(null)
            else setCareerB(null)
          }}
        >
          Change
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={styles.centerPage}>
        <p>Loading careers...</p>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div className="aurora-bg">
        <div className="aurora-blob blob-a" />
        <div className="aurora-blob blob-b" />
        <div className="aurora-blob blob-c" />
      </div>

      <nav style={styles.nav} className="fx-nav">
        <button style={styles.backBtn} onClick={() => navigate("/careers")}>
          <ArrowLeft size={16} />
          All Careers
        </button>
        <div style={styles.logo}>Futurixia</div>
        <span style={{ width: 110 }} />
      </nav>

      <div style={styles.content} className="fx-content">
        <div style={styles.heading}>
          <div style={styles.headingIcon}>
            <Scale size={22} />
          </div>
          <h1 style={styles.h1}>Compare Two Careers</h1>
          <p style={styles.subtext}>
            See the facts side by side. We don't tell you which one is "better",
            just what's actually different.
          </p>
        </div>

        <div style={styles.slotsRow} className="fx-compare-slots">
          {renderSlot(careerA, "A")}
          <div style={styles.vsText} className="fx-compare-vs">vs</div>
          {renderSlot(careerB, "B")}
        </div>

        {careerA && careerB && (
          <div style={styles.table}>
            {FIELDS.map((field) => (
              <div key={field.key} style={styles.row}>
                <span style={styles.rowLabel}>{field.label}</span>
                <div style={styles.rowValues}>
                  <p style={styles.cell}>
                    {careerA[field.key] || "Not available yet for this career"}
                  </p>
                  <p style={{ ...styles.cell, ...styles.cellRight }}>
                    {careerB[field.key] || "Not available yet for this career"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {(!careerA || !careerB) && (
          <p style={styles.hintText}>
            Choose two careers above to see their full comparison.
          </p>
        )}
      </div>

      {pickerOpenFor && (
        <div style={styles.overlay} onClick={() => setPickerOpenFor(null)}>
          <div style={styles.pickerCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.pickerHeader}>
              <h3>Choose a Career</h3>
              <button style={styles.closeBtn} onClick={() => setPickerOpenFor(null)}>
                <X size={18} />
              </button>
            </div>
            <input
              autoFocus
              type="text"
              placeholder="Search careers..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={styles.pickerInput}
            />
            <div style={styles.pickerList}>
              {filteredPickerList.map((c) => (
                <button
                  key={c.id}
                  style={styles.pickerItem}
                  onClick={() => selectCareer(c)}
                >
                  <span>{c.title}</span>
                  <span style={styles.pickerItemCategory}>{c.category}</span>
                </button>
              ))}
              {filteredPickerList.length === 0 && (
                <p style={{ color: "#9599b0", padding: "16px", textAlign: "center" }}>
                  No careers found.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { position: "relative", minHeight: "100vh", background: "#05070f", color: "#fff", fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden" },
  centerPage: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#05070f", color: "#fff" },
  nav: { position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 40px" },
  backBtn: { display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.07)", color: "#d4d7e5", border: "none", padding: "10px 18px", borderRadius: "30px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 },
  logo: { fontSize: "1.3rem", fontWeight: 800, background: "linear-gradient(90deg, #6366f1, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  content: { position: "relative", zIndex: 1, maxWidth: "800px", margin: "0 auto", padding: "20px 24px 100px" },
  heading: { textAlign: "center", maxWidth: "560px", margin: "20px auto 36px" },
  headingIcon: { display: "flex", alignItems: "center", justifyContent: "center", width: "54px", height: "54px", borderRadius: "16px", background: "rgba(99,102,241,0.16)", color: "#a5b4fc", margin: "0 auto 18px" },
  h1: { fontSize: "1.8rem", fontWeight: 800, marginBottom: "10px" },
  subtext: { color: "#a9adc4", fontSize: "0.95rem", lineHeight: 1.6 },
  slotsRow: { display: "flex", alignItems: "stretch", gap: "16px", marginBottom: "36px", flexWrap: "wrap", justifyContent: "center" },
  emptySlot: { display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.05)", border: "2px dashed rgba(255,255,255,0.15)", borderRadius: "18px", padding: "30px 40px", cursor: "pointer", color: "#c9cbdb", fontSize: "0.9rem", fontWeight: 600, flex: "1 1 220px" },
  filledSlot: { display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", background: "rgba(99,102,241,0.1)", borderRadius: "18px", padding: "26px 30px", flex: "1 1 220px", textAlign: "center" },
  slotTitle: { fontSize: "1.1rem", fontWeight: 800, color: "#fff" },
  changeBtn: { background: "rgba(255,255,255,0.09)", color: "#e0e1ff", border: "none", padding: "6px 16px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" },
  vsText: {
    color: "#9599b0",
    fontWeight: 700,
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    padding: "0 4px",
  },
  table: { display: "flex", flexDirection: "column", gap: "4px" },
  row: { background: "rgba(255,255,255,0.03)", borderRadius: "14px", padding: "16px 20px" },
  rowLabel: { fontSize: "0.78rem", fontWeight: 700, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "10px", textAlign: "center" },
  rowValues: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    position: "relative",
  },
  cell: {
    color: "#c9cbdb",
    fontSize: "0.86rem",
    lineHeight: 1.6,
    margin: 0,
  },
  cellRight: {
    borderLeft: "1px solid rgba(255,255,255,0.35)",
    paddingLeft: "20px",
  },
  hintText: { textAlign: "center", color: "#9599b0", padding: "20px 0" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 150, padding: "20px" },
  pickerCard: { background: "#0f1120", borderRadius: "22px", padding: "24px", maxWidth: "420px", width: "100%", maxHeight: "70vh", display: "flex", flexDirection: "column", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" },
  pickerHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" },
  closeBtn: { background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" },
  pickerInput: { width: "100%", background: "rgba(255,255,255,0.07)", border: "none", outline: "none", color: "#fff", fontSize: "0.9rem", padding: "12px 16px", borderRadius: "14px", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)", marginBottom: "12px", fontFamily: "inherit" },
  pickerList: { overflowY: "auto", flex: 1 },
  pickerItem: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "transparent", border: "none", color: "#e0e1ff", padding: "12px 10px", borderRadius: "10px", cursor: "pointer", fontSize: "0.88rem", textAlign: "left" },
  pickerItemCategory: { color: "#7d8299", fontSize: "0.75rem" },
}

export default CareerCompare