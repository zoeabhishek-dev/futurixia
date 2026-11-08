import { useEffect } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  Compass,
  GraduationCap,
  Lightbulb,
  Route,
  Scale,
  Target,
  TrendingUp,
} from "lucide-react"
import Logo from "../components/Logo"
import JsonLd from "../components/JsonLd"
import {
  SITE,
  FOUNDER,
  FOUNDER_PAGE_TITLE,
  FOUNDER_PAGE_DESCRIPTION,
  OG_IMAGE,
} from "../lib/founderInfo"
import { founderJsonLd } from "../lib/structuredData"
import "../styles/founder.css"

const BUILDING = [
  { icon: Lightbulb, text: "Discover careers based on their interests." },
  { icon: Compass, text: "Explore different professional opportunities." },
  { icon: GraduationCap, text: "Understand educational requirements." },
  { icon: TrendingUp, text: "Identify skills they need to develop." },
  { icon: Route, text: "Follow structured career roadmaps." },
  { icon: Scale, text: "Compare career options." },
  { icon: Target, text: "Plan their next steps towards their dream careers." },
]

function setTag(attr, key, value) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  const existed = Boolean(el)
  const previous = existed ? el.getAttribute("content") : null
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute("content", value)
  return () => {
    if (existed) el.setAttribute("content", previous || "")
    else el.remove()
  }
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]')
  const existed = Boolean(el)
  const previous = existed ? el.getAttribute("href") : null
  if (!el) {
    el = document.createElement("link")
    el.setAttribute("rel", "canonical")
    document.head.appendChild(el)
  }
  el.setAttribute("href", href)
  return () => {
    if (existed) el.setAttribute("href", previous || "")
    else el.remove()
  }
}

// Page title, description, canonical address and sharing tags (the HTML file already carries them
// for search engines; this keeps them right when the page is opened from inside the app).
function useFounderMeta() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = FOUNDER_PAGE_TITLE

    const undo = [
      setTag("name", "description", FOUNDER_PAGE_DESCRIPTION),
      setTag("name", "robots", "index, follow"),
      setTag("property", "og:type", "profile"),
      setTag("property", "og:site_name", SITE.name),
      setTag("property", "og:title", FOUNDER_PAGE_TITLE),
      setTag("property", "og:description", FOUNDER_PAGE_DESCRIPTION),
      setTag("property", "og:url", FOUNDER.pageUrl),
      setTag("property", "og:image", OG_IMAGE),
      setTag("name", "twitter:card", "summary_large_image"),
      setTag("name", "twitter:title", FOUNDER_PAGE_TITLE),
      setTag("name", "twitter:description", FOUNDER_PAGE_DESCRIPTION),
      setTag("name", "twitter:image", OG_IMAGE),
      setCanonical(FOUNDER.pageUrl),
    ]

    return () => {
      undo.reverse().forEach((fn) => fn())
      document.title = previousTitle
    }
  }, [])
}

function Founder() {
  useFounderMeta()

  const intro = FOUNDER.age
    ? `I’m Abhishek Zoe, ${FOUNDER.age} years old, the Founder and CEO of Futurixia.`
    : "I’m Abhishek Zoe, the Founder and CEO of Futurixia."

  return (
    <div className="ff-page">
      <JsonLd id="fx-jsonld-founder" data={founderJsonLd()} />

      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-blob blob-a" />
        <div className="aurora-blob blob-b" />
        <div className="aurora-blob blob-c" />
      </div>

      <header className="ff-header ff-wrap">
        <Link to="/" aria-label="Futurixia home" className="ff-logo-link">
          <Logo height={56} mobileHeight={44} />
        </Link>
        <nav className="ff-nav" aria-label="Main">
          <Link to="/" className="ff-nav-link">
            Home
          </Link>
          <Link to="/careers" className="ff-nav-cta">
            Explore careers
            <ArrowRight size={15} />
          </Link>
        </nav>
      </header>

      <main>
        <section className="ff-hero ff-wrap" aria-labelledby="ff-title">
          <div className="ff-hero-text">
            <p className="ff-badge ff-rise" style={{ "--d": "0s" }}>
              <span className="ff-dot" aria-hidden="true" />
              Meet the founder
            </p>

            <h1 id="ff-title" className="ff-title ff-rise" style={{ "--d": "0.08s" }}>
              <span className="ff-name">Abhishek Zoe</span>
              <span className="ff-sr"> – </span>
              <span className="ff-role">{FOUNDER.roleLine}</span>
            </h1>

            <p className="ff-sub ff-rise" style={{ "--d": "0.16s" }}>
              Building a future where every student can discover a path towards their dream career.
            </p>

            <p className="ff-lead ff-rise" style={{ "--d": "0.24s" }}>
              Abhishek Zoe is the Founder and CEO of {SITE.name}, a career-guidance platform helping students discover
              and plan their dream careers.
            </p>

            <dl className="ff-facts ff-rise" style={{ "--d": "0.32s" }}>
              <div>
                <dt>Name</dt>
                <dd>{FOUNDER.name}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{FOUNDER.jobTitle}</dd>
              </div>
              <div>
                <dt>Company</dt>
                <dd>
                  <Link to="/">{SITE.name}</Link>
                </dd>
              </div>
              <div>
                <dt>Website</dt>
                <dd>
                  <a href={`${SITE.url}/`}>futurixia-delta.vercel.app</a>
                </dd>
              </div>
            </dl>
          </div>

          <div className="ff-hero-photo ff-rise" style={{ "--d": "0.2s" }}>
            <div className="ff-photo fx-glow fx-glow-live">
              {FOUNDER.photo ? (
                <img
                  className="ff-photo-img"
                  src={FOUNDER.photo}
                  alt={FOUNDER.photoAlt}
                  width="760"
                  height="950"
                  decoding="async"
                />
              ) : (
                <div className="ff-photo-placeholder" aria-hidden="true">
                  <div className="ff-monogram">AZ</div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="ff-section ff-wrap" aria-labelledby="ff-story">
          <div className="ff-sec-head">
            <span className="ff-num">01</span>
            <h2 id="ff-story">My story</h2>
          </div>
          <div className="ff-prose">
            <p>{intro}</p>
            <p>
              I started building Futurixia with a vision to make career guidance more accessible, understandable, and
              structured for students.
            </p>
            <p>
              Choosing a career can be confusing. Many students have dreams and ambitions, but they don’t always know
              what to study, which skills to develop, which qualifications they need, or what steps to take next.
            </p>
            <p>
              I wanted to build a platform that could help students find clarity and understand the journey towards their
              desired careers.
            </p>
            <p>
              Through Futurixia, my goal is to make career exploration and planning easier by providing students with
              structured guidance and useful information.
            </p>
          </div>
        </section>

        <section className="ff-section ff-wrap" aria-labelledby="ff-why">
          <div className="ff-sec-head">
            <span className="ff-num">02</span>
            <h2 id="ff-why">Why I started Futurixia</h2>
          </div>
          <div className="ff-prose">
            <p>Futurixia was created around one simple belief:</p>
          </div>
          <blockquote className="ff-quote">Every student deserves a clearer direction towards their future.</blockquote>
          <div className="ff-prose">
            <p>
              Students should be able to explore different career opportunities, understand the requirements of their
              dream careers and discover the steps needed to work towards their goals.
            </p>
            <p>
              I want Futurixia to help bridge the gap between having a career dream and understanding how to pursue it.
            </p>
          </div>
        </section>

        <section className="ff-section ff-wrap" aria-labelledby="ff-vision">
          <div className="ff-sec-head">
            <span className="ff-num">03</span>
            <h2 id="ff-vision">My vision</h2>
          </div>
          <div className="ff-vision fx-glow fx-glow-live">
            <p>
              My long-term vision is to build Futurixia into a global career-guidance platform that empowers students
              across different countries, educational backgrounds and interests.
            </p>
            <p>
              I want to make career information and structured career roadmaps more accessible to students, helping them
              make informed decisions about their futures.
            </p>
            <p className="ff-vision-note">
              This is a long-term vision, and I am continuously working towards building it.
            </p>
          </div>
        </section>

        <section className="ff-section ff-wrap" aria-labelledby="ff-building">
          <div className="ff-sec-head">
            <span className="ff-num">04</span>
            <h2 id="ff-building">What we are building</h2>
          </div>
          <div className="ff-prose">
            <p>Futurixia is a career-guidance platform designed to help students:</p>
          </div>
          <ul className="ff-grid">
            {BUILDING.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.text} className="ff-card">
                  <span className="ff-card-icon" aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <span className="ff-card-text">{item.text}</span>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="ff-final ff-wrap" aria-labelledby="ff-final-title">
          <div className="ff-final-card fx-glow fx-glow-live">
            <Logo height={96} mobileHeight={84} style={{ margin: "0 auto 10px" }} />
            <h2 id="ff-final-title">{SITE.tagline}.</h2>
            <p>Building with a vision to make career guidance accessible to students worldwide.</p>
            <div className="ff-actions">
              <Link to="/careers" className="ff-btn ff-btn-primary">
                Explore careers
                <ArrowRight size={16} />
              </Link>
              <Link to="/discover" className="ff-btn ff-btn-ghost">
                Take the discovery quiz
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="ff-footer ff-wrap">
        <nav aria-label="Footer">
          <Link to="/">Home</Link>
          <Link to="/careers">Careers</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </nav>
        <p>© {new Date().getFullYear()} Futurixia</p>
      </footer>
    </div>
  )
}

export default Founder
