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

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store")

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Method not allowed." })
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return res.status(500).json({ error: "Account deletion is not set up on the server yet. Please contact us." })
  }

  const authHeader = req.headers.authorization || ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : ""
  if (!token) {
    return res.status(401).json({ error: "Please log in again and retry." })
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
    return res.status(401).json({ error: "Your session has expired. Please log in again and retry." })
  }
  const userId = userData.user.id

  try {
    for (const [table, column] of USER_TABLES) {
      const { error } = await admin.from(table).delete().eq(column, userId)
      if (error) {
        // Log on the server only. The cascade below still removes the rows if this table is unavailable.
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
