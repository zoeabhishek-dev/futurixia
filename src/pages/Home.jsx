import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import ContactModal from "../components/ContactModal"
import InfoModal from "../components/InfoModal"
import PricingModal from "../components/PricingModal"
import "../App.css"
import {
  Rocket,
  Code2,
  Stethoscope,
  Scale,
  Plane,
  Shield,
  GraduationCap,
  Wrench,
  UserCircle,
  Target,
  Map,
  Globe2,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  MessageCircle,
  Link2,
  Send,
  Mail,
  Menu,
  X,
} from "lucide-react"

function Home() {
  const navigate = useNavigate()
  const [checkingSession, setCheckingSession] = useState(true)
  const [showContactModal, setShowContactModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [infoModalType, setInfoModalType] = useState(null)

  const openInfo = (type) => (e) => {
    e.preventDefault()
    setInfoModalType(type)
  }

  useEffect(() => {
    const checkExistingSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data?.session) {
        navigate("/dashboard")
      } else {
        setCheckingSession(false)
      }
    }
    checkExistingSession()
  }, [navigate])

  const careers = [
    { icon: Rocket, label: "Entrepreneur" },
    { icon: Code2, label: "Software Engineer" },
    { icon: Stethoscope, label: "Doctor" },
    { icon: Scale, label: "Lawyer" },
    { icon: Plane, label: "Pilot" },
    { icon: Shield, label: "IPS Officer" },
    { icon: GraduationCap, label: "Teacher" },
    { icon: Wrench, label: "Engineer" },
  ]

  const steps = [
    {
      icon: UserCircle,
      title: "Create Your Profile",
      text: "Age, country, education, interests & skills.",
    },
    {
      icon: Target,
      title: "Pick Your Dream Career",
      text: "Search any career — from Doctor to Entrepreneur.",
    },
    {
      icon: Map,
      title: "Get Your Roadmap",
      text: "A personalized, step-by-step path to get there.",
    },
  ]

  const stats = [
    { icon: Award, value: "100+", label: "Careers Mapped" },
    { icon: Globe2, value: "40", label: "Steps Per Roadmap" },
    { icon: Sparkles, value: "5", label: "Student Stages Covered" },
    { icon: Users, value: "Free", label: "To Explore Every Career" },
  ]

  const popularCareers = [
    { icon: Code2, title: "Software Engineer", slug: "software-engineer", desc: "Build apps, websites & systems that power the world." },
    { icon: Stethoscope, title: "Doctor", slug: "doctor", desc: "Diagnose, treat and care for patients across specialties." },
    { icon: Rocket, title: "Entrepreneur", slug: "entrepreneur", desc: "Build and scale your own business from the ground up." },
    { icon: Scale, title: "Lawyer", slug: "lawyer", desc: "Advocate, advise and interpret the law professionally." },
    { icon: Plane, title: "Pilot", slug: "pilot", desc: "Fly commercial or private aircraft across the globe." },
    { icon: Shield, title: "IPS Officer", slug: "ips-officer", desc: "Lead law enforcement and public safety at scale." },
  ]

  if (checkingSession) {
    return null
  }

  return (
    <div className="app">
      {/* ANIMATED BACKGROUND LAYER */}
      <div className="aurora-bg">
        <div className="aurora-blob blob-a" />
        <div className="aurora-blob blob-b" />
        <div className="aurora-blob blob-c" />
      </div>

      {/* NAVBAR */}
      <nav className="navbar">
        <Link to="/" className="nav-logo">Futurixia</Link>
        <div className="nav-links">
          <a href="#how">How it Works</a>
          <a href="#careers">Careers</a>
          <Link to="/login" className="nav-btn">
            Get Started
            <ArrowRight size={16} />
          </Link>
        </div>
        <button
          className="nav-hamburger"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="nav-mobile-menu">
          <a href="#how" onClick={() => setMobileMenuOpen(false)}>How it Works</a>
          <a href="#careers" onClick={() => setMobileMenuOpen(false)}>Careers</a>
          <Link to="/login" className="nav-btn" onClick={() => setMobileMenuOpen(false)}>
            Get Started
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* HERO */}
      <section className="hero">
        <div className="grid-overlay" />
        <motion.div
          className="glow-orb orb1"
          animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="glow-orb orb2"
          animate={{ y: [0, -25, 0], x: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="hero-badge"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Sparkles size={14} />
          <span>Career guidance, personalized for you</span>
        </motion.div>

        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Find Your Path to Your <span className="highlight">Dream Career</span>
        </motion.h1>

        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Tell us who you are and where you want to go — Futurixia builds you
          a personalized, step-by-step roadmap to get there. From student to
          professional, anywhere in the world.
        </motion.p>

        <motion.div
          className="hero-actions"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Link to="/login">
            <motion.button
              className="cta-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Build My Roadmap
              <ArrowRight size={18} />
            </motion.button>
          </Link>
          <motion.a
            href="#how"
            className="secondary-btn"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            See How it Works
          </motion.a>
          <Link to="/discover">
            <motion.button
              className="secondary-btn"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Not Sure? Take the Quiz
            </motion.button>
          </Link>
        </motion.div>

        <div className="floating-careers">
          {careers.map((career, i) => {
            const Icon = career.icon
            return (
              <motion.div
                key={career.label}
                className="career-chip"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, -12, 0] }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.6 + i * 0.1 },
                  y: {
                    duration: 3 + i * 0.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.3,
                  },
                }}
                whileHover={{ scale: 1.08, y: -4 }}
              >
                <Icon size={16} strokeWidth={2} />
                <span>{career.label}</span>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* STATS BAR */}
      <section className="stats-bar">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              className="stat-item"
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="stat-icon">
                <Icon size={22} strokeWidth={1.8} />
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </motion.div>
          )
        })}
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="how-section">
        <motion.div
          className="section-heading"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-tag">Simple Process</span>
          <h2>How Futurixia Works</h2>
          <p>Three simple steps between you and your dream career.</p>
        </motion.div>

        <div className="steps">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                className="step-card"
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                whileHover={{ y: -8 }}
              >
                <div className="step-number">{`0${i + 1}`}</div>
                <div className="step-icon">
                  <Icon size={28} strokeWidth={1.8} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* POPULAR CAREERS */}
      <section id="careers" className="careers-section">
        <motion.div
          className="section-heading"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-tag">Explore</span>
          <h2>Popular Careers on Futurixia</h2>
          <p>A small taste of the 100+ career paths we help you navigate.</p>
        </motion.div>

        <div className="careers-grid">
          {popularCareers.map((career, i) => {
            const Icon = career.icon
            return (
              <motion.div
                className="career-card"
                key={career.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -6 }}
              >
                <div className="career-card-icon">
                  <Icon size={24} strokeWidth={1.8} />
                </div>
                <h3>{career.title}</h3>
                <p>{career.desc}</p>
                <Link to={`/career/${career.slug}`} className="career-card-link">
                  Explore Roadmap <ArrowRight size={14} />
                </Link>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="cta-banner">
        <motion.div
          className="cta-banner-inner"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Ready to find your path?</h2>
          <p>Create your free profile and start exploring careers in minutes.</p>
          <Link to="/login">
            <motion.button
              className="cta-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started Free
              <ArrowRight size={18} />
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="nav-logo">Futurixia</div>
            <p>Guiding students to their dream careers, worldwide.</p>
            <div className="footer-socials">
              <a href="#"><MessageCircle size={18} /></a>
              <a href="#"><Link2 size={18} /></a>
              <a href="#"><Send size={18} /></a>
              <a href="#"><Mail size={18} /></a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Product</h4>
            <a href="#how">How it Works</a>
            <a href="#careers">Careers</a>
            <a href="#" onClick={openInfo("pricing-modal")}>Pricing</a>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <a href="#" onClick={openInfo("about")}>About Us</a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setShowContactModal(true)
              }}
            >
              Contact
            </a>
            <a href="#" onClick={openInfo("blog")}>Blog</a>
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <a href="#" onClick={openInfo("privacy")}>Privacy Policy</a>
            <a href="#" onClick={openInfo("terms")}>Terms of Service</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Futurixia — Guiding students to their dream careers, worldwide.</p>
          <button
            onClick={() => setShowContactModal(true)}
            style={{
              marginTop: "16px",
              background: "rgba(255,255,255,0.07)",
              color: "#e0e1ff",
              border: "none",
              padding: "10px 22px",
              borderRadius: "30px",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)",
            }}
          >
            Contact Us
          </button>
        </div>
      </footer>

      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />

      <PricingModal
        isOpen={infoModalType === "pricing-modal"}
        onClose={() => setInfoModalType(null)}
      />

      <InfoModal
        isOpen={infoModalType === "about"}
        onClose={() => setInfoModalType(null)}
        title="About Futurixia"
      >
        <p>
          Futurixia is a career guidance platform built to help students and early
          professionals find a clear, step-by-step path toward the career they want, based on
          their own education stage, interests, and skills rather than generic advice.
        </p>
        <p style={{ marginTop: "14px" }}>
          Every roadmap on Futurixia is built using real, rule-based personalization with no AI
          guesswork, and career pages link to genuine free resources so you can start learning
          right away.
        </p>
      </InfoModal>

      <InfoModal
        isOpen={infoModalType === "blog"}
        onClose={() => setInfoModalType(null)}
        title="Futurixia Blog"
      >
        <p>
          The Futurixia blog is coming soon. We are focused right now on building out the career
          catalog and roadmap experience. Once that is solid, we will start sharing career
          guidance articles here.
        </p>
      </InfoModal>

      <InfoModal
        isOpen={infoModalType === "privacy"}
        onClose={() => setInfoModalType(null)}
        title="Privacy Policy"
      >
        <p>
          Futurixia collects only the information you choose to provide: your name, age, country,
          education details, interests, and skills, used solely to personalize your career
          roadmap. Your account and progress data are stored securely and are never sold or shared
          with third parties.
        </p>
        <p style={{ marginTop: "14px" }}>
          If you use the Contact Us or Request a Career forms, your message and email are sent
          directly to our team through a secure third-party form service for the sole purpose of
          responding to you.
        </p>
        <p style={{ marginTop: "14px" }}>
          You can edit your profile information at any time from your Dashboard.
        </p>
      </InfoModal>

      <InfoModal
        isOpen={infoModalType === "terms"}
        onClose={() => setInfoModalType(null)}
        title="Terms of Service"
      >
        <p>
          Futurixia is provided as an educational guidance tool. Career information, salary
          ranges, and roadmap content are intended as general guidance only and should not be
          treated as a guarantee of outcomes, income, or admission into any program or profession.
        </p>
        <p style={{ marginTop: "14px" }}>
          You are responsible for verifying specific requirements, such as exams, licensing, or
          eligibility criteria, with the relevant official authority in your country before making
          decisions based on information shown here.
        </p>
        <p style={{ marginTop: "14px" }}>
          By using Futurixia, you agree to use the platform respectfully and not to misuse the
          Contact Us or Request a Career forms for unrelated or harmful purposes.
        </p>
      </InfoModal>
    </div>
  )
}

export default Home