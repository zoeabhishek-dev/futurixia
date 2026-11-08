import LegalLayout from "../components/LegalLayout"
import { LEGAL } from "../lib/legalInfo"
import { PLANS } from "../lib/plans";
import { getTermsSections } from "../legal/termsContent"

function Terms() {
  return (
    <LegalLayout
      title="Terms of Service"
      intro="These terms explain the rules for using Futurixia, what each plan includes and what you can expect from us."
      sections={getTermsSections(LEGAL, PLANS)}
    />
  )
}

export default Terms
