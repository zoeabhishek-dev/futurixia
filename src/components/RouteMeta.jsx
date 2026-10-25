import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { applyPageMeta } from "../lib/seo"

const PUBLIC_PAGES = {
  "/": {},
  "/careers": {
    title: "Browse 100+ Careers | Futurixia",
    description:
      "Search and filter over 100 careers by category. See salary ranges, skills and a step-by-step roadmap for each one.",
  },
  "/discover": {
    title: "Career Discovery Quiz | Futurixia",
    description:
      "Not sure what to study or do next? Pick your interests and skills and get career matches, with reasons for each one.",
  },
  "/compare": {
    title: "Compare Two Careers Side by Side | Futurixia",
    description:
      "Compare education, exams, skills, work environment and career progression for any two careers, side by side.",
  },
}

const PRIVATE_PAGES = [
  { prefix: "/login", title: "Log In or Sign Up | Futurixia" },
  { prefix: "/dashboard", title: "Your Dashboard | Futurixia" },
  { prefix: "/create-profile", title: "Your Profile | Futurixia" },
  { prefix: "/coach", title: "Smart Coach | Futurixia" },
  { prefix: "/report", title: "Personal Career Report | Futurixia" },
  { prefix: "/certificate", title: "Certificate | Futurixia" },
  { prefix: "/reset-password", title: "Reset Password | Futurixia" },
  { prefix: "/verify", title: "Verify a Certificate | Futurixia" },
]

function RouteMeta() {
  const { pathname } = useLocation()

  useEffect(() => {
    const path = pathname.replace(/\/+$/, "") || "/"

    if (path.startsWith("/career/")) {
      applyPageMeta({ title: "Career Roadmap | Futurixia" })
      return
    }

    if (PUBLIC_PAGES[path]) {
      applyPageMeta(PUBLIC_PAGES[path])
      return
    }

    const privatePage = PRIVATE_PAGES.find((p) => path.startsWith(p.prefix))
    if (privatePage) {
      applyPageMeta({ title: privatePage.title, noindex: true })
      return
    }

    applyPageMeta()
  }, [pathname])

  return null
}

export default RouteMeta