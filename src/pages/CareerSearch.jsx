import { useState, useEffect, useMemo } from "react"
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
  Compass,
  Check,
  Plus,
  X,
} from "lucide-react"
import { supabase } from "../supabaseClient"
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

const ALIASES = {
  developer: ["developer", "engineer"],
  programmer: ["software", "developer", "engineer"],
  coder: ["software", "developer"],
  physician: ["doctor"],
  attorney: ["lawyer"],
  advocate: ["lawyer"],
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function levenshtein(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost)
    }
    previous = current
  }
  return previous[b.length]
}

function tokenScore(token, entry) {
  const options = ALIASES[token] ? [token, ...ALIASES[token]] : [token]
  let best = 0

  options.forEach((t) => {
    if (entry.titleWords.some((w) => w.startsWith(t))) best = Math.max(best, 4)
    else if (entry.title.includes(t)) best = Math.max(best, 3)
    else if (entry.category.includes(t)) best = Math.max(best, 2)
    else if (entry.description.includes(t)) best = Math.max(best, 1)
  })

  if (best > 0) return best

  const allowed = token.length >= 8 ? 2 : token.length >= 4 ? 1 : 0
  if (allowed > 0) {
    const words = [...entry.titleWords, ...entry.categoryWords]
    const close = words.some(
      (w) => Math.abs(w.length - token.length) <= allowed && levenshtein(w, token) <= allowed
    )
    if (close) return 1
  }

  return 0
}

function similarity(tokens, entry) {
  let best = 0
  tokens.forEach((token) => {
    entry.titleWords.forEach((word) => {
      const longest = Math.max(word.length, token.length)
      if (longest === 0) return
      best = Math.max(best, 1 - levenshtein(word, token) / longest)
    })
  })
  return best
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

      const { data, error } = await supabase.from("careers").select("*").order("title")

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

  const index = useMemo(
    () =>
      careers.map((career) => {
        const title = normalize(career.title)
        const category = normalize(career.category)
        return {
          career,
          title,
          titleWords: title.split(" ").filter(Boolean),
          category,
          categoryWords: category.split(" ").filter(Boolean),
          description: normalize(career.short_description),
        }
      }),
    [careers]
  )

  const tokens = useMemo(() => normalize(query).split(" ").filter(Boolean), [query])

  const filteredCareers = useMemo(() => {
    const inCategory = index.filter(
      (entry) => activeCategory === "All" || entry.career.category === activeCategory
    )

    if (tokens.length === 0) return inCategory.map((entry) => entry.career)

    return inCategory
      .map((entry) => {
        let total = 0
        for (const token of tokens) {
          const score = tokenScore(token, entry)
          if (score === 0) return null
          total += score
        }
        return { entry, total }
      })
      .filter(Boolean)
      .sort((a, b) => b.total - a.total || a.entry.title.localeCompare(b.entry.title))
      .map((item) => item.entry.career)
  }, [index, tokens, activeCategory])

  const suggestions = useMemo(() => {
    if (filteredCareers.length > 0 || tokens.length === 0) return []
    return index
      .map((entry) => ({ entry, sim: similarity(tokens, entry) }))
      .filter((item) => item.sim >= 0.45)
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 3)
      .map((item) => item.entry.career)
  }, [filteredCareers, index, tokens])

  const selectedCareers = compareSlugs
    .map((slug) => careers.find((c) => c.slug === slug))
    .filter(Boolean)

  const toggleCompare = (slug) => {
    setCompareSlugs((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug)
      if (prev.length >= 2) return [prev[1], slug]
      return [...prev, slug]
    })
  }

  const removeCompare = (slug) => setCompareSlugs((prev) => prev.filter((s) => s !== slug))

  const isFiltering = tokens.length > 0 || activeCategory !== "All"

  return (
    <div style={styles.page}>
      <style>{css}</style>

      <div className="aurora-bg">
        <div className="aurora-blob blob-a" />
        <div className="aurora-blob blob-b" />
        <div className="aurora-blob blob-c" />
      </div>

      <nav style={styles.nav} className="fx-nav">
        <button style={styles.backBtn} onClick={() => navigate(isLoggedIn ? "/dashboard" : "/")}>
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
          <p style={styles.subtext}>Search any career and get a personalized, step-by-step roadmap.</p>
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
            aria-label="Search careers"
          />
          {query && (
            <button style={styles.clearBtn} onClick={() => setQuery("")} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
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

        {!loading && !loadError && isFiltering && filteredCareers.length > 0 && (
          <p style={styles.resultCount} role="status">
            {filteredCareers.length} {filteredCareers.length === 1 ? "career" : "careers"} found
          </p>
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
              const selected = compareSlugs.includes(career.slug)
              return (
                <motion.div
                  key={career.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.5) }}
                  whileHover={{ y: -6 }}
                  style={{ ...styles.card, ...(selected ? styles.cardSelected : {}) }}
                  className="fx-card"
                  onClick={() => navigate(`/career/${career.slug}`)}
                >
                  <div style={styles.cardTopRow}>
                    <div style={styles.cardIcon}>
                      <Icon size={24} strokeWidth={1.8} />
                    </div>

                    <button
                      type="button"
                      className={`fxs-chip ${selected ? "fxs-chip-on" : ""}`}
                      style={{ ...styles.chip, ...(selected ? styles.chipOn : {}) }}
                      aria-pressed={selected}
                      aria-label={
                        selected
                          ? `Remove ${career.title} from compare`
                          : `Add ${career.title} to compare`
                      }
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleCompare(career.slug)
                      }}
                    >
                      <span style={{ ...styles.chipIcon, ...(selected ? styles.chipIconOn : {}) }}>
                        {selected ? <Check size={11} strokeWidth={3} /> : <Plus size={11} strokeWidth={3} />}
                      </span>
                      {selected ? "Added" : "Compare"}
                    </button>
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
                <p>
                  {query.trim()
                    ? `No careers found for "${query.trim()}".`
                    : "No careers in this category yet."}
                </p>

                {suggestions.length > 0 && (
                  <div style={styles.suggestBox}>
                    <span style={styles.suggestLabel}>Did you mean</span>
                    <div style={styles.suggestRow}>
                      {suggestions.map((s) => (
                        <button
                          key={s.id}
                          style={styles.suggestBtn}
                          onClick={() => {
                            setQuery(s.title)
                            setActiveCategory("All")
                          }}
                        >
                          {s.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button style={styles.requestCareerBtn} onClick={() => setShowRequestModal(true)}>
                  <Compass size={16} />
                  Request This Career
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {compareSlugs.length > 0 && (
        <div style={styles.compareBar} className="fxs-bar" role="region" aria-label="Compare careers">
          <div style={styles.barChips}>
            {selectedCareers.map((c) => (
              <span key={c.slug} style={styles.barChip}>
                {c.title}
                <button
                  style={styles.barChipX}
                  onClick={() => removeCompare(c.slug)}
                  aria-label={`Remove ${c.title}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {compareSlugs.length === 1 && <span style={styles.barHint}>Pick one more career</span>}
          </div>

          <div style={styles.barActions}>
            <button style={styles.compareBarClear} onClick={() => setCompareSlugs([])}>
              Clear
            </button>
            <button
              style={{ ...styles.compareBarBtn, ...(compareSlugs.length < 2 ? styles.barBtnOff : {}) }}
              disabled={compareSlugs.length < 2}
              onClick={() => navigate(`/compare?a=${compareSlugs[0]}&b=${compareSlugs[1]}`)}
            >
              Compare Now
              <ArrowRight size={15} />
            </button>
          </div>
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

const css = `
.fxs-chip { transition: background 0.2s ease, box-shadow 0.2s ease, color 0.2s ease, transform 0.15s ease; }
.fxs-chip:hover { background: rgba(99,102,241,0.22) !important; color: #ffffff !important; }
.fxs-chip:active { transform: scale(0.96); }
.fxs-chip-on:hover { background: linear-gradient(90deg, #6366f1, #22d3ee) !important; }
.fxs-chip:focus-visible { outline: 2px solid #22d3ee; outline-offset: 2px; }
@media (max-width: 640px) {
  .fxs-bar { left: 12px !important; right: 12px !important; transform: none !important; width: auto !important; bottom: calc(12px + env(safe-area-inset-bottom, 0px)) !important; flex-direction: column; align-items: stretch !important; border-radius: 22px !important; }
}
@media (prefers-reduced-motion: reduce) { .fxs-chip { transition: none; } }
`

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
    padding: "20px 24px 120px",
  },
  heading: { textAlign: "center", maxWidth: "560px", margin: "30px auto 40px" },
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
  h1: { fontSize: "2.1rem", fontWeight: 800, marginBottom: "10px" },
  subtext: { color: "#a9adc4", fontSize: "1rem", lineHeight: 1.5 },
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
    minWidth: 0,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#fff",
    fontSize: "0.95rem",
  },
  clearBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
  },
  categoryRow: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "30px",
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
  resultCount: { textAlign: "center", color: "#9599b0", fontSize: "0.82rem", marginBottom: "22px" },
  loadingText: { textAlign: "center", color: "#9599b0" },
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
  cardSelected: {
    boxShadow: "0 0 0 2px rgba(34,211,238,0.7), 0 0 28px rgba(34,211,238,0.18), 0 10px 40px rgba(0,0,0,0.35)",
  },
  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "18px",
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    background: "rgba(255,255,255,0.07)",
    color: "#c9cbdb",
    border: "none",
    padding: "6px 12px 6px 7px",
    borderRadius: "30px",
    fontSize: "0.72rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)",
    fontFamily: "inherit",
  },
  chipOn: {
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    color: "#ffffff",
    boxShadow: "0 4px 14px rgba(34,211,238,0.28)",
  },
  chipIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.14)",
  },
  chipIconOn: { background: "rgba(255,255,255,0.28)" },
  compareBar: {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    background: "rgba(15,17,32,0.96)",
    backdropFilter: "blur(14px)",
    padding: "12px 14px 12px 18px",
    borderRadius: "40px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.12)",
    zIndex: 50,
    maxWidth: "calc(100vw - 24px)",
  },
  barChips: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", minWidth: 0 },
  barChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(99,102,241,0.22)",
    color: "#e0e1ff",
    fontSize: "0.8rem",
    fontWeight: 700,
    padding: "7px 8px 7px 14px",
    borderRadius: "30px",
  },
  barChipX: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.14)",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    padding: 0,
  },
  barHint: { color: "#9599b0", fontSize: "0.8rem", fontWeight: 600 },
  barActions: { display: "flex", alignItems: "center", gap: "10px", justifyContent: "flex-end" },
  compareBarBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "30px",
    fontSize: "0.85rem",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  barBtnOff: { opacity: 0.4, cursor: "not-allowed" },
  compareBarClear: {
    background: "rgba(255,255,255,0.08)",
    color: "#e0e1ff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "30px",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
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
  },
  cardCategory: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#a5b4fc",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  cardTitle: { fontSize: "1.15rem", fontWeight: 700, margin: "8px 0 8px" },
  cardDesc: { color: "#a9adc4", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: "18px" },
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
    gap: "18px",
  },
  suggestBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" },
  suggestLabel: {
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#a5b4fc",
  },
  suggestRow: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" },
  suggestBtn: {
    background: "rgba(99,102,241,0.2)",
    color: "#e0e1ff",
    border: "none",
    padding: "9px 18px",
    borderRadius: "30px",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
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
    fontFamily: "inherit",
  },
}

export default CareerSearch