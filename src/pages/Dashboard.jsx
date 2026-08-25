import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { LogOut, User2, AlertTriangle, Compass, ArrowRight } from "lucide-react"
import { supabase } from "../supabaseClient"

function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    const load = async () => {
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
      setLoading(false)
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

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.logo}>Futurixia</div>
        <button style={styles.logoutBtn} onClick={() => setShowLogoutConfirm(true)}>
          <LogOut size={16} />
          Log Out
        </button>
      </nav>

      <div style={styles.content}>
        <div style={styles.welcomeCard}>
          <User2 size={32} color="#a5b4fc" />
          <h1>Welcome, {profile.full_name}!</h1>
          <p style={styles.subtext}>
            {profile.class_or_course} · {profile.country}
          </p>

          <div style={styles.tagsRow}>
            {profile.interests?.split(", ").map((tag) => (
              <span style={styles.tag} key={tag}>{tag}</span>
            ))}
          </div>
        </div>

        <div
          style={styles.placeholderCard}
          onClick={() => navigate("/careers")}
        >
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
      </div>

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
              <button
                style={styles.modalCancelBtn}
                onClick={() => setShowLogoutConfirm(false)}
              >
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
  page: {
    minHeight: "100vh",
    background: "#05070f",
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
  },
  logo: {
    fontSize: "1.4rem",
    fontWeight: 800,
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
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
  },
  content: {
    maxWidth: "720px",
    margin: "40px auto",
    padding: "0 20px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  welcomeCard: {
    background: "rgba(255,255,255,0.06)",
    borderRadius: "22px",
    padding: "34px",
  },
  placeholderCard: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    background: "rgba(255,255,255,0.045)",
    borderRadius: "22px",
    padding: "30px 34px",
    cursor: "pointer",
    transition: "background 0.2s ease",
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
  subtext: {
    color: "#a9adc4",
    fontSize: "0.92rem",
    marginTop: "6px",
  },
  tagsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "18px",
  },
  tag: {
    background: "rgba(99,102,241,0.18)",
    color: "#c7d2fe",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "0.82rem",
  },
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
  modalTitle: {
    fontSize: "1.2rem",
    fontWeight: 800,
    marginBottom: "8px",
  },
  modalText: {
    color: "#a9adc4",
    fontSize: "0.9rem",
    lineHeight: 1.5,
    marginBottom: "26px",
  },
  modalActions: {
    display: "flex",
    gap: "12px",
  },
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
  },
}

export default Dashboard