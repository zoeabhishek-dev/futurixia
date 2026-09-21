import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Search,
} from "lucide-react"
import { supabase } from "../supabaseClient"
import { scoreCareerMatch } from "../lib/personalization"

const INTEREST_PRESETS = [
  "Technology", "Design", "Business", "Science", "Arts", "Sports",
  "Writing", "Music", "Healthcare", "Law", "Environment", "Finance",
  "Engineering", "Aviation", "Social Work", "Media",
]

const SKILL_PRESETS = [
  "Communication", "Leadership", "Coding", "Public Speaking",
  "Problem Solving", "Teamwork", "Creativity", "Research",
  "Critical Thinking", "Time Management", "Design Tools", "Data Analysis",
]

function DiscoveryChipPicker({ presets, selected, onToggle }) {
  return (
    <div style={styles.chipGrid}>
      {presets.map((item) => {
        const isSelected = selected.includes(item)
        return (
          <button
            type="button"
            key={item}
            onClick={() => onToggle(item)}
            style={{
              ...styles.chip,
              ...(isSelected ? styles.chipActive : {}),
            }}
          >
            {isSelected && <Check size={13} />}
            {item}
          </button>
        )
      })}
    </div>
  )
}

function CareerDiscovery() {
  const navigate = useNavigate()
  const [interests, setInterests] = useState([])
  const [skills, setSkills] = useState([])
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState(null)

  useEffect(() => {
    const prefill = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("interests, skills")
          .eq("id", user.id)
          .maybeSingle()

        if (profileData?.interests) {
          setInterests(
            profileData.interests.split(",").map((v) => v.trim()).filter(Boolean)
          )
        }
        if (profileData?.skills) {
          setSkills(
            profileData.skills.split(",").map((v) => v.trim()).filter(Boolean)
          )
        }
      }

      setLoadingProfile(false)
    }

    prefill()
  }, [])

  const toggleInterest = (item) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    )
  }

  const toggleSkill = (item) => {
    setSkills((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    )
  }

  const findMatches = async () => {
    setSearching(true)
    setResults(null)

    const { data: careers, error } = await supabase.from("careers").select("*")

    if (error || !careers) {
      setResults([])
      setSearching(false)
      return
    }

    const scored = careers
      .map((career) => {
        const { score, reasons } = scoreCareerMatch(interests, skills, career)
        return { career, score, reasons }
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)

    setResults(scored)
    setSearching(false)
  }

  if (loadingProfile) {
    return (
      <div style={styles.centerPage}>
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
          style={{ display: "inline-flex" }}
        >
          <Loader2 size={26} />
        </motion.span>
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

      <nav style={styles.nav}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Back
        </button>
        <div style={styles.logo}>Futurixia</div>
        <span style={{ width: 90 }} />
      </nav>

      <div style={styles.content}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={styles.heading}
        >
          <div style={styles.headingIcon}>
            <Sparkles size={22} />
          </div>
          <h1 style={styles.h1}>Not Sure What You Want to Become?</h1>
          <p style={styles.subtext}>
            Select a few interests and skills, and we will show you careers that
            genuinely match, along with a clear reason for every suggestion.
          </p>
        </motion.div>

        <div style={styles.section}>
          <h3 style={styles.sectionLabel}>Your Interests</h3>
          <DiscoveryChipPicker presets={INTEREST_PRESETS} selected={interests} onToggle={toggleInterest} />
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionLabel}>Your Skills</h3>
          <DiscoveryChipPicker presets={SKILL_PRESETS} selected={skills} onToggle={toggleSkill} />
        </div>

        <div style={styles.actionsRow}>
          <button
            style={styles.findBtn}
            onClick={findMatches}
            disabled={searching || (interests.length === 0 && skills.length === 0)}
          >
            {searching ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                style={{ display: "inline-flex" }}
              >
                <Loader2 size={16} />
              </motion.span>
            ) : (
              <>
                <Search size={16} />
                Find My Career Matches
              </>
            )}
          </button>
          <Link to="/careers" style={styles.skipLink}>
            Skip and browse all careers
          </Link>
        </div>

        {results !== null && (
          <div style={styles.resultsSection}>
            {results.length === 0 ? (
              <p style={styles.noResults}>
                No strong matches found for that combination yet. Try selecting a
                few more interests or skills, or browse the full career list.
              </p>
            ) : (
              <>
                <h3 style={styles.sectionLabel}>Careers That Match You</h3>
                <div style={styles.resultsGrid}>
                  {results.map(({ career, reasons }) => (
                    <motion.div
                      key={career.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      style={styles.resultCard}
                      onClick={() => navigate(`/career/${career.slug}`)}
                    >
                      <span style={styles.resultCategory}>{career.category}</span>
                      <h4 style={styles.resultTitle}>{career.title}</h4>
                      <p style={styles.resultDesc}>{career.short_description}</p>
                      {reasons.length > 0 && (
                        <ul style={styles.resultReasons}>
                          {reasons.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      )}
                      <span style={styles.resultLink}>
                        View Roadmap <ArrowRight size={13} />
                      </span>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
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
  heading: { textAlign: "center", maxWidth: "560px", margin: "20px auto 40px" },
  headingIcon: { display: "flex", alignItems: "center", justifyContent: "center", width: "54px", height: "54px", borderRadius: "16px", background: "rgba(99,102,241,0.16)", color: "#a5b4fc", margin: "0 auto 18px" },
  h1: { fontSize: "1.9rem", fontWeight: 800, marginBottom: "10px" },
  subtext: { color: "#a9adc4", fontSize: "0.98rem", lineHeight: 1.6 },
  section: { marginBottom: "30px" },
  sectionLabel: { fontSize: "0.85rem", fontWeight: 700, color: "#c7d2fe", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "14px" },
  chipGrid: { display: "flex", flexWrap: "wrap", gap: "10px" },
  chip: { display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.06)", color: "#d4d7e5", border: "none", padding: "9px 16px", borderRadius: "30px", fontSize: "0.87rem", cursor: "pointer", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" },
  chipActive: { background: "linear-gradient(90deg, #6366f1, #22d3ee)", color: "#ffffff", boxShadow: "none" },
  actionsRow: { display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", marginTop: "10px", marginBottom: "40px" },
  findBtn: { display: "flex", alignItems: "center", gap: "8px", background: "linear-gradient(90deg, #6366f1, #22d3ee)", color: "#fff", border: "none", padding: "14px 32px", borderRadius: "30px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 12px 30px rgba(99,102,241,0.3)" },
  skipLink: { color: "#9599b0", fontSize: "0.85rem", textDecoration: "underline" },
  resultsSection: { marginTop: "20px" },
  noResults: { textAlign: "center", color: "#9599b0", padding: "20px 0" },
  resultsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" },
  resultCard: { background: "rgba(15,17,32,0.85)", borderRadius: "18px", padding: "24px 22px", cursor: "pointer", boxShadow: "0 0 0 1px rgba(255,255,255,0.09), 0 10px 30px rgba(0,0,0,0.35)" },
  resultCategory: { fontSize: "0.7rem", fontWeight: 700, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.06em" },
  resultTitle: { fontSize: "1.05rem", fontWeight: 700, margin: "8px 0 8px" },
  resultDesc: { color: "#a9adc4", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "12px" },
  resultReasons: { margin: "0 0 14px", paddingLeft: "16px", color: "#c9cbdb", fontSize: "0.8rem", lineHeight: 1.5 },
  resultLink: { display: "inline-flex", alignItems: "center", gap: "6px", color: "#c7d2fe", fontSize: "0.82rem", fontWeight: 700 },
}

export default CareerDiscovery