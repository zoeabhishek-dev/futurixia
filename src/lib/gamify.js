import { supabase } from "../supabaseClient"

export function userTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null
  } catch (err) {
    return null
  }
}

// Reads the student's XP, level, streak, today's missions and badges from the database.
export async function fetchOverview() {
  const { data, error } = await supabase.rpc("fx_get_overview", { p_timezone: userTimezone() })
  if (error || !data) {
    if (error) console.warn("Futurixia: could not load progress and missions:", error.message)
    return null
  }
  return data
}

// Refreshes everything and tells the rest of the app (the XP pop-up listens for this).
export async function syncGamification() {
  try {
    const data = await fetchOverview()
    if (data) window.dispatchEvent(new CustomEvent("fx-gamify", { detail: data }))
    return data
  } catch (err) {
    return null
  }
}

async function logEvent(kind, refId) {
  const { data } = await supabase.auth.getSession()
  if (!data?.session) return false
  const { error } = await supabase.rpc("fx_log_event", {
    p_kind: kind,
    p_ref: refId || null,
    p_timezone: userTimezone(),
  })
  return !error
}

// Called when a logged-in student opens a career page.
export async function trackCareerView(careerId) {
  try {
    if (await logEvent("career_viewed", careerId)) await syncGamification()
  } catch (err) {
    // Progress tracking must never get in the way of the page.
  }
}

// Called when a logged-in student opens their Personal Career Report.
export async function trackReportView() {
  try {
    if (await logEvent("report_viewed", null)) await syncGamification()
  } catch (err) {
    // Progress tracking must never get in the way of the page.
  }
}
