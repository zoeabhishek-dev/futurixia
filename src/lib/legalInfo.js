// Central place for the facts that appear on the Privacy Policy, Terms of Service and consent screens.
// Fields left as "" are simply not shown on the public pages. Fill them in when you have the real details.
// Never put guessed or made-up details here.

export const LEGAL = {
  serviceName: "Futurixia",
  websiteUrl: "https://futurixia-delta.vercel.app",

  // Update both of these whenever the legal text changes in a way that needs people to agree again.
  lastUpdated: "6 November 2026",
  termsVersion: "2026-11-06",

  // Youngest age allowed to use Futurixia. Keep the same number inside the record_consent() function in Supabase.
  minimumAge: 13,

  // ---- To be provided by the owner (leave "" until you have them) ----
  operatorName: "", // legal name of the person or company that runs Futurixia
  operatorAddress: "", // postal or registered address
  contactEmail: "", // public support email address
  privacyEmail: "", // email for privacy requests (falls back to contactEmail)
  grievanceOfficerName: "",
  grievanceOfficerEmail: "",
  governingCity: "", // city whose courts will handle disputes
  databaseRegion: "", // where the Supabase project is hosted, for example "Mumbai, India"
}

export function privacyContact(info = LEGAL) {
  return info.privacyEmail || info.contactEmail
}
