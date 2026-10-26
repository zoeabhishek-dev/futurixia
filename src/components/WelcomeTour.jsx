import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Sparkles,
  LayoutDashboard,
  Target,
  ArrowRight,
  Compass,
  UserCircle,
  Award,
  FileText,
  Lightbulb,
  MessageCircle,
  LogOut,
  HelpCircle,
  Map,
  X,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Crown,
  BookOpen,
  Activity,
} from "lucide-react"
import { supabase } from "../supabaseClient"

const PAD = 8
const HEADING_TAGS = "h1,h2,h3,h4,p,span,strong,div"
const BUTTON_TAGS = "a,button"

const STEPS = [
  {
    icon: Sparkles,
    title: "Welcome to Futurixia",
    body: [
      "Let us take a quick tour of your dashboard and the tools inside it. It takes about three minutes.",
      "You can skip at any time, and replay the tour later with the ? button in the corner.",
    ],
  },
  {
    icon: LayoutDashboard,
    title: "Your dashboard",
    body: [
      "This is your home base. It greets you and shows your interests, so you can see at a glance what Futurixia knows about you.",
    ],
    target: {
      tags: HEADING_TAGS,
      pattern: /welcome|hello|good (morning|afternoon|evening)/i,
      grow: true,
    },
  },
  {
    icon: Target,
    title: "Currently Working On",
    body: [
      "Your active roadmap lives here. The percentage circle shows how far you have come, and the next-step box tells you exactly what to do next.",
    ],
    target: { tags: HEADING_TAGS, pattern: /currently working on/i, grow: true },
    missingNote: "This card fills in once you start a career roadmap.",
  },
  {
    icon: ArrowRight,
    title: "Continue Roadmap",
    body: [
      "Tap this button to jump straight to your next step. It appears whenever you have a roadmap in progress.",
    ],
    target: { tags: BUTTON_TAGS, pattern: /continue roadmap/i },
    missingNote: "This button appears once you have started a roadmap.",
  },
  {
    icon: Compass,
    title: "Explore Careers",
    body: [
      "Browse more than 100 careers. Search by name, filter by category, and tick the Compare box on any two careers to see them side by side.",
    ],
    target: { tags: BUTTON_TAGS, pattern: /explore careers/i },
  },
  {
    icon: Lightbulb,
    title: "Discovery Quiz",
    body: [
      "Not sure what to choose? Pick your interests and skills and get a ranked list of careers, with the reasons each one fits you.",
    ],
    target: { tags: BUTTON_TAGS, pattern: /discovery quiz|career discovery|take the quiz/i },
  },
  {
    icon: UserCircle,
    title: "Edit Profile",
    body: [
      "Your roadmap is built from your stage, interests and skills. Update them here whenever they change, and your steps will adjust to match.",
    ],
    target: { tags: BUTTON_TAGS, pattern: /edit profile/i },
  },
  {
    icon: Crown,
    title: "Smart Coach",
    body: [
      "A Pro Max tool. It compares your skills with a career, builds a week-by-week study plan with a finish date, and gives you a calendar file with reminders.",
      "Everyone can open it to see what it does.",
    ],
    target: { tags: BUTTON_TAGS, pattern: /smart coach/i },
  },
  {
    icon: FileText,
    title: "My Report",
    body: [
      "Another Pro Max tool. It builds a printable report with your profile, career facts, progress, skill check, study plan and free resources. You can save it as a PDF.",
    ],
    target: { tags: BUTTON_TAGS, pattern: /my report/i },
  },
  {
    icon: Award,
    title: "Completed Roadmaps",
    body: [
      "When you finish every step of a career, it appears here with the date. Pro Max members can open a certificate with a unique ID that anyone can verify online.",
    ],
    target: { tags: HEADING_TAGS, pattern: /completed roadmaps/i, grow: true },
    missingNote: "This section appears after you finish your first roadmap.",
  },
  {
    icon: ListChecks,
    title: "Skills You're Building",
    body: [
      "As you mark steps done, the skills they teach are collected here, so you can see what you are becoming good at.",
    ],
    target: { tags: HEADING_TAGS, pattern: /skills you.?re building|skills you are building/i, grow: true },
    missingNote: "Skills appear here as you complete steps.",
  },
  {
    icon: Activity,
    title: "Recent Activity",
    body: ["Your latest completed steps show up here. It is a quick way to remember where you left off."],
    target: { tags: HEADING_TAGS, pattern: /recent activity/i, grow: true },
    missingNote: "Your recent steps will appear here.",
  },
  {
    icon: MessageCircle,
    title: "Request a Career and Contact Us",
    body: [
      "Cannot find your career, or want to share an idea or question? Use these buttons to send us a message.",
    ],
    target: { tags: BUTTON_TAGS, pattern: /request a career|contact us/i },
  },
  {
    icon: LogOut,
    title: "Log out",
    body: [
      "When you are done, log out here. Your progress is saved to your account, so everything will be waiting when you come back.",
    ],
    target: { tags: BUTTON_TAGS, pattern: /log\s?out|sign\s?out/i },
  },
  {
    icon: BookOpen,
    title: "Inside every career page",
    body: ["When you open a career, here is what you will find:"],
    bullets: [
      "Quick facts: salary range, job demand and your progress bar.",
      "Read Full Career Information: education, exams, skills and more.",
      "A Day in This Career: a realistic day, the hard parts and a safe activity to try.",
      "Your roadmap: tap Mark Done on each step, and use Jump to My Next Step.",
      "Show details and free resources: videos, websites and guidance for each step (Pro).",
      "Compare: put two careers side by side from the Careers list.",
      "Was this helpful? Tell us what to improve.",
    ],
  },
  {
    icon: Crown,
    title: "Your plan",
    body: ["Futurixia has three plans, and a lock icon marks anything that needs an upgrade:"],
    bullets: [
      "Free: every career, the full roadmap, the quiz, compare, progress tracking and your history.",
      "Pro: adds free resources, videos and detailed guidance on every step.",
      "Pro Max: adds certificates, the Smart Coach and the personal career report.",
      "You can see the plans any time from the Pricing link in the footer of the home page.",
    ],
  },
  {
    icon: Map,
    title: "You are ready",
    body: [
      "That is everything. A good first move is to browse the careers and open one that interests you.",
      "Remember, the ? button in the corner replays this tour whenever you want.",
    ],
    finale: true,
  },
]

function prefersReducedMotion() {
  try {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  } catch (err) {
    return false
  }
}

const seenKey = (id) => `fx_tour_seen_${id}`

function readLocalSeen(id) {
  try {
    return window.localStorage.getItem(seenKey(id)) === "1"
  } catch (err) {
    return false
  }
}

function writeLocalSeen(id) {
  try {
    window.localStorage.setItem(seenKey(id), "1")
  } catch (err) {
    // The saved flag is only a backup.
  }
}

function growToCard(node) {
  const base = node.getBoundingClientRect()
  let current = node
  for (let i = 0; i < 4; i++) {
    const parent = current.parentElement
    if (!parent || parent === document.body || parent.id === "root") break
    const pr = parent.getBoundingClientRect()
    if (pr.height > window.innerHeight * 0.9) break
    current = parent
    if (pr.height >= base.height * 2.2 && pr.width >= 260) break
  }
  return current
}

function findTarget(spec) {
  if (!spec) return null
  const nodes = document.querySelectorAll(spec.tags)
  for (const node of nodes) {
    if (node.closest("[data-tour-ui]")) continue
    const text = (node.textContent || "").replace(/\s+/g, " ").trim()
    if (!text || text.length > 140) continue
    if (!spec.pattern.test(text)) continue
    const rect = node.getBoundingClientRect()
    if (rect.width < 8 || rect.height < 8) continue
    return spec.grow ? growToCard(node) : node
  }
  return null
}

function getCardStyle(spot) {
  const vw = window.innerWidth
  const vh = window.innerHeight

  if (vw < 640) {
    return { left: 12, right: 12, bottom: 12, maxHeight: "62vh" }
  }
  if (!spot) {
    return {
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: Math.min(480, vw - 24),
    }
  }

  const width = 360
  const left = Math.min(Math.max(spot.left + spot.width / 2 - width / 2, 12), vw - width - 12)
  const below = vh - (spot.top + spot.height)
  const above = spot.top

  if (below >= 300) return { left, top: spot.top + spot.height + 16, width }
  if (above >= 300) return { left, bottom: vh - spot.top + 16, width }
  return { right: 24, bottom: 24, width }
}

function WelcomeTour() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const onDashboard = pathname.replace(/\/+$/, "") === "/dashboard"

  const [userId, setUserId] = useState(null)
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [spot, setSpot] = useState(null)
  const [status, setStatus] = useState("none")
  const [, setTick] = useState(0)
  const targetRef = useRef(null)
  const nextRef = useRef(null)
  const reduce = useRef(prefersReducedMotion())

  useEffect(() => {
    if (!onDashboard) {
      setReady(false)
      setOpen(false)
      return
    }

    let active = true
    let timer = null

    const init = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        const user = userData && userData.user
        if (!user || !active) return

        const { data: row, error } = await supabase
          .from("profiles")
          .select("tour_seen")
          .eq("id", user.id)
          .maybeSingle()

        if (!active || error || !row) return

        setUserId(user.id)
        setReady(true)

        if (row.tour_seen !== true && !readLocalSeen(user.id)) {
          timer = setTimeout(() => {
            if (!active) return
            setIndex(0)
            setOpen(true)
          }, 1600)
        }
      } catch (err) {
        // The tour is optional, so any problem simply means it does not start.
      }
    }

    init()
    return () => {
      active = false
      if (timer) clearTimeout(timer)
    }
  }, [onDashboard])

  const finish = useCallback(async () => {
    setOpen(false)
    setSpot(null)
    targetRef.current = null
    if (!userId) return
    writeLocalSeen(userId)
    try {
      await supabase.from("profiles").update({ tour_seen: true }).eq("id", userId)
    } catch (err) {
      // The local flag already stops the tour from repeating in this browser.
    }
  }, [userId])

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }, [])

  const goBack = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0))
  }, [])

  const measure = useCallback(() => {
    const el = targetRef.current
    if (!el) return
    if (!document.body.contains(el)) {
      targetRef.current = null
      return
    }
    const r = el.getBoundingClientRect()
    setSpot({
      top: r.top - PAD,
      left: r.left - PAD,
      width: r.width + PAD * 2,
      height: r.height + PAD * 2,
    })
  }, [])

  useEffect(() => {
    if (!open) return
    const step = STEPS[index]
    let cancelled = false
    let tries = 0
    let timer = null

    const focusNext = () => {
      setTimeout(() => {
        if (nextRef.current) nextRef.current.focus()
      }, 80)
    }

    if (!step.target) {
      targetRef.current = null
      setSpot(null)
      setStatus("none")
      focusNext()
      return () => {
        cancelled = true
      }
    }

    setStatus("searching")

    const scrollToTarget = (el) => {
      const r = el.getBoundingClientRect()
      const behavior = reduce.current ? "auto" : "smooth"
      if (window.innerWidth < 640) {
        window.scrollTo({ top: Math.max(0, window.scrollY + r.top - 90), behavior })
      } else {
        const top = window.scrollY + r.top - (window.innerHeight - r.height) / 2
        window.scrollTo({ top: Math.max(0, top), behavior })
      }
    }

    const locate = () => {
      if (cancelled) return
      const el = findTarget(step.target)
      if (el) {
        targetRef.current = el
        setStatus("found")
        scrollToTarget(el)
        measure()
        setTimeout(measure, reduce.current ? 0 : 400)
        focusNext()
      } else if (tries < 6) {
        tries += 1
        timer = setTimeout(locate, 300)
      } else {
        targetRef.current = null
        setSpot(null)
        setStatus("missing")
        focusNext()
      }
    }

    locate()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [open, index, measure])

  useEffect(() => {
    if (!open) return
    let frame = 0
    const onChange = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        measure()
        setTick((t) => t + 1)
      })
    }
    window.addEventListener("scroll", onChange, true)
    window.addEventListener("resize", onChange)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onChange, true)
      window.removeEventListener("resize", onChange)
    }
  }, [open, measure])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault()
        finish()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        goNext()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        goBack()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, finish, goNext, goBack])

  if (!ready) return null

  const step = STEPS[index]
  const Icon = step.icon
  const isLast = index === STEPS.length - 1
  const activeSpot = step.target && status === "found" ? spot : null
  const cardStyle = getCardStyle(activeSpot)

  const exploreCareers = async () => {
    await finish()
    navigate("/careers")
  }

  const replay = () => {
    setIndex(0)
    setSpot(null)
    setOpen(true)
  }

  const overlay = (
    <div data-tour-ui style={s.root} role="dialog" aria-modal="true" aria-label="Welcome tour">
      <div
        style={{
          ...s.blocker,
          background: activeSpot ? "transparent" : "rgba(3,4,12,0.78)",
        }}
      />

      {activeSpot && (
        <div
          style={{
            ...s.spot,
            top: activeSpot.top,
            left: activeSpot.left,
            width: activeSpot.width,
            height: activeSpot.height,
            transition: reduce.current ? "none" : "all 0.25s ease",
          }}
        />
      )}

      <div style={{ ...s.card, ...cardStyle }}>
        <div style={s.cardTop}>
          <div style={s.iconWrap}>
            <Icon size={20} />
          </div>
          <button style={s.closeBtn} onClick={finish} aria-label="Skip the tour">
            <X size={16} />
          </button>
        </div>

        <h3 style={s.title}>{step.title}</h3>

        {step.body.map((paragraph) => (
          <p key={paragraph} style={s.text}>
            {paragraph}
          </p>
        ))}

        {step.bullets && (
          <ul style={s.list}>
            {step.bullets.map((item) => (
              <li key={item} style={s.listItem}>
                {item}
              </li>
            ))}
          </ul>
        )}

        {step.target && status === "missing" && step.missingNote && (
          <p style={s.note}>{step.missingNote}</p>
        )}

        <div style={s.progressTrack}>
          <div style={{ ...s.progressFill, width: `${((index + 1) / STEPS.length) * 100}%` }} />
        </div>

        <div style={s.footer}>
          <span style={s.counter}>
            Step {index + 1} of {STEPS.length}
          </span>
          <div style={s.actions}>
            {index > 0 && (
              <button style={s.backBtn} onClick={goBack}>
                <ChevronLeft size={16} />
                Back
              </button>
            )}
            {isLast ? (
              <>
                <button style={s.secondaryBtn} onClick={exploreCareers}>
                  Explore careers
                </button>
                <button ref={nextRef} style={s.primaryBtn} onClick={finish}>
                  Finish
                </button>
              </>
            ) : (
              <button ref={nextRef} style={s.primaryBtn} onClick={goNext}>
                Next
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        {!isLast && (
          <button style={s.skipLink} onClick={finish}>
            Skip tour
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {!open && (
        <button data-tour-ui className="fx-tour-fab" style={s.helpBtn} onClick={replay} aria-label="Take the tour" title="Take the tour">
          <HelpCircle size={22} />
        </button>
      )}
      {open && createPortal(overlay, document.body)}
    </>
  )
}

const s = {
  root: { position: "fixed", inset: 0, zIndex: 10000, fontFamily: "Inter, system-ui, sans-serif" },
  blocker: { position: "absolute", inset: 0 },
  spot: {
    position: "fixed",
    borderRadius: "14px",
    pointerEvents: "none",
    boxShadow:
      "0 0 0 9999px rgba(3,4,12,0.78), 0 0 0 2px #22d3ee, 0 0 24px rgba(34,211,238,0.5)",
  },
  card: {
    position: "fixed",
    zIndex: 10001,
    overflowY: "auto",
    background: "#0f1120",
    color: "#fff",
    borderRadius: "20px",
    padding: "20px 22px 18px",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.12), 0 24px 70px rgba(0,0,0,0.6)",
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  iconWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "rgba(99,102,241,0.2)",
    color: "#a5b4fc",
  },
  closeBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
  title: { fontSize: "1.1rem", fontWeight: 800, margin: "14px 0 8px" },
  text: { color: "#c9cbdb", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "8px" },
  list: { margin: "6px 0 8px", paddingLeft: "18px" },
  listItem: { color: "#c9cbdb", fontSize: "0.86rem", lineHeight: 1.55, marginBottom: "6px" },
  note: { color: "#fbbf24", fontSize: "0.82rem", lineHeight: 1.5, marginTop: "4px" },
  progressTrack: {
    width: "100%",
    height: "4px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "4px",
    overflow: "hidden",
    margin: "14px 0 12px",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    borderRadius: "4px",
    transition: "width 0.25s ease",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  counter: { color: "#7d8299", fontSize: "0.74rem" },
  actions: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: "rgba(255,255,255,0.08)",
    color: "#e0e1ff",
    border: "none",
    padding: "9px 14px",
    borderRadius: "30px",
    fontSize: "0.82rem",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    color: "#fff",
    border: "none",
    padding: "9px 18px",
    borderRadius: "30px",
    fontSize: "0.84rem",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    background: "rgba(255,255,255,0.08)",
    color: "#e0e1ff",
    border: "none",
    padding: "9px 16px",
    borderRadius: "30px",
    fontSize: "0.82rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)",
    fontFamily: "inherit",
  },
  skipLink: {
    display: "block",
    margin: "12px auto 0",
    background: "none",
    border: "none",
    color: "#9599b0",
    fontSize: "0.78rem",
    textDecoration: "underline",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  helpBtn: {
    position: "fixed",
    right: "18px",
    bottom: "18px",
    zIndex: 9000,
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #6366f1, #22d3ee)",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
  },
}

export default WelcomeTour