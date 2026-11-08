export const DEFAULT_THEME = "aurora"

export const THEMES = [
  {
    id: "aurora",
    name: "Aurora",
    blurb: "Bright blue and violet with a neon glow. Made for dreamers.",
    bg: "#0a0716",
    swatch: ["#2f6bff", "#7c4dff", "#22d3ff"],
  },
  {
    id: "forest_emerald",
    name: "Forest & Emerald",
    blurb: "Calm, fresh and focused on growth.",
    bg: "#06100c",
    swatch: ["#047857", "#0d9488", "#34d399"],
  },
  {
    id: "charcoal_orange",
    name: "Charcoal & Orange",
    blurb: "Warm and energetic on soft charcoal.",
    bg: "#0e0e10",
    swatch: ["#c2410c", "#b45309", "#fb923c"],
  },
  {
    id: "plum_rose",
    name: "Plum & Rose",
    blurb: "Creative and friendly on a rich plum base.",
    bg: "#12081a",
    swatch: ["#a21caf", "#be185d", "#f472b6"],
  },
  {
    id: "black_gold",
    name: "Black & Gold",
    blurb: "Premium ink black with gold highlights.",
    bg: "#050505",
    swatch: ["#a16207", "#b45309", "#facc15"],
  },
]

export const PLAN_DEFAULT_THEME = {
  free: "aurora",
  pro: "charcoal_orange",
  pro_max: "black_gold",
}

export function themeById(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0]
}
