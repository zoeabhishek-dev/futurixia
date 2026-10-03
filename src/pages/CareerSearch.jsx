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
  BarChart3,
  ShieldCheck,
  Palette,
  Cloud,
  Smartphone,
  TrendingUp,
  Landmark,
  Megaphone,
  Users,
  PieChart,
  HeartPulse,
  Pill,
  Building2,
  Zap,
  ChefHat,
  Newspaper,
  PenTool,
  Building,
  Brain,
  Clapperboard,
  Home,
  Shirt,
  Drama,
  PlaneTakeoff,
  Ship,
  LayoutGrid,
  PawPrint,
  Sofa,
  Droplets,
  Gavel,
  Activity,
  HandHeart,
  Trophy,
  Sprout,
  Leaf,
  Radar,
  Flame,
  Calculator,
  Scan,
  Map,
  Hotel,
  Truck,
  ShoppingBag,
  Globe2,
  Music,
  FileCheck2,
  Server,
  CalendarCheck,
  Languages,
  Eye,
  Bird,
  Bug,
  MessageSquare,
  Footprints,
  Mountain,
  Mic2,
  FlaskConical,
  Blocks,
  Wine,
  Receipt,
  Video,
  Database,
  Apple,
  FileSignature,
  Box,
  Swords,
  Gamepad2,
  FileText,
  Bot,
  Dna,
  FileType,
  Trees,
  Telescope,
  Anchor,
  CloudSun,
  Dumbbell,
  Mic,
  KeyRound,
  Smile,
  Film,
  ChartBar,
  Croissant,
  Camera,
  PersonStanding,
  Fish,
  Pickaxe,
} from "lucide-react"
import { Compass } from "lucide-react"
import { supabase } from "../supabaseClient"
import { useMemo } from "react"
import ContactModal from "../components/ContactModal"

const ICONS = {
  Code2, Stethoscope, Rocket, Scale, Plane, Shield, GraduationCap, Wrench,
  BarChart3, ShieldCheck, Palette, Cloud, Smartphone,
  TrendingUp, Landmark, Megaphone, Users, PieChart,
  HeartPulse, Pill, Building2, Zap, ChefHat, Newspaper, PenTool, Building, Brain, Clapperboard,
  Home, Shirt, Drama, PlaneTakeoff, Ship,
  LayoutGrid, PawPrint, Sofa, Droplets, Gavel,
  Activity, HandHeart,
  Trophy, Sprout, Leaf, Radar, Flame,
  Calculator, Scan, Map, Hotel,
  Truck, ShoppingBag, Globe2, Music, FileCheck2,
  Server, CalendarCheck, Languages, Eye, Bird,
  Bug, MessageSquare, Footprints, Mountain, Mic2,
  FlaskConical, Blocks, Wine, Receipt, Video,
  Database, Apple, FileSignature, Box, Swords,
  Gamepad2, FileText, Bot,
  Dna, FileType, Trees, Telescope,
  Anchor, CloudSun, Dumbbell, Mic, KeyRound,
  Smile, Film, ChartBar, Croissant,
  Camera, PersonStanding, Fish, Pickaxe,
}

function CareerSearch() {
  const navigate = useNavigate()
  const [careers, setCareers] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [compareSlugs, setCompareSlugs] = useState([])
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    const checkUserAndLoad = async () => {
      const { data: userData } = await supabase.auth.getUser()
      setIsLoggedIn(!!userData?.user)

      const { data, error } = await supabase
        .from("careers")
        .select("*")
        .order("title")

      if (error) {
        setLoadError(true)
      } else if (data) {
        setCareers(data)
      }
      setLoading(false)
    }

    checkUserAndLoad()
  }, [])

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(careers.map((c) => c.category).filter(Boolean)))],
    [careers]
  )

  const filteredCareers = useMemo(() => {
    const lowerQuery = query.toLowerCase()
    return careers.filter((c) => {
      const matchesQuery =
        c.title.toLowerCase().includes(lowerQuery) ||
        c.category?.toLowerCase().includes(lowerQuery)
      const matchesCategory = activeCategory === "All" || c.category === activeCategory
      return matchesQuery && matchesCategory
    })
  }, [careers, query, activeCategory])

  const toggleCompare = (slug) => {
    setCompareSlugs((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug)
      if (prev.length >= 2) return [prev[1], slug]
      return [...prev, slug]
    })
  }

  return (
    <div style={styles.page}>
      <div className="aurora-bg">
        <div className="aurora-blob blob-a" />
        <div className="aurora-blob blob-b" />
        <div className="aurora-blob blob-c" />
      </div>

      <nav style={styles.nav} className="fx-nav">
        <button
          style={styles.backBtn}
          onClick={() => navigate(isLoggedIn ? "/dashboard" : "/")}
        >
          <ArrowLeft size={16} />
          {isLoggedIn ? "Dashboard" : "Home"}
        </button>
        <div style={styles.logo}>Futurixia</div>
        {isLoggedIn ? (
          <span style={{ width: 110 }} />
        ) : (
          <button style={styles.backBtn} onClick={() => navigate("/login")}>
            Log In
          </button>
        )}
      </nav>

      <div style={styles.content} className="fx-content">
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
          className="fx-search-box"
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

        {!loading && categories.length > 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            style={styles.categoryRow}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  ...styles.categoryPill,
                  ...(activeCategory === cat ? styles.categoryPillActive : {}),
                }}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        )}

        {loading ? (
          <p style={styles.loadingText}>Loading careers...</p>
        ) : loadError ? (
          <p style={styles.loadingText}>
            We could not load careers right now. Please check your connection and try refreshing the page.
          </p>
        ) : (
          <div style={styles.grid} className="fx-career-grid">
            {filteredCareers.map((career, i) => {
              const Icon = ICONS[career.icon_name] || Briefcase
              return (
                <motion.div
                  key={career.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.5) }}
                  whileHover={{ y: -6 }}
                  style={styles.card}
                  className="fx-card"
                  onClick={() => navigate(`/career/${career.slug}`)}
                >
                  <div style={styles.cardTopRow}>
                    <div style={styles.cardIcon}>
                      <Icon size={24} strokeWidth={1.8} />
                    </div>
                    <label
                      style={styles.compareCheckboxLabel}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={compareSlugs.includes(career.slug)}
                        onChange={() => toggleCompare(career.slug)}
                        disabled={!compareSlugs.includes(career.slug) && compareSlugs.length >= 2}
                      />
                      Compare
                    </label>
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
              <div style={styles.noResults}>
                <p>No careers found matching "{query}".</p>
                <button style={styles.requestCareerBtn} onClick={() => setShowRequestModal(true)}>
                  <Compass size={16} />
                  Request This Career
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {compareSlugs.length === 1 && (
        <div style={styles.compareBar}>
          <span style={styles.compareBarText}>
            Select one more career to compare
          </span>
          <button style={styles.compareBarClear} onClick={() => setCompareSlugs([])}>
            Clear
          </button>
        </div>
      )}

      {compareSlugs.length === 2 && (
        <div style={styles.compareBar}>
          <span style={styles.compareBarText}>2 careers selected</span>
          <button
            style={styles.compareBarBtn}
            onClick={() =>
              navigate(`/compare?a=${compareSlugs[0]}&b=${compareSlugs[1]}`)
            }
          >
            Compare Now
          </button>
          <button style={styles.compareBarClear} onClick={() => setCompareSlugs([])}>
            Clear
          </button>
        </div>
      )}

      <ContactModal
        mode="request"
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        initialCareerName={query}
      />
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
    margin: "0 auto 24px",
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
  categoryRow: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "40px",
  },
  categoryPill: {
    background: "rgba(255,255,255,0.06)",
    color: "#c9cbdb",
    border: "none",
    padding: "9px 18px",
    borderRadius: "30px",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
    transition: "background 0.2s ease, color 0.2s ease",
  },
  categoryPillActive: {
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    color: "#ffffff",
    boxShadow: "none",
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
  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "18px",
  },
  compareCheckboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#9599b0",
    fontSize: "0.72rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  compareBar: {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    background: "#0f1120",
    padding: "14px 20px",
    borderRadius: "40px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
    zIndex: 50,
  },
  compareBarText: {
    color: "#c9cbdb",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  compareBarBtn: {
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "30px",
    fontSize: "0.85rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  compareBarClear: {
    background: "rgba(255,255,255,0.08)",
    color: "#e0e1ff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "30px",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
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
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  requestCareerBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    color: "#fff",
    border: "none",
    padding: "12px 24px",
    borderRadius: "30px",
    fontSize: "0.85rem",
    fontWeight: 700,
    cursor: "pointer",
  },
}

export default CareerSearch