import { motion } from "framer-motion"
import { Link } from "react-router-dom"
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
} from "lucide-react"

function Home() {
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
    { icon: Globe2, value: "120+", label: "Countries Covered" },
    { icon: Award, value: "300+", label: "Careers Mapped" },
    { icon: Users, value: "10K+", label: "Students Guided" },
    { icon: Sparkles, value: "100%", label: "Personalized" },
  ]

  const popularCareers = [
    { icon: Code2, title: "Software Engineer", desc: "Build apps, websites & systems that power the world." },
    { icon: Stethoscope, title: "Doctor", desc: "Diagnose, treat and care for patients across specialties." },
    { icon: Rocket, title: "Entrepreneur", desc: "Build and scale your own business from the ground up." },
    { icon: Scale, title: "Lawyer", desc: "Advocate, advise and interpret the law professionally." },
    { icon: Plane, title: "Pilot", desc: "Fly commercial or private aircraft across the globe." },
    { icon: Shield, title: "IPS Officer", desc: "Lead law enforcement and public safety at scale." },
  ]

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
      </nav>

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
          <p>A small taste of the 300+ career paths we help you navigate.</p>
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
                <a href="#" className="career-card-link">
                  Explore Roadmap <ArrowRight size={14} />
                </a>
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
          <p>Create your free profile and get your personalized roadmap in minutes.</p>
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
            <a href="#">Pricing</a>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Contact</a>
            <a href="#">Blog</a>
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Futurixia — Guiding students to their dream careers, worldwide.</p>
        </div>
      </footer>
    </div>
  )
}

export default Home