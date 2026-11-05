export const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    tagline: "Everything you need to start",
    theme: "Forest & Emerald theme",
    features: [
      "Browse 100+ careers",
      "Full step-by-step roadmap for every career",
      "Personalised starting steps for your stage",
      "Progress tracking and completion history",
      "Discovery quiz and career comparison",
      "Personal career report",
      "A Day in This Career",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 399,
    tagline: "Learn faster with real resources",
    theme: "Charcoal & Orange theme",
    features: [
      "Everything in Free",
      "Free learning resources, videos and official websites on every step",
      "Detailed guidance on every step: how to do it, why it matters, what to achieve",
    ],
  },
  {
    id: "pro_max",
    name: "Pro Max",
    price: 699,
    tagline: "The complete Futurixia experience",
    theme: "Black & Gold theme, or choose any of the four themes",
    features: [
      "Everything in Pro",
      "Completion certificates with a public verification link",
      "Smart Coach: skill check, weekly study plan and calendar reminders",
      "A Themes button to pick your favourite look",
    ],
  },
]

export function formatPrice(price) {
  return price === 0 ? "₹0" : `₹${price}`
}