import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Search,
  Code2,
  Stethoscope,
  Rocket,
  Scale,
  Plane,
  Shield,
  GraduationCap,
  Wrench,
  ArrowRight,
  ArrowLeft,
  Briefcase,
} from "lucide-react"
import { supabase } from "../supabaseClient"

const ICONS = {
  Code2, Stethoscope, Rocket, Scale, Plane, Shield, GraduationCap, Wrench,
}

function CareerSearch() {
  const navigate = useNavigate()
  const [careers, setCareers] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  useEffect(() => {
    const checkUserAndLoad = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) {
        navigate("/login")
        return
      }

      const { data, error } = await supabase
        .from("careers")
        .select("*")
        .order("title")

      if (!error && data) {
        setCareers(data)
      }
      setLoading(false)
    }

    checkUserAndLoad()
  }, [navigate])

  const filteredCareers = careers.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.category?.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div style={styles.page}>
      <div className="aurora-bg">
        <div className="aurora-blob blob-a" />
        <div className="aurora-blob blob-b" />
        <div className="aurora-blob blob-c" />
      </div>

      <nav style={styles.nav}>
        <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={16} />
          Dashboard
        </button>
        <div style={styles.logo}>Futurixia</div>
        <span style={{ width: 110 }} />
      </nav>

      <div style={styles.content}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={styles.heading}
        >
          <div style={styles.headingIcon}>
            <Briefcase size={22} />
          </div>
          <h1 style={styles.h1}>Find Your Dream Career</h1>
          <p style={styles.subtext}>
            Search any career and get a personalized, step-by-step roadmap.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={styles.searchBox}
        >
          <Search size={18} color="#9599b0" />
          <input
            type="text"
            placeholder="Search careers (e.g. Doctor, Software Engineer, Pilot...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={styles.searchInput}
          />
        </motion.div>

        {loading ? (
          <p style={styles.loadingText}>Loading careers...</p>
        ) : (
          <div style={styles.grid}>
            {filteredCareers.map((career, i) => {
              const Icon = ICONS[career.icon_name] || Briefcase
              return (
                <motion.div
                  key={career.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  whileHover={{ y: -6 }}
                  style={styles.card}
                  onClick={() => navigate(`/career/${career.slug}`)}
                >
                  <div style={styles.cardIcon}>
                    <Icon size={24} strokeWidth={1.8} />
                  </div>
                  <span style={styles.cardCategory}>{career.category}</span>
                  <h3 style={styles.cardTitle}>{career.title}</h3>
                  <p style={styles.cardDesc}>{career.short_description}</p>
                  <span style={styles.cardLink}>
                    View Roadmap <ArrowRight size={14} />
                  </span>
                </motion.div>
              )
            })}

            {filteredCareers.length === 0 && (
              <p style={styles.noResults}>
                No careers found matching "{query}". More careers are being added soon!
              </p>
            )}
          </div>
        )}
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
    overflow: "hidden",
  },
  nav: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "22px 40px",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(255,255,255,0.07)",
    color: "#d4d7e5",
    border: "none",
    padding: "10px 18px",
    borderRadius: "30px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  logo: {
    fontSize: "1.3rem",
    fontWeight: 800,
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  content: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "20px 24px 80px",
  },
  heading: {
    textAlign: "center",
    maxWidth: "560px",
    margin: "30px auto 40px",
  },
  headingIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "54px",
    height: "54px",
    borderRadius: "16px",
    background: "rgba(99,102,241,0.16)",
    color: "#a5b4fc",
    margin: "0 auto 18px",
  },
  h1: {
    fontSize: "2.1rem",
    fontWeight: 800,
    marginBottom: "10px",
  },
  subtext: {
    color: "#a9adc4",
    fontSize: "1rem",
    lineHeight: 1.5,
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    maxWidth: "560px",
    margin: "0 auto 50px",
    background: "rgba(255,255,255,0.07)",
    borderRadius: "30px",
    padding: "16px 24px",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
  },
  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#fff",
    fontSize: "0.95rem",
  },
  loadingText: {
    textAlign: "center",
    color: "#9599b0",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "24px",
  },
    card: {
    background: "rgba(15,17,32,0.85)",
    borderRadius: "20px",
    padding: "30px 26px",
    cursor: "pointer",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.09), 0 10px 40px rgba(0,0,0,0.35)",
    transition: "box-shadow 0.3s ease",
  },
  cardIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "rgba(34,211,238,0.14)",
    color: "#99f6ff",
    marginBottom: "18px",
  },
  cardCategory: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#a5b4fc",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  cardTitle: {
    fontSize: "1.15rem",
    fontWeight: 700,
    margin: "8px 0 8px",
  },
  cardDesc: {
    color: "#a9adc4",
    fontSize: "0.88rem",
    lineHeight: 1.5,
    marginBottom: "18px",
  },
  cardLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: "#c7d2fe",
    fontSize: "0.85rem",
    fontWeight: 700,
  },
  noResults: {
    gridColumn: "1 / -1",
    textAlign: "center",
    color: "#9599b0",
    padding: "40px 0",
  },
}

export default CareerSearch