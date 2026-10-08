import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  GraduationCap,
  Sparkles,
  FolderKanban,
  Briefcase,
  FileCheck,
  Flag,
  CheckCircle2,
  Circle,
  Trophy,
  Compass,
  Map,
  Code2,
  Stethoscope,
  Rocket,
  Scale,
  Plane,
  Shield,
  Wrench,
  BarChart3,
  ShieldCheck,
  Palette,
  Cloud,
  Smartphone,
  TrendingUp,
  Landmark,
  Megaphone,
  Users,
  PieChart,
  HeartPulse,
  Pill,
  Building2,
  Zap,
  ChefHat,
  Newspaper,
  PenTool,
  Building,
  Brain,
  Clapperboard,
  Home,
  Shirt,
  Drama,
  PlaneTakeoff,
  Ship,
  LayoutGrid,
  PawPrint,
  Sofa,
  Droplets,
  Gavel,
  Activity,
  HandHeart,
  Sprout,
  Leaf,
  Radar,
  Flame,
  Calculator,
  Scan,
  Hotel,
  Truck,
  ShoppingBag,
  Globe2,
  Music,
  FileCheck2,
  Server,
  CalendarCheck,
  Languages,
  Eye,
  Bird,
  Anchor,
  CloudSun,
  Dumbbell,
  Mic,
  KeyRound,
  Smile,
  Film,
  ChartBar,
  Croissant,
  Camera,
  PersonStanding,
  Fish,
  Pickaxe,
  Bug,
  MessageSquare,
  Footprints,
  Mountain,
  Mic2,
  FlaskConical,
  Blocks,
  Wine,
  Receipt,
  Video,
  Database,
  Apple,
  FileSignature,
  Box,
  Swords,
  Gamepad2,
  FileText,
  Bot,
  Dna,
  FileType,
  Trees,
  Telescope,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Info,
  BookOpen,
  AlertTriangle,
  GitBranch,
} from "lucide-react"
import { supabase } from "../supabaseClient"
import PricingModal from "../components/PricingModal"
import {
  getPersonalizedRoadmap,
  getStepGuidance,
  matchResourcesForStep,
  groupResources,
  STAGE_LABELS,
} from "../lib/personalization"

const FREE_STEP_LIMIT = 10

const STEP_TYPE_ICONS = {
  education: GraduationCap,
  skill: Sparkles,
  project: FolderKanban,
  experience: Briefcase,
  exam: FileCheck,
  milestone: Flag,
}

const STEP_TYPE_COLORS = {
  education: "#a5b4fc",
  skill: "#67e8f9",
  project: "#fdba74",
  experience: "#86efac",
  exam: "#f9a8d4",
  milestone: "#fde047",
}

const CAREER_ICONS = {
  Code2, Stethoscope, Rocket, Scale, Plane, Shield, GraduationCap, Wrench,
  BarChart3, ShieldCheck, Palette, Cloud, Smartphone,
  TrendingUp, Landmark, Megaphone, Users, PieChart,
  HeartPulse, Pill, Building2, Zap, ChefHat, Newspaper, PenTool, Building, Brain, Clapperboard,
  Home, Shirt, Drama, PlaneTakeoff, Ship,
  LayoutGrid, PawPrint, Sofa, Droplets, Gavel,
  Activity, HandHeart,
  Trophy, Sprout, Leaf, Radar, Flame,
  Calculator, Scan, Map, Hotel,
  Truck, ShoppingBag, Globe2, Music, FileCheck2,
  Server, CalendarCheck, Languages, Eye, Bird,
  Anchor, CloudSun, Dumbbell, Mic, KeyRound,
  Smile, Film, ChartBar, Croissant,
  Camera, PersonStanding, Fish, Pickaxe,
  Bug, MessageSquare, Footprints, Mountain, Mic2,
  FlaskConical, Blocks, Wine, Receipt, Video,
  Database, Apple, FileSignature, Box, Swords,
  Gamepad2, FileText, Bot,
  Dna, FileType, Trees, Telescope,
}

function RoadmapDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [userId, setUserId] = useState(null)
  const [career, setCareer] = useState(null)
  const [introSteps, setIntroSteps] = useState([])
  const [coreSteps, setCoreSteps] = useState([])
  const [completedStepIds, setCompletedStepIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [savingStepId, setSavingStepId] = useState(null)
  const [countryNote, setCountryNote] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [resourcesList, setResourcesList] = useState([])
  const [stepLinks, setStepLinks] = useState([])
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [myStage, setMyStage] = useState(null)
  const [myCountry, setMyCountry] = useState(null)
  const [myTier, setMyTier] = useState(null)
  const [showPricing, setShowPricing] = useState(false)
  const [relatedCareers, setRelatedCareers] = useState([])
  const [showCareerInfo, setShowCareerInfo] = useState(false)

  const isPro = myTier === "pro" || myTier === "pro_max"

  useEffect(() => {
    const load = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user

        const { data: careerData, error: careerError } = await supabase
          .from("careers")
          .select("*")
          .eq("slug", slug)
          .maybeSingle()

        if (careerError || !careerData) {
          setLoading(false)
          return
        }

        setCareer(careerData)

        if (careerData.related_career_slugs) {
          const slugList = careerData.related_career_slugs
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)

          if (slugList.length > 0) {
            const { data: relatedData } = await supabase
              .from("careers")
              .select("title, slug, icon_name, category")
              .in("slug", slugList)

            if (relatedData) setRelatedCareers(relatedData)
          }
        }

        const { data: stepsData } = await supabase
          .from("roadmap_steps")
          .select("*")
          .eq("career_id", careerData.id)
          .order("step_order")

        const allSteps = stepsData || []

        if (!user) {
          const { introSteps: guestIntro, coreSteps: guestCore } = getPersonalizedRoadmap(
            { current_stage: null },
            allSteps
          )
          setIntroSteps(guestIntro)
          setCoreSteps(guestCore)
          setUserId(null)
          return
        }

        setUserId(user.id)

        const { data: profileData } = await supabase
          .from("profiles")
          .select("current_stage, experience_level, interests, skills, country, subscription_tier")
          .eq("id", user.id)
          .maybeSingle()

        const tier = profileData?.subscription_tier || "free"
        setMyTier(tier)
        const proNow = tier === "pro" || tier === "pro_max"

        const studentStage = profileData?.current_stage || null
        setMyStage(studentStage)
        setMyCountry(profileData?.country || null)

        if (profileData?.country) {
          const { data: noteData } = await supabase
            .from("career_country_notes")
            .select("note")
            .eq("career_id", careerData.id)
            .eq("country", profileData.country)
            .maybeSingle()

          if (noteData?.note) {
            setCountryNote(noteData.note)
          }
        }

        const { introSteps: matchedIntro, coreSteps: core } = getPersonalizedRoadmap(
          { ...profileData, current_stage: studentStage },
          allSteps
        )

        setIntroSteps(matchedIntro)
        setCoreSteps(core)

        if (proNow) {
          const { data: resourceData } = await supabase.from("resources").select("*")
          setResourcesList(resourceData || [])

          const stepIdsForLinks = allSteps.map((s) => s.id)
          if (stepIdsForLinks.length > 0) {
            const { data: linkData } = await supabase
              .from("step_resources")
              .select("step_id, resource_id")
              .in("step_id", stepIdsForLinks)
            setStepLinks(linkData || [])
          }
        }

        const { data: progressData } = await supabase
          .from("user_progress")
          .select("step_id")
          .eq("user_id", user.id)

        if (progressData) {
          const doneSet = new Set(progressData.map((p) => p.step_id))
          setCompletedStepIds(doneSet)

          const visibleNow = proNow
            ? [...matchedIntro, ...core]
            : core.slice(0, FREE_STEP_LIMIT)
          const firstOpen = visibleNow.find((s) => !doneSet.has(s.id))
          if (firstOpen && proNow) setExpandedIds(new Set([firstOpen.id]))
        }
      } catch (err) {
        setLoadError(true)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [slug])

  const toggleStep = async (stepId) => {
    if (!userId) {
      navigate("/login")
      return
    }
    if (savingStepId) return
    setSavingStepId(stepId)

    const isCompleted = completedStepIds.has(stepId)
    const fullSteps = [...introSteps, ...coreSteps]
    const visibleSteps = isPro ? fullSteps : coreSteps.slice(0, FREE_STEP_LIMIT)

    if (isCompleted) {
      await supabase
        .from("user_progress")
        .delete()
        .eq("user_id", userId)
        .eq("step_id", stepId)

      setCompletedStepIds((prev) => {
        const next = new Set(prev)
        next.delete(stepId)
        return next
      })

      await supabase
        .from("roadmap_completions")
        .delete()
        .eq("user_id", userId)
        .eq("career_id", career.id)
    } else {
      await supabase
        .from("user_progress")
        .insert({ user_id: userId, step_id: stepId })

      const updatedCompletedIds = new Set(completedStepIds).add(stepId)
      setCompletedStepIds(updatedCompletedIds)

      if (isPro) {
        const nextOpen = visibleSteps.find((s) => !updatedCompletedIds.has(s.id))
        if (nextOpen) setExpandedIds((prev) => new Set(prev).add(nextOpen.id))
      }

      const allNowDone =
        isPro && fullSteps.length > 0 && fullSteps.every((s) => updatedCompletedIds.has(s.id))

      if (allNowDone) {
        await supabase.from("roadmap_completions").upsert(
          {
            user_id: userId,
            career_id: career.id,
            total_steps: fullSteps.length,
            completed_at: new Date().toISOString(),
          },
          { onConflict: "user_id,career_id" }
        )
      }
    }

    setSavingStepId(null)
  }

  if (loading) {
    return (
      <div style={styles.centerPage}>
        <p>Loading roadmap...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div style={styles.centerPage}>
        <p style={{ maxWidth: 320, textAlign: "center", color: "#a9adc4" }}>
          We could not load this roadmap right now. Please check your connection and try refreshing the page.
        </p>
      </div>
    )
  }

  if (!career) {
    return (
      <div style={styles.centerPage}>
        <p>Career not found.</p>
        <button style={styles.backBtn} onClick={() => navigate("/careers")}>
          <ArrowLeft size={16} />
          Back to Careers
        </button>
      </div>
    )
  }

  const visibleIntroSteps = isPro ? introSteps : []
  const visibleCoreSteps = isPro ? coreSteps : coreSteps.slice(0, FREE_STEP_LIMIT)
  const combinedSteps = [...visibleIntroSteps, ...visibleCoreSteps]
  const lockedStepCount = isPro
    ? 0
    : introSteps.length + Math.max(coreSteps.length - FREE_STEP_LIMIT, 0)

  const completedCount = combinedSteps.filter((s) => completedStepIds.has(s.id)).length
  const progressPercent =
    combinedSteps.length > 0 ? Math.round((completedCount / combinedSteps.length) * 100) : 0

  const CareerIcon = CAREER_ICONS[career.icon_name] || Briefcase

  const focusStep = combinedSteps.find((s) => !completedStepIds.has(s.id)) || null
  const introDoneCount = visibleIntroSteps.filter((s) => completedStepIds.has(s.id)).length
  const stageLabel = myStage ? STAGE_LABELS[myStage] : null

  const resourceById = {}
  resourcesList.forEach((r) => {
    resourceById[r.id] = r
  })
  const explicitByStep = {}
  stepLinks.forEach((link) => {
    if (!resourceById[link.resource_id]) return
    if (!explicitByStep[link.step_id]) explicitByStep[link.step_id] = []
    explicitByStep[link.step_id].push(resourceById[link.resource_id])
  })

  const toggleExpanded = (stepId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(stepId)) next.delete(stepId)
      else next.add(stepId)
      return next
    })
  }

  const jumpToFocus = () => {
    if (!focusStep) return
    setExpandedIds((prev) => new Set(prev).add(focusStep.id))
    setTimeout(() => {
      const el = document.getElementById(`step-${focusStep.id}`)
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 50)
  }

  const hasCareerInfo =
    career.overview ||
    career.education_requirements ||
    career.exams_licensing ||
    career.core_skills ||
    career.work_environment ||
    career.career_progression ||
    career.career_reality ||
    career.common_challenges ||
    career.alternative_paths

  const renderStepCard = (step, displayNumber, isFirstCoreStep) => {
    const Icon = STEP_TYPE_ICONS[step.step_type] || CheckCircle2
    const color = STEP_TYPE_COLORS[step.step_type] || "#a5b4fc"
    const isDone = completedStepIds.has(step.id)
    const isFocus = focusStep ? focusStep.id === step.id : false
    const isExpanded = expandedIds.has(step.id)
    const guidance = getStepGuidance(step)
    const grouped = isPro
      ? groupResources(
          matchResourcesForStep(
            step,
            career,
            resourcesList,
            myCountry,
            explicitByStep[step.id] || []
          )
        )
      : { videos: [], official: [], learning: [] }
    const resourceCount = grouped.videos.length + grouped.learning.length + grouped.official.length

    return (
      <div key={step.id} id={`step-${step.id}`}>
        {isFirstCoreStep && (
          <div style={styles.sectionDivider}>
            <Map size={16} />
            <span>Full Career Roadmap</span>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.3 }}
          style={styles.stepRow}
          className="fx-step-row"
        >
          <div style={styles.stepLeft}>
            <div
              className="fx-step-icon-circle"
              style={{
                ...styles.stepIconCircle,
                background: isDone ? "rgba(34,197,94,0.25)" : `${color}2e`,
                color: isDone ? "#4ade80" : color,
                boxShadow: isDone
                  ? "0 0 0 2px rgba(74,222,128,0.5)"
                  : `0 0 0 2px ${color}55`,
              }}
            >
              <Icon size={18} strokeWidth={2} />
            </div>
            {displayNumber < combinedSteps.length && (
              <div
                style={{
                  ...styles.stepLine,
                  background: isDone ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.15)",
                }}
              />
            )}
          </div>

          <div
            style={{
              ...styles.stepCard,
              opacity: isDone ? 0.75 : 1,
              ...(isFocus ? styles.stepCardFocus : {}),
            }}
            className="fx-step-card"
          >
            <div style={styles.stepCardTop}>
              <span style={{ ...styles.stepBadge, color }}>
                Step {displayNumber} · {step.step_type}
                {step.phase === "intro" && " · Getting Started"}
                {isFocus && " · Your Focus Now"}
              </span>
              <button
                style={{
                  ...styles.checkBtn,
                  background: isDone ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.07)",
                  color: isDone ? "#4ade80" : "#9599b0",
                }}
                onClick={() => toggleStep(step.id)}
                disabled={savingStepId === step.id}
              >
                {isDone ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                {isDone ? "Done" : userId ? "Mark Done" : "Log In to Track"}
              </button>
            </div>

            <h3
              style={{
                ...styles.stepTitle,
                textDecoration: isDone ? "line-through" : "none",
              }}
            >
              {step.title}
            </h3>
            <p style={styles.stepDesc}>{step.description}</p>

            {isPro && step.estimated_time && (
              <span style={styles.estimatedTimePill}>
                Estimated time: {step.estimated_time}
              </span>
            )}

            {isPro && (
              <button
                style={styles.detailsToggle}
                onClick={() => toggleExpanded(step.id)}
                aria-expanded={isExpanded}
              >
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {isExpanded ? "Hide details" : "Show details & free resources"}
              </button>
            )}

            {isPro && isExpanded && step.why_it_matters && (
              <div style={styles.enrichedBox}>
                <span style={styles.enrichedLabel}>Why This Matters</span>
                <p style={styles.enrichedText}>{step.why_it_matters}</p>
              </div>
            )}

            {isPro && isExpanded && step.what_to_achieve && (
              <div style={styles.enrichedBox}>
                <span style={styles.enrichedLabel}>What You Should Achieve</span>
                <p style={styles.enrichedText}>{step.what_to_achieve}</p>
              </div>
            )}

            {isPro && isExpanded && step.practice_task && (
              <div style={styles.enrichedBox}>
                <span style={styles.enrichedLabel}>Practice Task</span>
                <p style={styles.enrichedText}>{step.practice_task}</p>
              </div>
            )}

            {isPro && isExpanded && !step.practice_task && guidance && (
              <div style={styles.enrichedBox}>
                <span style={styles.enrichedLabel}>How To Approach This Step</span>
                <p style={styles.enrichedText}>{guidance}</p>
              </div>
            )}

            {isPro && isExpanded && resourceCount > 0 && (
              <div style={styles.enrichedBox}>
                <span style={styles.enrichedLabel}>Free Resources</span>
                {[
                  { label: "Useful Videos", items: grouped.videos },
                  { label: "Free Learning Resources", items: grouped.learning },
                  { label: "Official Websites", items: grouped.official },
                ].map((group) =>
                  group.items.length > 0 ? (
                    <div key={group.label} style={{ marginTop: "8px" }}>
                      <p style={styles.resourceGroupLabel}>{group.label}</p>
                      {group.items.map((r) => (
                        <a
                          key={r.id}
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.resourceLink}
                        >
                          <span>
                            {r.title}
                            {r.provider ? ` · ${r.provider}` : ""}
                          </span>
                          <ExternalLink size={12} />
                        </a>
                      ))}
                    </div>
                  ) : null
                )}
              </div>
            )}

            {isPro && isExpanded && step.reasons && step.reasons.length > 0 && (
              <div style={styles.whyBox}>
                <span style={styles.whyLabel}>Why you are seeing this</span>
                <ul style={styles.whyList}>
                  {step.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div className="aurora-bg" style={{ opacity: 0.5 }}>
        <div className="aurora-blob blob-a" />
        <div className="aurora-blob blob-b" />
        <div className="aurora-blob blob-c" />
      </div>

      <nav style={styles.nav} className="fx-nav">
        <button style={styles.backBtn} onClick={() => navigate("/careers")}>
          <ArrowLeft size={16} />
          All Careers
        </button>
        <div style={styles.logo}>Futurixia</div>
        <span style={{ width: 110 }} />
      </nav>

      <div style={styles.content} className="fx-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={styles.heroCard}
          className="fx-hero-card"
        >
          <div style={styles.heroIconCircle}>
            <CareerIcon size={30} strokeWidth={1.8} />
          </div>

          <span style={styles.category}>{career.category}</span>
          <h1 style={styles.title} className="fx-hero-title">{career.title}</h1>
          <p style={styles.desc}>{career.short_description}</p>

          <div style={styles.statsRow} className="fx-stats-row">
            <div style={styles.statBox} className="fx-stat-box">
              <span style={styles.statLabel}>Average Salary</span>
              <span style={{ ...styles.statValue, color: "#4ade80" }}>
                {career.salary_range || "Not available yet"}
              </span>
            </div>
            <div style={styles.statBox} className="fx-stat-box">
              <span style={styles.statLabel}>Job Demand</span>
              <span style={{ ...styles.statValue, color: "#c4b5fd" }}>
                {career.job_demand || "Not available yet"}
              </span>
            </div>
          </div>

          {career.salary_range && myCountry && myCountry !== "India" && (
            <div style={styles.salaryNote}>
              <Info size={14} />
              <span>
                This salary figure reflects{" "}
                {career.salary_context ? career.salary_context.split(",")[0] : "India"}, since
                confirmed data for your own country is not yet available here.
              </span>
            </div>
          )}

          {career.salary_source && (
            <p style={styles.salarySource}>
              Source: {career.salary_source}
              {career.salary_year ? ` (${career.salary_year})` : ""}
            </p>
          )}

          <div style={styles.progressSection}>
            <div style={styles.progressBarTrack}>
              <motion.div
                style={styles.progressBarFill}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div style={styles.progressLabelRow}>
              <span style={styles.progressLabel}>
                {completedCount} of {combinedSteps.length} steps completed
              </span>
              {isPro && progressPercent === 100 && combinedSteps.length > 0 && (
                <span style={styles.completeBadge}>
                  <Trophy size={13} />
                  Roadmap Complete!
                </span>
              )}
            </div>
          </div>

          {countryNote && (
            <div style={styles.countryNoteBox}>
              <span style={styles.countryNoteLabel}>Note for Your Country</span>
              <p style={styles.countryNoteText}>{countryNote}</p>
            </div>
          )}

          {!userId && (
            <p style={styles.introMissingNote}>
              Log in and complete your profile to see more of this roadmap.
            </p>
          )}
          {userId && !isPro && introSteps.length > 0 && (
            <p style={styles.introMissingNote}>
              Upgrade to Pro to unlock the personalized starting steps chosen for your stage.
            </p>
          )}
          {userId && isPro && introSteps.length === 0 && (
            <p style={styles.introMissingNote}>
              Personalized starting steps for your stage are coming soon for this career, showing the full core roadmap below.
            </p>
          )}
        </motion.div>

        {hasCareerInfo && (
          <div style={styles.infoPanel}>
            <button
              style={styles.infoToggle}
              onClick={() => setShowCareerInfo((prev) => !prev)}
            >
              <BookOpen size={16} />
              {showCareerInfo ? "Hide Career Information" : "Read Full Career Information"}
              {showCareerInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showCareerInfo && (
              <div style={styles.infoBody}>
                {career.overview && (
                  <div style={styles.infoSection}>
                    <h4 style={styles.infoSectionTitle}>Overview</h4>
                    <p style={styles.infoSectionText}>{career.overview}</p>
                  </div>
                )}
                {career.education_requirements && (
                  <div style={styles.infoSection}>
                    <h4 style={styles.infoSectionTitle}>Education Requirements</h4>
                    <p style={styles.infoSectionText}>{career.education_requirements}</p>
                  </div>
                )}
                {career.exams_licensing && (
                  <div style={styles.infoSection}>
                    <h4 style={styles.infoSectionTitle}>Exams & Licensing</h4>
                    <p style={styles.infoSectionText}>{career.exams_licensing}</p>
                  </div>
                )}
                {career.core_skills && (
                  <div style={styles.infoSection}>
                    <h4 style={styles.infoSectionTitle}>Core Skills</h4>
                    <p style={styles.infoSectionText}>{career.core_skills}</p>
                  </div>
                )}
                {career.work_environment && (
                  <div style={styles.infoSection}>
                    <h4 style={styles.infoSectionTitle}>Work Environment</h4>
                    <p style={styles.infoSectionText}>{career.work_environment}</p>
                  </div>
                )}
                {career.career_progression && (
                  <div style={styles.infoSection}>
                    <h4 style={styles.infoSectionTitle}>Career Progression</h4>
                    <p style={styles.infoSectionText}>{career.career_progression}</p>
                  </div>
                )}
                {career.career_reality && (
                  <div style={styles.infoSection}>
                    <h4 style={styles.infoSectionTitle}>Career Reality</h4>
                    <p style={styles.infoSectionText}>{career.career_reality}</p>
                  </div>
                )}
                {career.common_challenges && (
                  <div style={styles.infoSection}>
                    <h4 style={styles.infoSectionTitle}>
                      <AlertTriangle size={14} style={{ marginRight: 5, verticalAlign: "-2px" }} />
                      Common Challenges
                    </h4>
                    <p style={styles.infoSectionText}>{career.common_challenges}</p>
                  </div>
                )}
                {career.alternative_paths && (
                  <div style={styles.infoSection}>
                    <h4 style={styles.infoSectionTitle}>
                      <GitBranch size={14} style={{ marginRight: 5, verticalAlign: "-2px" }} />
                      Alternative Career Paths
                    </h4>
                    <p style={styles.infoSectionText}>{career.alternative_paths}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {relatedCareers.length > 0 && (
          <div style={styles.relatedSection}>
            <h4 style={styles.infoSectionTitle}>Related Careers</h4>
            <div style={styles.relatedGrid}>
              {relatedCareers.map((rc) => {
                const RelatedIcon = CAREER_ICONS[rc.icon_name] || Briefcase
                return (
                  <div
                    key={rc.slug}
                    style={styles.relatedCard}
                    onClick={() => navigate(`/career/${rc.slug}`)}
                  >
                    <RelatedIcon size={18} strokeWidth={1.8} />
                    <span>{rc.title}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <h2 style={styles.roadmapHeading}>Your Complete Step-by-Step Roadmap</h2>

        {isPro && stageLabel && (
          <div style={styles.stageBanner}>
            <span style={styles.stageBannerLabel}>Your Stage: {stageLabel}</span>
            <p style={styles.stageBannerText}>
              The Getting Started steps below are chosen for your stage.
              {visibleIntroSteps.length > 0
                ? ` You have finished ${introDoneCount} of ${visibleIntroSteps.length} of them.`
                : ""}
            </p>
            {focusStep && (
              <button style={styles.jumpBtn} onClick={jumpToFocus}>
                <Crosshair size={14} />
                Jump to My Next Step
              </button>
            )}
          </div>
        )}

        {visibleIntroSteps.length > 0 && (
          <div style={styles.sectionDivider}>
            <Compass size={16} />
            <span>Getting Started From Where You Are</span>
          </div>
        )}

        <div style={styles.timeline}>
          {combinedSteps.map((step, i) =>
            renderStepCard(
              step,
              i + 1,
              visibleIntroSteps.length > 0 && i === visibleIntroSteps.length
            )
          )}
        </div>

        {lockedStepCount > 0 && (
          <div style={styles.upgradeBanner}>
            <span style={styles.upgradeBannerTitle}>
              {lockedStepCount} more personalized steps, free resources & videos are waiting
            </span>
            <p style={styles.upgradeBannerText}>
              {userId
                ? "Upgrade to Pro to unlock your full, personalized roadmap for this career."
                : "Log in and upgrade to Pro to unlock your full, personalized roadmap."}
            </p>
            <button style={styles.upgradeBannerBtn} onClick={() => setShowPricing(true)}>
              See Plans
            </button>
          </div>
        )}

        {combinedSteps.length === 0 && (
          <p style={styles.noSteps}>
            Roadmap content for this career is being added soon!
          </p>
        )}
      </div>

      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        studentCountry={myCountry}
      />
    </div>
  )
}

const styles = {
  page: {
    position: "relative",
    minHeight: "100vh",
    background: "#05070f",
    color: "#fff",
    fontFamily: "Inter, system-ui, sans-serif",
    overflow: "hidden",
  },
  centerPage: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    background: "#05070f",
    color: "#fff",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  nav: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "22px 40px",
    background: "rgba(5,7,15,0.75)",
    backdropFilter: "blur(14px)",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(255,255,255,0.09)",
    color: "#ffffff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "30px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  logo: {
    fontSize: "1.3rem",
    fontWeight: 800,
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  content: {
    position: "relative",
    zIndex: 1,
    maxWidth: "760px",
    margin: "0 auto",
    padding: "20px 24px 100px",
  },
  heroCard: {
    background: "rgba(15,17,32,0.85)",
    borderRadius: "24px",
    padding: "44px 40px 40px",
    textAlign: "center",
    margin: "20px 0 36px",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 20px 60px rgba(0,0,0,0.5)",
  },
  heroIconCircle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "64px",
    height: "64px",
    borderRadius: "18px",
    background: "rgba(99,102,241,0.16)",
    color: "#a5b4fc",
    margin: "0 auto 20px",
  },
  category: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#a5b4fc",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  title: {
    fontSize: "2.2rem",
    fontWeight: 800,
    margin: "10px 0 12px",
    color: "#ffffff",
  },
  desc: {
    color: "#c9cbdb",
    fontSize: "1rem",
    lineHeight: 1.6,
    maxWidth: "500px",
    margin: "0 auto",
  },
  statsRow: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: "28px",
  },
  statBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "16px",
    padding: "16px 26px",
    minWidth: "180px",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
  },
  statLabel: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#9599b0",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  statValue: {
    fontSize: "1.05rem",
    fontWeight: 800,
  },
  salaryNote: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    marginTop: "16px",
    background: "rgba(251,191,36,0.08)",
    borderRadius: "12px",
    padding: "10px 14px",
    color: "#e5d9b8",
    fontSize: "0.8rem",
    lineHeight: 1.5,
    textAlign: "left",
  },
  salarySource: {
    marginTop: "8px",
    fontSize: "0.72rem",
    color: "#7d8299",
    fontStyle: "italic",
  },
  progressSection: {
    marginTop: "28px",
    maxWidth: "420px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  progressBarTrack: {
    width: "100%",
    height: "10px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "10px",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    borderRadius: "10px",
  },
  progressLabelRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    marginTop: "10px",
    flexWrap: "wrap",
  },
  progressLabel: {
    color: "#9599b0",
    fontSize: "0.82rem",
  },
  completeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    background: "rgba(250,204,21,0.15)",
    color: "#fde047",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: 700,
  },
  countryNoteBox: {
    marginTop: "20px",
    background: "rgba(251,191,36,0.08)",
    borderRadius: "14px",
    padding: "14px 18px",
    textAlign: "left",
  },
  countryNoteLabel: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#fbbf24",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  countryNoteText: {
    marginTop: "6px",
    fontSize: "0.85rem",
    color: "#e5d9b8",
    lineHeight: 1.5,
  },
  introMissingNote: {
    marginTop: "20px",
    fontSize: "0.8rem",
    color: "#9599b0",
    fontStyle: "italic",
  },
  infoPanel: {
    marginBottom: "28px",
  },
  infoToggle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    color: "#c7d2fe",
    border: "none",
    padding: "14px",
    borderRadius: "16px",
    fontSize: "0.9rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
  },
  infoBody: {
    marginTop: "16px",
    background: "rgba(15,17,32,0.6)",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
  },
  infoSection: {
    marginBottom: "20px",
  },
  infoSectionTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#a5b4fc",
    marginBottom: "6px",
  },
  infoSectionText: {
    color: "#c9cbdb",
    fontSize: "0.88rem",
    lineHeight: 1.6,
  },
  relatedSection: {
    marginBottom: "28px",
  },
  relatedGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "10px",
  },
  relatedCard: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "30px",
    padding: "10px 18px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#e0e1ff",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
  },
  roadmapHeading: {
    textAlign: "center",
    fontSize: "1.3rem",
    fontWeight: 800,
    color: "#ffffff",
    margin: "0 0 30px",
  },
  stageBanner: {
    background: "rgba(99,102,241,0.1)",
    borderRadius: "16px",
    padding: "16px 20px",
    marginBottom: "28px",
    textAlign: "center",
  },
  stageBannerLabel: {
    fontSize: "0.8rem",
    fontWeight: 700,
    color: "#a5b4fc",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  stageBannerText: {
    marginTop: "6px",
    color: "#c9cbdb",
    fontSize: "0.88rem",
    lineHeight: 1.5,
  },
  jumpBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "12px",
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "30px",
    fontSize: "0.85rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  sectionDivider: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#a5b4fc",
    fontSize: "0.85rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    margin: "0 0 20px 4px",
  },
  timeline: {
    display: "flex",
    flexDirection: "column",
  },
  stepRow: {
    display: "flex",
    gap: "20px",
  },
  stepLeft: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  stepIconCircle: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "background 0.2s ease, color 0.2s ease",
  },
  stepLine: {
    width: "2px",
    flex: 1,
    margin: "6px 0",
    transition: "background 0.2s ease",
  },
  stepCard: {
    flex: 1,
    background: "rgba(15,17,32,0.85)",
    borderRadius: "18px",
    padding: "22px 24px",
    marginBottom: "24px",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.09), 0 10px 30px rgba(0,0,0,0.35)",
    transition: "opacity 0.2s ease",
  },
  stepCardFocus: {
    boxShadow: "0 0 0 2px rgba(34,211,238,0.55), 0 10px 30px rgba(0,0,0,0.35)",
  },
  stepCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  checkBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    border: "none",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  stepBadge: {
    fontSize: "0.72rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  stepTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    margin: "10px 0 8px",
    color: "#ffffff",
  },
  stepDesc: {
    color: "#c2c4d6",
    fontSize: "0.92rem",
    lineHeight: 1.6,
  },
  estimatedTimePill: {
    display: "inline-block",
    marginTop: "10px",
    background: "rgba(34,211,238,0.12)",
    color: "#67e8f9",
    fontSize: "0.78rem",
    fontWeight: 700,
    padding: "5px 12px",
    borderRadius: "20px",
  },
  detailsToggle: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "12px",
    background: "rgba(255,255,255,0.07)",
    color: "#c7d2fe",
    border: "none",
    padding: "8px 14px",
    borderRadius: "20px",
    fontSize: "0.78rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  resourceGroupLabel: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#9599b0",
    marginBottom: "4px",
  },
  resourceLink: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    color: "#67e8f9",
    textDecoration: "none",
    fontSize: "0.85rem",
    padding: "8px 0",
    wordBreak: "break-word",
  },
  enrichedBox: {
    marginTop: "12px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "10px",
    padding: "10px 14px",
  },
  enrichedLabel: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#a5b4fc",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  enrichedText: {
    marginTop: "6px",
    color: "#c9cbdb",
    fontSize: "0.85rem",
    lineHeight: 1.5,
  },
  whyBox: {
    marginTop: "12px",
    background: "rgba(99,102,241,0.08)",
    borderRadius: "10px",
    padding: "10px 14px",
  },
  whyLabel: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#a5b4fc",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  whyList: {
    margin: "6px 0 0",
    paddingLeft: "18px",
    color: "#c9cbdb",
    fontSize: "0.85rem",
    lineHeight: 1.5,
  },
  upgradeBanner: {
    background: "rgba(99,102,241,0.1)",
    borderRadius: "18px",
    padding: "26px 24px",
    textAlign: "center",
    marginTop: "10px",
  },
  upgradeBannerTitle: {
    display: "block",
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#fff",
    marginBottom: "6px",
  },
  upgradeBannerText: {
    color: "#c9cbdb",
    fontSize: "0.85rem",
    marginBottom: "16px",
  },
  upgradeBannerBtn: {
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    color: "#fff",
    border: "none",
    padding: "12px 28px",
    borderRadius: "30px",
    fontSize: "0.88rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  noSteps: {
    textAlign: "center",
    color: "#9599b0",
    padding: "40px 0",
  },
}

export default RoadmapDetail