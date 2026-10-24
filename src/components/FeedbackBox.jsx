import { useState, useEffect } from "react"
import { ThumbsUp, ThumbsDown, Send, CheckCircle2, Loader2 } from "lucide-react"
import { supabase } from "../supabaseClient"

let memoryVisitorId = null

function makeId() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID()
  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

function getVisitorId() {
  try {
    let id = window.localStorage.getItem("fx_visitor_id")
    if (!id || id.length < 8) {
      id = makeId()
      window.localStorage.setItem("fx_visitor_id", id)
    }
    return id
  } catch (err) {
    if (!memoryVisitorId) memoryVisitorId = makeId()
    return memoryVisitorId
  }
}

function storageKey(section, careerId) {
  return `fx_fb_${section}_${careerId}`
}

function readSaved(section, careerId) {
  try {
    const raw = window.localStorage.getItem(storageKey(section, careerId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.helpful === "boolean") return parsed
  } catch (err) {
    // Saved answers are only a convenience.
  }
  return null
}

function writeSaved(section, careerId, value) {
  try {
    window.localStorage.setItem(storageKey(section, careerId), JSON.stringify(value))
  } catch (err) {
    // Saved answers are only a convenience.
  }
}

function FeedbackBox({ careerId, section, question }) {
  const [choice, setChoice] = useState(null)
  const [comment, setComment] = useState("")
  const [commentSent, setCommentSent] = useState(false)
  const [status, setStatus] = useState("idle")

  useEffect(() => {
    const saved = readSaved(section, careerId)
    setChoice(saved ? saved.helpful : null)
    setComment(saved && saved.comment ? saved.comment : "")
    setCommentSent(!!(saved && saved.comment))
    setStatus("idle")
  }, [careerId, section])

  const send = async (helpful, text) => {
    if (!careerId) return false
    setStatus("saving")
    const cleanComment = (text || "").trim().slice(0, 300)

    const { error } = await supabase.rpc("submit_feedback", {
      p_career_id: careerId,
      p_section: section,
      p_helpful: helpful,
      p_visitor_id: getVisitorId(),
      p_comment: cleanComment || null,
    })

    if (error) {
      setStatus("error")
      return false
    }

    writeSaved(section, careerId, { helpful, comment: cleanComment })
    setStatus("saved")
    return true
  }

  const choose = async (helpful) => {
    const ok = await send(helpful, helpful ? "" : comment)
    if (!ok) return
    setChoice(helpful)
    if (helpful) {
      setComment("")
      setCommentSent(false)
    }
  }

  const sendComment = async () => {
    const ok = await send(false, comment)
    if (ok) setCommentSent(true)
  }

  const changeAnswer = () => {
    setChoice(null)
    setStatus("idle")
  }

  const saving = status === "saving"

  return (
    <div style={s.box}>
      {choice === null && (
        <>
          <p style={s.question}>{question}</p>
          <div style={s.buttons}>
            <button style={s.choiceBtn} onClick={() => choose(true)} disabled={saving}>
              <ThumbsUp size={16} />
              Yes
            </button>
            <button style={s.choiceBtn} onClick={() => choose(false)} disabled={saving}>
              <ThumbsDown size={16} />
              No
            </button>
            {saving && <Loader2 size={18} color="#a5b4fc" style={{ animation: "fxspin 0.9s linear infinite" }} />}
          </div>
        </>
      )}

      {choice === true && (
        <div style={s.thanks} role="status">
          <CheckCircle2 size={18} color="#4ade80" />
          <span>Thank you. We are glad this helped.</span>
          <button style={s.linkBtn} onClick={changeAnswer}>
            Change my answer
          </button>
        </div>
      )}

      {choice === false && (
        <div role="status">
          <div style={s.thanks}>
            <CheckCircle2 size={18} color="#4ade80" />
            <span>Thank you for telling us.</span>
            <button style={s.linkBtn} onClick={changeAnswer}>
              Change my answer
            </button>
          </div>

          {commentSent ? (
            <p style={s.sentNote}>Your comment was sent. It helps us improve this page.</p>
          ) : (
            <>
              <label style={s.label} htmlFor={`fb-${section}-${careerId}`}>
                What could be better? (optional)
              </label>
              <textarea
                id={`fb-${section}-${careerId}`}
                style={s.textarea}
                maxLength={300}
                placeholder="For example: a part was unclear, missing or wrong."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div style={s.row}>
                <span style={s.counter}>{comment.length} / 300</span>
                <button
                  style={{ ...s.sendBtn, ...(saving || !comment.trim() ? s.disabled : {}) }}
                  onClick={sendComment}
                  disabled={saving || !comment.trim()}
                >
                  <Send size={14} />
                  Send comment
                </button>
              </div>
              <p style={s.privacy}>Please do not include your name, email or other personal details.</p>
            </>
          )}
        </div>
      )}

      {status === "error" && (
        <p style={s.error} role="alert">
          We could not send that just now. Please try again later.
        </p>
      )}

      <style>{`@keyframes fxspin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const s = {
  box: {
    background: "rgba(255,255,255,0.05)",
    borderRadius: "16px",
    padding: "18px 20px",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
    color: "#fff",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  question: { fontSize: "0.95rem", fontWeight: 700, marginBottom: "12px" },
  buttons: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  choiceBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,255,255,0.08)",
    color: "#e0e1ff",
    border: "none",
    padding: "10px 22px",
    borderRadius: "30px",
    fontSize: "0.88rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)",
    fontFamily: "inherit",
  },
  thanks: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    color: "#c9cbdb",
    fontSize: "0.9rem",
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#a5b4fc",
    fontSize: "0.82rem",
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
    fontFamily: "inherit",
  },
  label: {
    display: "block",
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#9599b0",
    margin: "14px 0 6px",
  },
  textarea: {
    width: "100%",
    minHeight: "80px",
    background: "rgba(255,255,255,0.07)",
    border: "none",
    outline: "none",
    color: "#fff",
    fontSize: "16px",
    padding: "12px 14px",
    borderRadius: "12px",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
    resize: "vertical",
    fontFamily: "inherit",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginTop: "8px",
    flexWrap: "wrap",
  },
  counter: { color: "#7d8299", fontSize: "0.72rem" },
  sendBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    color: "#fff",
    border: "none",
    padding: "9px 18px",
    borderRadius: "30px",
    fontSize: "0.82rem",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  disabled: { opacity: 0.55, cursor: "not-allowed" },
  privacy: { color: "#7d8299", fontSize: "0.72rem", marginTop: "10px", lineHeight: 1.5 },
  sentNote: { color: "#86efac", fontSize: "0.85rem", marginTop: "12px" },
  error: { color: "#ff9b9b", fontSize: "0.82rem", marginTop: "12px" },
}

export default FeedbackBox