import { Award, BookOpen, Compass, Flame, Footprints, Lock, Rocket, Route, Target, Trophy, Zap } from "lucide-react"

const ICONS = { Award, BookOpen, Compass, Flame, Footprints, Rocket, Route, Target, Trophy, Zap }

export const TIER_COLORS = {
  bronze: "#cd7f32",
  silver: "#c9ced6",
  gold: "#fbbf24",
}

// A round badge. Badges that are not earned yet are dimmed and show a lock.
function BadgeIcon({ icon, tier, earned, size = 52 }) {
  const Icon = ICONS[icon] || Award
  const color = TIER_COLORS[tier] || TIER_COLORS.bronze

  return (
    <span
      aria-hidden="true"
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: "50%",
        color: earned ? "#ffffff" : "var(--fx-muted-3)",
        background: earned
          ? `radial-gradient(circle at 30% 25%, ${color}, rgba(0,0,0,0.35))`
          : "rgba(255,255,255,0.06)",
        boxShadow: earned
          ? `0 0 0 2px ${color}, 0 0 18px ${color}55`
          : "inset 0 0 0 1px rgba(255,255,255,0.12)",
        opacity: earned ? 1 : 0.75,
      }}
    >
      <Icon size={Math.round(size * 0.46)} />
      {!earned && (
        <span
          style={{
            position: "absolute",
            right: -2,
            bottom: -2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: Math.round(size * 0.34),
            height: Math.round(size * 0.34),
            borderRadius: "50%",
            background: "var(--fx-surface)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.18)",
          }}
        >
          <Lock size={Math.round(size * 0.2)} />
        </span>
      )}
    </span>
  )
}

export default BadgeIcon
