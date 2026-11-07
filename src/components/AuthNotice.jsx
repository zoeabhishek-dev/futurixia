import { useLocation } from "react-router-dom"

const SHOW_ON = ["/login", "/create-profile"]

// A short notice at the point where personal information is first collected.
function AuthNotice() {
  const { pathname } = useLocation()
  if (!SHOW_ON.includes(pathname)) return null

  const onProfile = pathname === "/create-profile"

  return (
    <div style={styles.wrap} role="note">
      <p style={styles.text}>
        {onProfile
          ? "We use these details only to personalise your career roadmap. "
          : "By continuing, you agree to our "}
        {onProfile ? (
          <>
            Read our{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" style={styles.link}>
              Privacy Policy
            </a>
            . If you are under 18, please ask a parent or guardian to read it with you.
          </>
        ) : (
          <>
            <a href="/terms" target="_blank" rel="noopener noreferrer" style={styles.link}>
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" style={styles.link}>
              Privacy Policy
            </a>
            . If you are under 18, please ask a parent or guardian to read them first.
          </>
        )}
      </p>
    </div>
  )
}

const styles = {
  wrap: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    display: "flex",
    justifyContent: "center",
    padding: "10px 14px calc(10px + env(safe-area-inset-bottom, 0px))",
    background: "linear-gradient(180deg, rgba(var(--fx-bg-rgb), 0), rgba(var(--fx-bg-rgb), 0.95) 40%)",
    pointerEvents: "none",
  },
  text: {
    maxWidth: "520px",
    margin: 0,
    textAlign: "center",
    fontSize: "0.74rem",
    lineHeight: 1.5,
    color: "var(--fx-muted-2)",
    pointerEvents: "auto",
  },
  link: { color: "#60a5fa", textDecoration: "underline", textUnderlineOffset: "2px" },
}

export default AuthNotice
