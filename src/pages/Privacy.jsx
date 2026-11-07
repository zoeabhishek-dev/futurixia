import LegalLayout from "../components/LegalLayout"
import { LEGAL } from "../lib/legalInfo"
import { getPrivacySections } from "../legal/privacyContent"

function Privacy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      intro="This policy explains, in plain language, what Futurixia collects about you, why, who helps us handle it, and how you can control it."
      sections={getPrivacySections(LEGAL)}
    />
  )
}

export default Privacy
