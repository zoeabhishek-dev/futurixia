// Vercel serverless function: permanently deletes the logged-in student's account and personal data.
// It runs on the server only. The service-role key comes from Vercel environment variables and is
// never sent to the browser.

import { createClient } from "@supabase/supabase-js"

// Every table that holds a student's personal data. All of them also have "on delete cascade" to the
// login, so deleting the login removes any row that is missed here.
// PAYMENT RECORDS: no payment table exists yet. When payments are added, do NOT delete legally required
// invoice records here; detach them from the person (or keep only what the law requires) instead.
const USER_TABLES = [
  ["career_day_responses", "user_id"],
  ["user_progress", "user_id"],
  ["student_skills", "user_id"],
  ["saved_careers", "user_id"],
  ["roadmap_completions", "user_id"],
  ["certificates", "user_id"],
  ["profiles", "id"],
]

// Removes spaces, quotes and a trailing slash that are easy to copy by mistake.
function clean(value) {
  return String(value || "")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .trim()
}

function cleanUrl(value) {
  return clean(value).replace(/\/(rest|auth)\/v1.*$/i, "").replace(/\/+$/, "")
}

// Tells which kind of key was pasted, so a wrong key is reported clearly.
function keyRole(key) {
  if (key.startsWith("sb_secret_")) return "service_role"
  if (key.startsWith("sb_publishable_")) return "anon"
  const parts = key.split(".")
  if (parts.length !== 3) return "unknown"
  try {
    const json = Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    return JSON.parse(json).role || "unknown"
  } catch (err) {
    return "unknown"
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store")

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Method not allowed." })
  }

  const url = cleanUrl(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)
  const serviceKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY)

  if (!url || !serviceKey) {
    return res.status(500).json({
      error: "Account deletion is not set up on the server yet (a Vercel setting is missing, or the site was not redeployed after adding it).",
    })
  }

  if (keyRole(serviceKey) === "anon") {
    return res.status(500).json({
      error: "The server key is the public (anon) key. In Vercel, SUPABASE_SERVICE_ROLE_KEY must be the service_role (secret) key.",
    })
  }

  const authHeader = req.headers.authorization || ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : ""
  if (!token) {
    return res.status(401).json({ error: "Please log out, log in again and retry." })
  }

  let body = req.body
  if (typeof body === "string") {
    try {
      body = JSON.parse(body)
    } catch (err) {
      body = {}
    }
  }
  if (!body || body.confirm !== "DELETE") {
    return res.status(400).json({ error: "Deletion was not confirmed." })
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // The person to delete is taken from the verified token, never from the request body.
  const { data: userData, error: userError } = await admin.auth.getUser(token)
  if (userError || !userData || !userData.user) {
    const detail = String((userError && userError.message) || "").toLowerCase()
    console.error("delete-account: could not verify the session:", detail || "no user returned")

    if (detail.includes("api key") || detail.includes("apikey")) {
      return res.status(500).json({
        error: "The server key for account deletion is not accepted by Supabase. Please re-copy the service_role key into Vercel.",
      })
    }
    if (detail.includes("fetch") || detail.includes("network") || detail.includes("enotfound") || detail.includes("econn")) {
      return res.status(500).json({
        error: "The server could not reach the database. Please check SUPABASE_URL in Vercel.",
      })
    }
    return res.status(401).json({ error: "Your session has expired. Please log out, log in again and retry." })
  }
  const userId = userData.user.id

  try {
    for (const [table, column] of USER_TABLES) {
      const { error } = await admin.from(table).delete().eq(column, userId)
      if (error) {
        // Logged on the server only. The cascade below still removes the rows if this table is unavailable.
        console.error(`delete-account: could not clear ${table}:`, error.message)
      }
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
    if (deleteError) {
      console.error("delete-account: could not delete login:", deleteError.message)
      return res.status(500).json({
        error: "We removed your data but could not finish removing your login. Please try again or contact us.",
      })
    }

    // Make sure the profile is really gone.
    const { data: left } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle()
    if (left) {
      return res.status(500).json({ error: "Deletion did not finish. Please try again or contact us." })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error("delete-account: unexpected error:", err && err.message)
    return res.status(500).json({ error: "Something went wrong. Please try again or contact us." })
  }
}