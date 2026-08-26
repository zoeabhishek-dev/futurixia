import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  User,
  GraduationCap,
  Sparkles,
  Wrench,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Check,
  Loader2,
  Search,
  ChevronDown,
} from "lucide-react"
import { supabase } from "../supabaseClient"
import { COUNTRIES } from "../data/countries"
import "./CreateProfile.css"

const EDUCATION_LEVELS = [
  "Middle School", "High School", "Undergraduate", "Postgraduate", "Working Professional",
]

const STAGE_OPTIONS = [
  { value: "pre_secondary", label: "8th or 9th Grade" },
  { value: "secondary", label: "10th Grade" },
  { value: "senior_secondary", label: "11th / 12th Grade (Inter)" },
  { value: "undergraduate", label: "Undergraduate (Bachelor's Degree)" },
  { value: "postgraduate_professional", label: "Postgraduate / Working Professional" },
]

const INTEREST_PRESETS = [
  "Technology", "Design", "Business", "Science", "Arts", "Sports",
  "Writing", "Music", "Healthcare", "Law", "Environment", "Finance",
  "Engineering", "Aviation", "Social Work", "Media",
]

const SKILL_PRESETS = [
  "Communication", "Leadership", "Coding", "Public Speaking",
  "Problem Solving", "Teamwork", "Creativity", "Research",
  "Critical Thinking", "Time Management", "Design Tools", "Data Analysis",
]

const STEPS = ["Basics", "Education", "Interests", "Skills"]

function CountrySelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const wrapperRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filtered = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="country-select-wrap" ref={wrapperRef}>
      <button
        type="button"
        className="country-select-trigger"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={value ? "" : "country-placeholder"}>
          {value || "Select your country"}
        </span>
        <ChevronDown size={16} />
      </button>

      {open && (
        <div className="country-dropdown">
          <div className="country-search-row">
            <Search size={15} />
            <input
              type="text"
              autoFocus
              placeholder="Search countries..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="country-list">
            {filtered.length === 0 && (
              <div className="country-empty">No countries found</div>
            )}
            {filtered.map((c) => (
              <div
                key={c}
                className={`country-option ${c === value ? "country-option-active" : ""}`}
                onClick={() => {
                  onChange(c)
                  setOpen(false)
                  setQuery("")
                }}
              >
                {c === value && <Check size={14} />}
                {c}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ChipPicker({ presets, selected, onToggle, onAddCustom, placeholder }) {
  const [customText, setCustomText] = useState("")

  const handleAdd = () => {
    const trimmed = customText.trim()
    if (trimmed && !selected.includes(trimmed)) {
      onAddCustom(trimmed)
      setCustomText("")
    }
  }

  return (
    <div className="chip-picker">
      <div className="chip-grid">
        {presets.map((item) => {
          const isSelected = selected.includes(item)
          return (
            <button
              type="button"
              key={item}
              className={`chip-option ${isSelected ? "chip-selected" : ""}`}
              onClick={() => onToggle(item)}
            >
              {isSelected && <Check size={14} />}
              {item}
            </button>
          )
        })}
      </div>

      <div className="custom-add-row">
        <input
          type="text"
          placeholder={placeholder}
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
        <button type="button" className="add-btn" onClick={handleAdd}>
          <Plus size={16} />
        </button>
      </div>

      {selected.filter((s) => !presets.includes(s)).length > 0 && (
        <div className="custom-tags">
          {selected
            .filter((s) => !presets.includes(s))
            .map((tag) => (
              <span className="custom-tag" key={tag}>
                {tag}
                <X size={13} onClick={() => onToggle(tag)} />
              </span>
            ))}
        </div>
      )}
    </div>
  )
}

function CreateProfile() {
  const navigate = useNavigate()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const [fullName, setFullName] = useState("")
  const [age, setAge] = useState("")
  const [country, setCountry] = useState("")
  const [educationLevel, setEducationLevel] = useState("")
  const [classOrCourse, setClassOrCourse] = useState("")
  const [currentStage, setCurrentStage] = useState("")
  const [interests, setInterests] = useState([])
  const [skills, setSkills] = useState([])

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data?.user) {
        navigate("/login")
      } else {
        setCheckingAuth(false)
      }
    }
    checkUser()
  }, [navigate])

  const toggleInterest = (item) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    )
  }

  const toggleSkill = (item) => {
    setSkills((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    )
  }

  const canGoNext = () => {
    if (step === 0) return fullName.trim() && age && country
    if (step === 1) return educationLevel && classOrCourse.trim() && currentStage
    if (step === 2) return interests.length > 0
    if (step === 3) return skills.length > 0
    return true
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleSubmit = async () => {
    setErrorMsg("")
    setSaving(true)

    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user

    if (!user) {
      setErrorMsg("You must be logged in.")
      setSaving(false)
      return
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName.trim(),
      age: parseInt(age, 10),
      country,
      education_level: educationLevel,
      class_or_course: classOrCourse.trim(),
      current_stage: currentStage,
      interests: interests.join(", "),
      skills: skills.join(", "),
    })

    setSaving(false)

    if (error) {
      setErrorMsg(error.message)
    } else {
      navigate("/dashboard")
    }
  }

  if (checkingAuth) {
    return (
      <div className="profile-page">
        <Loader2 size={28} className="spin" />
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="aurora-bg">
        <div className="aurora-blob blob-a" />
        <div className="aurora-blob blob-b" />
        <div className="aurora-blob blob-c" />
      </div>

      <motion.div
        className="profile-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="progress-track">
          {STEPS.map((label, i) => (
            <div key={label} className="progress-step-wrap">
              <div className={`progress-dot ${i <= step ? "progress-dot-active" : ""}`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className={`progress-label ${i === step ? "progress-label-active" : ""}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="step-heading">
                <User size={22} />
                <h2>Tell us about you</h2>
              </div>

              <label className="field-label">Full Name</label>
              <input
                type="text"
                className="field-input"
                placeholder="e.g. Priya Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <label className="field-label">Age</label>
              <input
                type="number"
                className="field-input"
                placeholder="e.g. 17"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min={5}
                max={100}
              />

              <label className="field-label">Country</label>
              <CountrySelect value={country} onChange={setCountry} />
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="step-heading">
                <GraduationCap size={22} />
                <h2>Your education</h2>
              </div>

              <label className="field-label">Education Level</label>
              <select
                className="field-input"
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
              >
                <option value="">Select education level</option>
                {EDUCATION_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>

              <label className="field-label">Class / Course</label>
              <input
                type="text"
                className="field-input"
                placeholder="e.g. 12th Grade - Science, or B.Tech 2nd Year"
                value={classOrCourse}
                onChange={(e) => setClassOrCourse(e.target.value)}
              />

              <label className="field-label">Current Stage (for a personalized roadmap)</label>
              <select
                className="field-input"
                value={currentStage}
                onChange={(e) => setCurrentStage(e.target.value)}
              >
                <option value="">Select your current stage</option>
                {STAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="step-heading">
                <Sparkles size={22} />
                <h2>What are you interested in?</h2>
              </div>
              <p className="step-subtext">Pick as many as you like, or add your own.</p>

              <ChipPicker
                presets={INTEREST_PRESETS}
                selected={interests}
                onToggle={toggleInterest}
                onAddCustom={(val) => setInterests((prev) => [...prev, val])}
                placeholder="Type a custom interest and press Enter"
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="step-heading">
                <Wrench size={22} />
                <h2>What skills do you have?</h2>
              </div>
              <p className="step-subtext">Pick as many as you like, or add your own.</p>

              <ChipPicker
                presets={SKILL_PRESETS}
                selected={skills}
                onToggle={toggleSkill}
                onAddCustom={(val) => setSkills((prev) => [...prev, val])}
                placeholder="Type a custom skill and press Enter"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {errorMsg && <p className="profile-error">{errorMsg}</p>}

        <div className="step-actions">
          {step > 0 ? (
            <button type="button" className="back-btn" onClick={handleBack}>
              <ArrowLeft size={16} />
              Back
            </button>
          ) : (
            <span />
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              className="next-btn"
              onClick={handleNext}
              disabled={!canGoNext()}
            >
              Next
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="next-btn"
              onClick={handleSubmit}
              disabled={!canGoNext() || saving}
            >
              {saving ? <Loader2 size={16} className="spin" /> : (
                <>
                  Finish
                  <Check size={16} />
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default CreateProfile