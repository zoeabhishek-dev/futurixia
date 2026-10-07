import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"

function InfoModal({ isOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={styles.overlay}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            style={styles.card}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
            <h3 style={styles.title}>{title}</h3>
            <div style={styles.body}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
    padding: "20px",
  },
  card: {
    position: "relative",
    background: "#0f1120",
    borderRadius: "22px",
    padding: "34px",
    maxWidth: "480px",
    width: "100%",
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
  },
  closeBtn: {
    position: "absolute",
    top: "18px",
    right: "18px",
    background: "rgba(255,255,255,0.08)",
    border: "none",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    cursor: "pointer",
  },
  title: { fontSize: "1.3rem", fontWeight: 800, color: "#fff", marginBottom: "16px" },
  body: { color: "#c9cbdb", fontSize: "0.9rem", lineHeight: 1.7 },
}

export default InfoModal