import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { LogOut, User2, AlertTriangle, Compass, ArrowRight, Sparkles, TrendingUp, Clock, Target, Mail, Trophy, CheckCircle2 } from "lucide-react"
import { supabase } from "../supabaseClient"
import { getPersonalizedRoadmap } from "../lib/personalization"
import ContactModal from "../components/ContactModal"

function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [activeCareer, setActiveCareer] = useState(null)
  const [progressPercent, setProgressPercent] = useState(0)
  const [nextStep, setNextStep] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [recommendedProjects, setRecommendedProjects] = useState([])
  const [loadError, setLoadError] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [completionHistory, setCompletionHistory] = useState([])

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
                allProgress
                  .map((p) => p.step_id)
                  .filter((id) => careerStepIds.has(id))
              )

              const total = combined.length
              const completedCount = completedIdsForCareer.size
              const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0
              setProgressPercent(percent)

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
                setRecommendedProjects(
                  careerProjects.map((cp) => cp.projects).filter(Boolean)
                )
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
        // History is a bonus section; a failure here should not block the dashboard.
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
          We could not load your dashboard right now. Please check your connection and try refreshing the page.
        </p>
      </div>
    )
  }

  const interestTags = profile.interests?.split(", ").filter(Boolean) || []
  const skillTags = profile.skills?.split(", ").filter(Boolean) || []

  return (
    <div style={styles.page}>
      <nav style={styles.nav} className="fx-nav">
        <div style={styles.logo}>Futurixia</div>
        <button style={styles.logoutBtn} onClick={() => setShowLogoutConfirm(true)}>
          <LogOut size={16} />
          Log Out
        </button>
      </nav>

      <div style={styles.content} className="fx-content">
        <div style={styles.welcomeCard} className="fx-welcome-card">
          <User2 size={32} color="#a5b4fc" />
          <h1>Welcome, {profile.full_name}!</h1>
          <p style={styles.subtext}>
            {profile.class_or_course} · {profile.country}
          </p>

          <div style={styles.tagsRow}>
            {interestTags.map((tag) => (
              <span style={styles.tag} key={tag}>{tag}</span>
            ))}
          </div>
        </div>

        {activeCareer ? (
          <div style={styles.progressCard} className="fx-progress-card">
            <div style={styles.progressHeader}>
              <div>
                <span style={styles.progressLabel}>Currently Working On</span>
                <h2 style={styles.progressTitle}>{activeCareer.title}</h2>
              </div>
              <div style={styles.progressCircleWrap}>
                <span style={styles.progressPercentText}>{progressPercent}%</span>
              </div>
            </div>

            <div style={styles.progressBarTrack}>
              <div
                style={{ ...styles.progressBarFill, width: `${progressPercent}%` }}
              />
            </div>

            {nextStep ? (
              <div style={styles.nextStepBox}>
                <div style={styles.nextStepIconWrap}>
                  <Target size={18} color="#67e8f9" />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={styles.nextStepLabel}>Your Next Step</span>
                  <p style={styles.nextStepTitle}>{nextStep.title}</p>
                </div>
              </div>
            ) : (
              <div style={styles.nextStepBox}>
                <div style={styles.nextStepIconWrap}>
                  <Sparkles size={18} color="#fde047" />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={styles.nextStepLabel}>Roadmap Complete!</span>
                  <p style={styles.nextStepTitle}>
                    You have finished every step for {activeCareer.title}.
                  </p>
                </div>
              </div>
            )}

                        {nextStep && (
              <button
                style={styles.continueBtn}
                onClick={() => navigate(`/career/${activeCareer.slug}`)}
              >
                Continue Roadmap
                <ArrowRight size={16} />
              </button>
            )}
            ) : (
              <button
                style={styles.continueBtn}
                onClick={() => navigate("/careers")}
              >
                Explore More Careers
                <ArrowRight size={16} />
              </button>
            ){"}"}
          </div>
        ) : (
          <div style={styles.placeholderCard} onClick={() => navigate("/careers")} className="fx-placeholder-card">
            <div style={styles.placeholderIcon}>
              <Compass size={26} color="#99f6ff" />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ marginBottom: 6 }}>Explore Careers & Get Your Roadmap</h2>
              <p style={styles.subtext}>
                Search any career and see a personalized, step-by-step path to get there.
              </p>
            </div>
            <ArrowRight size={20} color="#c7d2fe" />
          </div>
        )}

        {recommendedProjects.length > 0 && (
          <div style={styles.sectionCard} className="fx-section-card">
            <h3 style={styles.sectionTitle}>Recommended Projects</h3>
            {recommendedProjects.map((project) => (
              <div key={project.id} style={styles.projectRow}>
                <p style={styles.projectTitle}>{project.title}</p>
                {project.description && (
                  <p style={styles.subtext}>{project.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {skillTags.length > 0 && (
          <div style={styles.sectionCard} className="fx-section-card">
            <h3 style={styles.sectionTitle}>
              <TrendingUp size={16} style={{ marginRight: 6, verticalAlign: "-3px" }} />
              Skills You're Building
            </h3>
            <div style={styles.tagsRow}>
              {skillTags.map((tag) => (
                <span style={styles.tag} key={tag}>{tag}</span>
              ))}
            </div>
          </div>
        )}

        {recentActivity.length > 0 && (
          <div style={styles.sectionCard} className="fx-section-card">
            <h3 style={styles.sectionTitle}>
              <Clock size={16} style={{ marginRight: 6, verticalAlign: "-3px" }} />
              Recent Activity
            </h3>
            {recentActivity.map((item, idx) => (
              <div key={idx} style={styles.activityRow}>
                <span style={styles.activityDot} />
                <span style={styles.activityText}>Completed: {item.title}</span>
              </div>
            ))}
          </div>
        )}

        <div style={styles.actionsRow} className="fx-actions-row">
          <Link to="/careers" style={styles.actionButton}>Explore Careers</Link>
          <Link to="/discover" style={styles.actionButton}>Discovery Quiz</Link>
          <Link to="/create-profile" style={styles.actionButton}>Edit Profile</Link>
        </div>

        {completionHistory.length > 0 && (
          <div style={styles.sectionCard} className="fx-section-card">
            <h3 style={styles.sectionTitle}>
              <Trophy size={16} style={{ marginRight: 6, verticalAlign: "-3px" }} />
              Completed Roadmaps
            </h3>
            {completionHistory.map((entry) => (
              <div key={entry.id} style={styles.completionRow}>
                <div style={styles.completionIconWrap}>
                  <CheckCircle2 size={18} color="#4ade80" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={styles.completionCareerName}>
                    {entry.careers?.title || "Career"}
                  </p>
                  <p style={styles.completionMeta}>
                    {entry.total_steps}/{entry.total_steps} steps completed ·{" "}
                    {new Date(entry.completed_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span style={styles.completionBadge}>Successfully Completed</span>
              </div>
            ))}
          </div>
        )}

        <div style={styles.contactBox}>
          <p style={styles.contactText}>
            Can't find the career you're looking for? Contact us, we'll add it for you.
          </p>
          <button style={styles.contactBtn} onClick={() => setShowContactModal(true)}>
            <Mail size={16} />
            Contact Us
          </button>
        </div>
      </div>

      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />

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

const styles = {
  page: { minHeight: "100vh", background: "#05070f", color: "#fff", fontFamily: "Inter, system-ui, sans-serif" },
  center: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#05070f", color: "#fff", fontFamily: "Inter, system-ui, sans-serif" },
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px" },
  logo: { fontSize: "1.4rem", fontWeight: 800, background: "linear-gradient(90deg, #6366f1, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  logoutBtn: { display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.08)", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "30px", cursor: "pointer", fontSize: "0.85rem" },
  content: { maxWidth: "720px", margin: "40px auto", padding: "0 20px", display: "flex", flexDirection: "column", gap: "24px" },
  welcomeCard: { background: "rgba(255,255,255,0.06)", borderRadius: "22px", padding: "34px" },
  progressCard: { background: "rgba(255,255,255,0.05)", borderRadius: "22px", padding: "30px" },
  progressHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" },
  progressLabel: { fontSize: "0.75rem", fontWeight: 700, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.05em" },
  progressTitle: { fontSize: "1.4rem", fontWeight: 800, margin: "6px 0 0" },
  progressCircleWrap: { display: "flex", alignItems: "center", justifyContent: "center", width: "56px", height: "56px", borderRadius: "50%", background: "rgba(99,102,241,0.18)" },
  progressPercentText: { fontSize: "0.95rem", fontWeight: 800, color: "#c7d2fe" },
  progressBarTrack: { width: "100%", height: "10px", background: "rgba(255,255,255,0.08)", borderRadius: "10px", overflow: "hidden", marginBottom: "22px" },
  progressBarFill: { height: "100%", background: "linear-gradient(90deg, #6366f1, #22d3ee)", borderRadius: "10px" },
  nextStepBox: { display: "flex", gap: "14px", alignItems: "flex-start", background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "16px 18px", marginBottom: "20px" },
  nextStepIconWrap: { display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "12px", background: "rgba(34,211,238,0.14)", flexShrink: 0 },
  nextStepLabel: { fontSize: "0.72rem", fontWeight: 700, color: "#9599b0", textTransform: "uppercase", letterSpacing: "0.05em" },
  nextStepTitle: { fontSize: "0.95rem", fontWeight: 600, margin: "4px 0 0", color: "#fff" },
  continueBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", background: "linear-gradient(90deg, #6366f1, #22d3ee)", color: "#fff", border: "none", padding: "14px", borderRadius: "16px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer" },
  placeholderCard: { display: "flex", alignItems: "center", gap: "20px", background: "rgba(255,255,255,0.045)", borderRadius: "22px", padding: "30px 34px", cursor: "pointer" },
  placeholderIcon: { display: "flex", alignItems: "center", justifyContent: "center", width: "54px", height: "54px", borderRadius: "16px", background: "rgba(34,211,238,0.14)", flexShrink: 0 },
  sectionCard: { background: "rgba(255,255,255,0.04)", borderRadius: "18px", padding: "24px" },
  sectionTitle: { fontSize: "1rem", fontWeight: 700, marginBottom: "14px" },
  projectRow: { marginBottom: "12px" },
  projectTitle: { fontSize: "0.92rem", fontWeight: 600, color: "#fff" },
  activityRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" },
  activityDot: { width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", flexShrink: 0 },
  activityText: { fontSize: "0.88rem", color: "#c9cbdb" },
  actionsRow: { display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" },
  actionButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "0.85rem",
    fontWeight: 700,
    textDecoration: "none",
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    padding: "12px 24px",
    borderRadius: "16px",
  },
  completionRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "12px 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  completionIconWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "rgba(74,222,128,0.14)",
    flexShrink: 0,
  },
  completionCareerName: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#fff",
  },
  completionMeta: {
    fontSize: "0.78rem",
    color: "#9599b0",
    marginTop: "2px",
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
  contactBox: {
    textAlign: "center",
    marginTop: "6px",
  },
  contactText: {
    color: "#9599b0",
    fontSize: "0.85rem",
    marginBottom: "14px",
  },
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
  },
  subtext: { color: "#a9adc4", fontSize: "0.92rem", marginTop: "6px" },
  tagsRow: { display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" },
  tag: { background: "rgba(99,102,241,0.18)", color: "#c7d2fe", padding: "6px 14px", borderRadius: "20px", fontSize: "0.82rem" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" },
  modalCard: { background: "#0f1120", borderRadius: "22px", padding: "34px", maxWidth: "380px", width: "100%", textAlign: "center", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" },
  modalIcon: { display: "flex", alignItems: "center", justifyContent: "center", width: "54px", height: "54px", borderRadius: "16px", background: "rgba(251,191,36,0.12)", margin: "0 auto 18px" },
  modalTitle: { fontSize: "1.2rem", fontWeight: 800, marginBottom: "8px" },
  modalText: { color: "#a9adc4", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "26px" },
  modalActions: { display: "flex", gap: "12px" },
  modalCancelBtn: { flex: 1, background: "rgba(255,255,255,0.08)", color: "#fff", border: "none", padding: "12px", borderRadius: "14px", cursor: "pointer", fontSize: "0.9rem", fontWeight: 600 },
  modalConfirmBtn: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", background: "linear-gradient(90deg, #ef4444, #f87171)", color: "#fff", border: "none", padding: "12px", borderRadius: "14px", cursor: "pointer", fontSize: "0.9rem", fontWeight: 700 },
}

export default Dashboard