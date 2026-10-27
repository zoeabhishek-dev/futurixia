import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  LogOut,
  AlertTriangle,
  Compass,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  Target,
  Trophy,
  CheckCircle2,
  Award,
  Lock,
  HelpCircle,
  Lightbulb,
  UserCircle,
  FileText,
  Scale,
  ListChecks,
  Crown,
} from "lucide-react"
import { supabase } from "../supabaseClient"
import { getPersonalizedRoadmap } from "../lib/personalization"
import ContactModal from "../components/ContactModal"
import PricingModal from "../components/PricingModal"

const PLAN_LABELS = { free: "Free plan", pro: "Pro plan", pro_max: "Pro Max plan" }

function greetingFor(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function relativeDay(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((startOf(new Date()) - startOf(d)) / 86400000)
  if (days <= 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

function Ring({ percent }) {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" role="img" aria-label={`${percent} percent complete`}>
      <defs>
        <linearGradient id="fxRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
      <circle
        cx="44"
        cy="44"
        r={radius}
        fill="none"
        stroke="url(#fxRing)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - (circumference * percent) / 100}
        transform="rotate(-90 44 44)"
      />
      <text x="44" y="49" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="800">
        {percent}%
      </text>
    </svg>
  )
}

function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [profile, setProfile] = useState(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showPricing, setShowPricing] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [activeCareer, setActiveCareer] = useState(null)
  const [progressPercent, setProgressPercent] = useState(0)
  const [stepCounts, setStepCounts] = useState({ done: 0, total: 0 })
  const [nextStep, setNextStep] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [recommendedProjects, setRecommendedProjects] = useState([])
  const [completionHistory, setCompletionHistory] = useState([])
  const [totalDone, setTotalDone] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user

        if (!user) {
          navigate("/login")
          return
        }

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle()

        if (!profileData) {
          navigate("/create-profile")
          return
        }

        setProfile(profileData)

        const { data: allProgress } = await supabase
          .from("user_progress")
          .select("step_id, completed_at")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false })

        setTotalDone(allProgress ? allProgress.length : 0)

        if (allProgress && allProgress.length > 0) {
          const mostRecentStepId = allProgress[0].step_id

          const { data: mostRecentStep } = await supabase
            .from("roadmap_steps")
            .select("career_id")
            .eq("id", mostRecentStepId)
            .maybeSingle()

          if (mostRecentStep?.career_id) {
            const { data: careerData } = await supabase
              .from("careers")
              .select("*")
              .eq("id", mostRecentStep.career_id)
              .maybeSingle()

            const { data: allSteps } = await supabase
              .from("roadmap_steps")
              .select("*")
              .eq("career_id", mostRecentStep.career_id)
              .order("step_order")

            if (careerData && allSteps) {
              setActiveCareer(careerData)

              const { introSteps, coreSteps } = getPersonalizedRoadmap(profileData, allSteps)
              const combined = [...introSteps, ...coreSteps]

              const careerStepIds = new Set(combined.map((s) => s.id))
              const completedIdsForCareer = new Set(
                allProgress.map((p) => p.step_id).filter((id) => careerStepIds.has(id))
              )

              const total = combined.length
              const completedCount = completedIdsForCareer.size
              const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0

              setProgressPercent(percent)
              setStepCounts({ done: completedCount, total })

              const upcoming = combined.find((s) => !completedIdsForCareer.has(s.id))
              setNextStep(upcoming || null)

              const stepLookup = {}
              combined.forEach((s) => {
                stepLookup[s.id] = s
              })

              const activity = allProgress
                .filter((p) => careerStepIds.has(p.step_id))
                .slice(0, 5)
                .map((p) => ({
                  title: stepLookup[p.step_id]?.title || "Step",
                  completed_at: p.completed_at,
                }))

              setRecentActivity(activity)

              const { data: careerProjects } = await supabase
                .from("career_projects")
                .select("*, projects(*)")
                .eq("career_id", mostRecentStep.career_id)

              if (careerProjects && careerProjects.length > 0) {
                setRecommendedProjects(careerProjects.map((cp) => cp.projects).filter(Boolean))
              }
            }
          }
        }
      } catch (err) {
        setLoadError(true)
      }

      try {
        const { data: userDataForHistory } = await supabase.auth.getUser()
        const userForHistory = userDataForHistory?.user

        if (userForHistory) {
          const { data: completions } = await supabase
            .from("roadmap_completions")
            .select("*, careers(title, slug)")
            .eq("user_id", userForHistory.id)
            .order("completed_at", { ascending: false })

          if (completions) {
            setCompletionHistory(completions)
          }
        }
      } catch (historyErr) {
        // History is optional and should not block the dashboard.
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [navigate])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/")
  }

  const startTour = () => {
    window.dispatchEvent(new Event("fx-start-tour"))
  }

  if (loading) {
    return (
      <div style={styles.center}>
        <p>Loading your dashboard...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div style={styles.center}>
        <p style={{ maxWidth: 320, textAlign: "center", color: "#a9adc4" }}>
          We could not load your dashboard right now. Please check your connection and try
          refreshing the page.
        </p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={styles.center}>
        <p>Unable to load your profile. Please log in again.</p>
      </div>
    )
  }

  const interestTags = profile.interests?.split(", ").filter(Boolean) || []
  const skillTags = profile.skills?.split(", ").filter(Boolean) || []
  const tier = profile.subscription_tier || "free"
  const firstName = (profile.full_name || "").trim().split(" ")[0] || "there"
  const isNewStudent = totalDone === 0 && completionHistory.length === 0
  const headline = isNewStudent ? "Welcome" : greetingFor()

  const stats = [
    { icon: ListChecks, value: totalDone, label: "Steps completed", color: "#67e8f9" },
    { icon: Trophy, value: completionHistory.length, label: "Roadmaps completed", color: "#fde047" },
    { icon: Target, value: activeCareer ? `${progressPercent}%` : "0%", label: "Current progress", color: "#a5b4fc" },
    { icon: TrendingUp, value: skillTags.length, label: "Skills listed", color: "#86efac" },
  ]

  const tiles = [
    { to: "/careers", icon: Compass, title: "Explore Careers", sub: "Browse 100+ careers" },
    { to: "/discover", icon: Lightbulb, title: "Discovery Quiz", sub: "Find careers that fit you" },
    { to: "/compare", icon: Scale, title: "Compare Careers", sub: "Two careers side by side" },
    { to: "/report", icon: FileText, title: "My Report", sub: "Printable career report" },
    { to: "/coach", icon: Sparkles, title: "Smart Coach", sub: "Study plan and reminders", locked: tier !== "pro_max" },
    { to: "/create-profile", icon: UserCircle, title: "Edit Profile", sub: "Update interests and skills" },
  ]

  return (
    <div style={styles.page}>
      <style>{css}</style>

      <nav style={styles.nav} className="fxd-nav">
        <div style={styles.logo}>Futurixia</div>

        <div style={styles.navActions}>
          <button style={styles.tourBtn} onClick={startTour} aria-label="Take the tour" title="Take the tour">
            <HelpCircle size={16} />
            <span className="fxd-tour-label">Take the tour</span>
          </button>

          <button style={styles.logoutBtn} onClick={() => setShowLogoutConfirm(true)}>
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </nav>

      <div style={styles.wrap} className="fxd-wrap">
        <div style={styles.hero} className="fxd-hero">
          <div style={styles.heroTop} className="fxd-hero-top">
            <div style={styles.avatar}>{(firstName.charAt(0) || "?").toUpperCase()}</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={styles.heroTitle}>
                {headline}, {firstName}!
              </h1>
              <p style={styles.heroSub}>
                {[profile.class_or_course, profile.country].filter(Boolean).join(" · ")}
              </p>
            </div>

            <div style={styles.planWrap}>
              <span style={{ ...styles.planBadge, ...(tier === "free" ? {} : styles.planBadgePaid) }}>
                {tier !== "free" && <Crown size={13} />}
                {PLAN_LABELS[tier] || PLAN_LABELS.free}
              </span>
              {tier !== "pro_max" && (
                <button style={styles.upgradeBtn} onClick={() => setShowPricing(true)}>
                  See plans
                </button>
              )}
            </div>
          </div>

          {interestTags.length > 0 && (
            <div style={styles.tagsRow}>
              {interestTags.map((tag) => (
                <span style={styles.tag} key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="fxd-stats">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div style={styles.statCard} key={stat.label}>
                <div style={{ ...styles.statIcon, color: stat.color }}>
                  <Icon size={18} />
                </div>
                <strong style={styles.statValue}>{stat.value}</strong>
                <span style={styles.statLabel}>{stat.label}</span>
              </div>
            )
          })}
        </div>

        <div className="fxd-layout">
          <div className="fxd-col">
            <div style={{ order: 1 }}>
              {activeCareer ? (
                <div style={styles.progressCard}>
                  <div style={styles.progressHeader}>
                    <div style={{ minWidth: 0 }}>
                      <span style={styles.sectionLabel}>Currently Working On</span>
                      <h2 style={styles.progressTitle}>{activeCareer.title}</h2>
                      {activeCareer.category && <span style={styles.categoryChip}>{activeCareer.category}</span>}
                      <p style={styles.stepCount}>
                        {stepCounts.done} of {stepCounts.total} steps done
                      </p>
                    </div>
                    <Ring percent={progressPercent} />
                  </div>

                  {nextStep ? (
                    <div style={styles.nextStepBox}>
                      <div style={styles.nextStepIconWrap}>
                        <Target size={18} color="#67e8f9" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={styles.nextStepLabel}>Your Next Step</span>
                        <p style={styles.nextStepTitle}>{nextStep.title}</p>
                      </div>
                    </div>
                  ) : (
                    <div style={styles.nextStepBox}>
                      <div style={{ ...styles.nextStepIconWrap, background: "rgba(253,224,71,0.14)" }}>
                        <Sparkles size={18} color="#fde047" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={styles.nextStepLabel}>Roadmap Complete!</span>
                        <p style={styles.nextStepTitle}>
                          You have finished every step for {activeCareer.title}.
                        </p>
                      </div>
                    </div>
                  )}

                  {nextStep && (
                    <button style={styles.continueBtn} onClick={() => navigate(`/career/${activeCareer.slug}`)}>
                      Continue Roadmap
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              ) : (
                <div style={styles.placeholderCard} onClick={() => navigate("/careers")}>
                  <div style={styles.placeholderIcon}>
                    <Compass size={26} color="#99f6ff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ marginBottom: 6, fontSize: "1.15rem" }}>Explore Careers and Get Your Roadmap</h2>
                    <p style={styles.subtext}>
                      Search any career and see a personalized, step-by-step path to get there.
                    </p>
                  </div>
                  <ArrowRight size={20} color="#c7d2fe" />
                </div>
              )}
            </div>

            {completionHistory.length > 0 && (
              <div style={{ ...styles.sectionCard, order: 4 }}>
                <h3 style={styles.sectionTitle}>
                  <Trophy size={16} style={{ marginRight: 8, verticalAlign: "-3px", color: "#fde047" }} />
                  Completed Roadmaps
                </h3>

                {completionHistory.map((entry) => (
                  <div key={entry.id} style={styles.completionRow}>
                    <div style={styles.completionIconWrap}>
                      <CheckCircle2 size={18} color="#4ade80" />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={styles.completionCareerName}>{entry.careers?.title || "Career"}</p>
                      <p style={styles.completionMeta}>
                        {entry.total_steps}/{entry.total_steps} steps completed ·{" "}
                        {new Date(entry.completed_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    <div style={styles.completionActions}>
                      <span style={styles.completionBadge}>Successfully Completed</span>

                      {profile.subscription_tier === "pro_max" ? (
                        <button
                          style={styles.certBtn}
                          onClick={() => navigate(`/certificate/${entry.careers?.slug}`)}
                        >
                          <Award size={14} />
                          View Certificate
                        </button>
                      ) : (
                        <button style={styles.certBtnLocked} onClick={() => setShowPricing(true)}>
                          <Lock size={13} />
                          Certificate with Pro Max
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {recommendedProjects.length > 0 && (
              <div style={{ ...styles.sectionCard, order: 5 }}>
                <h3 style={styles.sectionTitle}>Recommended Projects</h3>

                {recommendedProjects.map((project) => (
                  <div key={project.id} style={styles.projectRow}>
                    <p style={styles.projectTitle}>{project.title}</p>
                    {project.description && <p style={styles.subtext}>{project.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="fxd-col">
            <div style={{ ...styles.sectionCard, order: 2 }}>
              <h3 style={styles.sectionTitle}>Quick actions</h3>
              <div className="fxd-tiles">
                {tiles.map((tile) => {
                  const Icon = tile.icon
                  return (
                    <Link key={tile.title} to={tile.to} style={styles.tile} className="fxd-tile">
                      <span style={styles.tileIcon}>
                        <Icon size={18} />
                      </span>
                      <span style={styles.tileTitle}>{tile.title}</span>
                      <span style={styles.tileSub}>{tile.sub}</span>
                      {tile.locked && (
                        <span style={styles.tileLock}>
                          <Lock size={10} />
                          Pro Max
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            {skillTags.length > 0 && (
              <div style={{ ...styles.sectionCard, order: 6 }}>
                <h3 style={styles.sectionTitle}>
                  <TrendingUp size={16} style={{ marginRight: 8, verticalAlign: "-3px", color: "#86efac" }} />
                  Skills You're Building
                </h3>
                <div style={styles.tagsRowTight}>
                  {skillTags.map((tag) => (
                    <span style={styles.tag} key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {recentActivity.length > 0 && (
              <div style={{ ...styles.sectionCard, order: 7 }}>
                <h3 style={styles.sectionTitle}>
                  <Clock size={16} style={{ marginRight: 8, verticalAlign: "-3px", color: "#67e8f9" }} />
                  Recent Activity
                </h3>

                {recentActivity.map((item, idx) => (
                  <div key={idx} style={styles.activityRow}>
                    <span style={styles.activityDot} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={styles.activityText}>Completed: {item.title}</span>
                      <span style={styles.activityTime}>{relativeDay(item.completed_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={styles.contactBox}>
          <p style={styles.contactText}>
            Can't find the career you're looking for? Request it and we'll consider adding it.
          </p>

          <button style={styles.contactBtn} onClick={() => setShowRequestModal(true)}>
            <Compass size={16} />
            Request a Career
          </button>

          <p style={styles.generalContactText}>
            Have other feedback?{" "}
            <button style={styles.inlineLinkBtn} onClick={() => setShowContactModal(true)}>
              Contact Us
            </button>
          </p>
        </div>
      </div>

      <ContactModal mode="request" isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} />

      <ContactModal mode="general" isOpen={showContactModal} onClose={() => setShowContactModal(false)} />

      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        studentCountry={profile?.country}
      />

      {showLogoutConfirm && (
        <div style={styles.modalOverlay} onClick={() => setShowLogoutConfirm(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalIcon}>
              <AlertTriangle size={26} color="#fbbf24" />
            </div>

            <h3 style={styles.modalTitle}>Log out of Futurixia?</h3>

            <p style={styles.modalText}>
              You'll need to log in again to access your dashboard and roadmap.
            </p>

            <div style={styles.modalActions}>
              <button style={styles.modalCancelBtn} onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </button>

              <button style={styles.modalConfirmBtn} onClick={handleLogout}>
                <LogOut size={15} />
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const css = `
.fxd-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.fxd-layout { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); gap: 24px; align-items: start; }
.fxd-col { display: flex; flex-direction: column; gap: 24px; min-width: 0; }
.fxd-tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.fxd-tile { transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease; }
.fxd-tile:hover { transform: translateY(-3px); background: rgba(99,102,241,0.16) !important; box-shadow: 0 10px 28px rgba(0,0,0,0.35); }
@media (max-width: 900px) {
  .fxd-layout { display: flex; flex-direction: column; gap: 20px; }
  .fxd-col { display: contents; }
  .fxd-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 560px) {
  .fxd-nav { padding: 14px 16px !important; }
  .fxd-wrap { padding: 0 14px 40px !important; margin-top: 12px !important; }
  .fxd-tour-label { display: none; }
  .fxd-hero { padding: 22px 18px !important; }
  .fxd-hero-top { flex-wrap: wrap; }
}
@media (prefers-reduced-motion: reduce) { .fxd-tile { transition: none; } }
`

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(900px 500px at 15% -10%, rgba(99,102,241,0.18), transparent 60%), radial-gradient(700px 420px at 100% 0%, rgba(34,211,238,0.12), transparent 60%), #05070f",
    color: "#fff",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#05070f",
    color: "#fff",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 40px",
    maxWidth: "1120px",
    margin: "0 auto",
  },
  logo: {
    fontSize: "1.4rem",
    fontWeight: 800,
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  navActions: { display: "flex", alignItems: "center", gap: "10px" },
  tourBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(99,102,241,0.18)",
    color: "#c7d2fe",
    border: "none",
    padding: "10px 16px",
    borderRadius: "30px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    fontFamily: "inherit",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "30px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontFamily: "inherit",
  },
  wrap: {
    maxWidth: "1120px",
    margin: "20px auto 60px",
    padding: "0 24px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  hero: {
    background: "linear-gradient(135deg, rgba(99,102,241,0.22), rgba(34,211,238,0.1))",
    borderRadius: "24px",
    padding: "30px 32px",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.1)",
  },
  heroTop: { display: "flex", alignItems: "center", gap: "18px" },
  avatar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "62px",
    height: "62px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #22d3ee)",
    fontSize: "1.6rem",
    fontWeight: 800,
    flexShrink: 0,
  },
  heroTitle: { fontSize: "1.7rem", fontWeight: 800, lineHeight: 1.2, margin: 0 },
  heroSub: { color: "#b6bacf", fontSize: "0.92rem", marginTop: "6px" },
  planWrap: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  planBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(255,255,255,0.1)",
    color: "#e0e1ff",
    fontSize: "0.78rem",
    fontWeight: 700,
    padding: "7px 14px",
    borderRadius: "30px",
  },
  planBadgePaid: { background: "rgba(253,224,71,0.16)", color: "#fde047" },
  upgradeBtn: {
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "30px",
    fontSize: "0.78rem",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  tagsRow: { display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "20px" },
  tagsRowTight: { display: "flex", flexWrap: "wrap", gap: "8px" },
  tag: {
    background: "rgba(99,102,241,0.2)",
    color: "#c7d2fe",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "0.82rem",
  },
  statCard: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.07)",
  },
  statIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: "11px",
    background: "rgba(255,255,255,0.07)",
    marginBottom: "6px",
  },
  statValue: { fontSize: "1.6rem", fontWeight: 800 },
  statLabel: { color: "#9599b0", fontSize: "0.78rem" },
  progressCard: {
    background: "rgba(255,255,255,0.05)",
    borderRadius: "22px",
    padding: "28px",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "20px",
  },
  sectionLabel: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#a5b4fc",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  progressTitle: { fontSize: "1.5rem", fontWeight: 800, margin: "6px 0 8px" },
  categoryChip: {
    display: "inline-block",
    background: "rgba(34,211,238,0.12)",
    color: "#67e8f9",
    fontSize: "0.72rem",
    fontWeight: 700,
    padding: "4px 12px",
    borderRadius: "20px",
  },
  stepCount: { color: "#9599b0", fontSize: "0.82rem", marginTop: "10px" },
  nextStepBox: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "16px",
    padding: "16px 18px",
    marginBottom: "18px",
  },
  nextStepIconWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "rgba(34,211,238,0.14)",
    flexShrink: 0,
  },
  nextStepLabel: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#9599b0",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  nextStepTitle: { fontSize: "0.98rem", fontWeight: 600, margin: "4px 0 0", color: "#fff", wordBreak: "break-word" },
  continueBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "16px",
    fontSize: "0.95rem",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  placeholderCard: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "22px",
    padding: "28px 30px",
    cursor: "pointer",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
  },
  placeholderIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "54px",
    height: "54px",
    borderRadius: "16px",
    background: "rgba(34,211,238,0.14)",
    flexShrink: 0,
  },
  sectionCard: {
    background: "rgba(255,255,255,0.045)",
    borderRadius: "20px",
    padding: "22px",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.07)",
  },
  sectionTitle: { fontSize: "1rem", fontWeight: 700, marginBottom: "16px" },
  tile: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    textDecoration: "none",
    padding: "14px",
    borderRadius: "16px",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
  },
  tileIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    background: "rgba(99,102,241,0.22)",
    color: "#c7d2fe",
    marginBottom: "6px",
  },
  tileTitle: { fontSize: "0.88rem", fontWeight: 700 },
  tileSub: { fontSize: "0.72rem", color: "#9599b0", lineHeight: 1.4 },
  tileLock: {
    position: "absolute",
    top: "10px",
    right: "10px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: "rgba(253,224,71,0.14)",
    color: "#fde047",
    fontSize: "0.62rem",
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: "20px",
  },
  completionRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "14px 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    flexWrap: "wrap",
  },
  completionIconWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "38px",
    height: "38px",
    borderRadius: "11px",
    background: "rgba(74,222,128,0.14)",
    flexShrink: 0,
  },
  completionCareerName: { fontSize: "0.95rem", fontWeight: 700, color: "#fff" },
  completionMeta: { fontSize: "0.78rem", color: "#9599b0", marginTop: "2px" },
  completionActions: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" },
  certBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    fontFamily: "inherit",
  },
  certBtnLocked: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(255,255,255,0.07)",
    color: "#c7d2fe",
    border: "none",
    padding: "8px 14px",
    borderRadius: "20px",
    fontSize: "0.72rem",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)",
    fontFamily: "inherit",
  },
  completionBadge: {
    background: "rgba(74,222,128,0.14)",
    color: "#4ade80",
    fontSize: "0.72rem",
    fontWeight: 700,
    padding: "6px 12px",
    borderRadius: "20px",
    whiteSpace: "nowrap",
  },
  projectRow: { marginBottom: "12px" },
  projectTitle: { fontSize: "0.92rem", fontWeight: 600, color: "#fff" },
  activityRow: { display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "14px" },
  activityDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#4ade80",
    flexShrink: 0,
    marginTop: "6px",
    boxShadow: "0 0 0 4px rgba(74,222,128,0.15)",
  },
  activityText: { display: "block", fontSize: "0.88rem", color: "#d7d9e6", wordBreak: "break-word" },
  activityTime: { display: "block", fontSize: "0.72rem", color: "#7d8299", marginTop: "2px" },
  contactBox: { textAlign: "center", marginTop: "6px" },
  contactText: { color: "#9599b0", fontSize: "0.85rem", marginBottom: "14px" },
  contactBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,255,255,0.07)",
    color: "#e0e1ff",
    border: "none",
    padding: "12px 24px",
    borderRadius: "30px",
    fontSize: "0.9rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)",
    fontFamily: "inherit",
  },
  generalContactText: { marginTop: "14px", color: "#7d8299", fontSize: "0.8rem" },
  inlineLinkBtn: {
    background: "none",
    border: "none",
    color: "#a5b4fc",
    fontSize: "0.8rem",
    fontWeight: 700,
    textDecoration: "underline",
    cursor: "pointer",
    padding: 0,
    fontFamily: "inherit",
  },
  subtext: { color: "#a9adc4", fontSize: "0.92rem", marginTop: "6px" },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: "20px",
  },
  modalCard: {
    background: "#0f1120",
    borderRadius: "22px",
    padding: "34px",
    maxWidth: "380px",
    width: "100%",
    textAlign: "center",
    boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
  },
  modalIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "54px",
    height: "54px",
    borderRadius: "16px",
    background: "rgba(251,191,36,0.12)",
    margin: "0 auto 18px",
  },
  modalTitle: { fontSize: "1.2rem", fontWeight: 800, marginBottom: "8px" },
  modalText: { color: "#a9adc4", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "26px" },
  modalActions: { display: "flex", gap: "12px" },
  modalCancelBtn: {
    flex: 1,
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "14px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 600,
    fontFamily: "inherit",
  },
  modalConfirmBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    background: "linear-gradient(90deg, #ef4444, #f87171)",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "14px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 700,
    fontFamily: "inherit",
  },
}

export default Dashboard