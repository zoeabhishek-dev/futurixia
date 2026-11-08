import { formatPrice } from "../lib/plans"
import { privacyContact } from "../lib/legalInfo"

export function getTermsSections(L, plans) {
  const operator = L.operatorName ? `${L.operatorName}, which runs ${L.serviceName}` : L.serviceName
  const contact = privacyContact(L)
  const support = contact
    ? `You can contact us at ${contact} or through the Contact Us form on the website.`
    : "You can contact us through the Contact Us form on the website."

  const planLines = plans.map(
    (p) => `${p.name}: ${formatPrice(p.price)}${p.price === 0 ? "" : " per month, as shown on the pricing page"}. ${p.features.join("; ")}.`
  )

  return [
    {
      id: "about",
      title: "About these terms",
      body: [
        `These Terms of Service govern your use of ${L.serviceName} at ${L.websiteUrl}, which is run by ${operator === L.serviceName ? "us" : operator} (“we”, “us”). By creating an account or using the service you agree to these terms and to our Privacy Policy. If you do not agree, please do not use Futurixia.`,
        ...(L.operatorAddress ? [`Our address: ${L.operatorAddress}.`] : []),
      ],
    },
    {
      id: "eligibility",
      title: "Who can use Futurixia",
      body: [
        [
          `You must be at least ${L.minimumAge} years old to create an account.`,
          "If you are under 18, you may use Futurixia only with the permission of a parent or guardian, who should read these terms and the Privacy Policy. When you accept them, you confirm that you have that permission.",
          "You must give accurate information in your profile, including your age.",
          "Paid plans: a person under 18 may not be able to enter a binding purchase under Indian law, so a parent, guardian or adult should make any purchase for a student under 18.",
        ],
      ],
    },
    {
      id: "account",
      title: "Your account and its security",
      body: [
        [
          "You are responsible for keeping your password and your device secure and for what happens under your account.",
          "One account is for one person. Please do not share your login.",
          "Tell us promptly if you think someone else has accessed your account.",
          "Do not try to change your plan, certificates or other records in ways the service does not offer.",
        ],
      ],
    },
    {
      id: "plans",
      title: "Plans and features",
      body: [
        "Futurixia offers these plans. Prices are in Indian rupees (₹).",
        planLines,
        "Free accounts use the Aurora theme. Pro and Pro Max accounts can change their theme from the dashboard. Features can be added, changed or removed over time; we will update this page when that happens.",
      ],
    },
    {
      id: "payments",
      title: "Payments",
      body: [
        { note: "Online payment is not available yet. Paid plans cannot currently be bought on the website." },
        "When online payment is introduced, we will use a payment provider, name it in our Privacy Policy and show the price before you pay. A paid plan will be switched on only after we receive confirmation that your payment succeeded.",
        "Nothing in these terms limits any right you have under applicable consumer law.",
      ],
    },
    {
      id: "expiry",
      title: "Plan period and expiry",
      body: [
        "Each paid plan has an end date recorded on your account. When it ends, your account returns to the Free plan. Features that belong to paid plans stop working, and your theme goes back to the Free theme.",
        "Your profile, progress and reflections stay on your account. Certificates you were already issued stay valid and can still be verified, unless you delete your account.",
        "At the moment plans do not renew automatically and we do not charge you automatically. If that ever changes, we will tell you before any charge and update these terms.",
      ],
    },
    {
      id: "cancellation-refunds",
      title: "Cancellation, refunds and failed payments",
      body: [
        "Because plans do not renew automatically, there is nothing to cancel. You can stop using Futurixia, or delete your account, at any time.",
        "Our refund terms will be published on this page before any paid plan is offered for sale. Until then, no paid purchase is possible.",
        "When online payment is introduced, a plan will not be switched on if a payment fails, and may be switched off if a payment is reversed.",
      ],
    },
    {
      id: "guidance-disclaimer",
      title: "Career guidance disclaimer",
      body: [
        "Futurixia gives general information to help students explore careers. It is not professional, legal, financial, medical or educational advice, and it does not guarantee admission to any course or institution, a job, a salary or any other outcome.",
        [
          "Entry routes, exams, eligibility rules, fees and salaries change. Always check important details with the official institution, exam body or employer.",
          "“A Day in This Career” pages are general illustrations written by Futurixia. They are not first-hand accounts and have not yet been reviewed by practising professionals.",
          "Study plans, skill checks and reports are based on the information you enter and on fixed rules. They are suggestions, not predictions.",
          "Links and resources from other websites belong to their owners. We do not control them and are not responsible for their content.",
        ],
      ],
    },
    {
      id: "certificates",
      title: "Certificates",
      body: [
        "A Futurixia certificate shows that you completed every step of a self-guided roadmap on Futurixia. It is not a professional licence, a degree or an academic qualification.",
        "Each certificate has a public verification page showing the holder’s name, the career, the number of steps and the completion date. We may withdraw a certificate that was issued by mistake or obtained by misusing the service.",
      ],
    },
    {
      id: "your-content",
      title: "Feedback and what you submit",
      body: [
        "You keep ownership of what you write, such as feedback and messages. You give us permission to use it to run and improve Futurixia. Please keep comments free of personal details, and do not post anything unlawful or abusive.",
      ],
    },
    {
      id: "ownership",
      title: "Our content and intellectual property",
      body: [
        "The Futurixia name, logo, design, career roadmaps, descriptions and other content are owned by us or used with permission. You may use them for your own personal, non-commercial career planning. You may not copy, sell, republish or build a competing service from them without our written permission.",
      ],
    },
    {
      id: "prohibited",
      title: "What you must not do",
      body: [
        [
          "scrape, copy in bulk or reverse engineer the service",
          "attack, overload or probe the security of the service, or access other people’s data",
          "create accounts by automated means or with false details",
          "bypass plan restrictions or alter your plan, theme, progress or certificates by any means other than the service",
          "forge, alter or misuse certificates or the verification page",
          "send abusive, unlawful or misleading messages through our forms",
        ],
      ],
    },
    {
      id: "suspension",
      title: "Suspension and termination",
      body: [
        "We may suspend or close an account if these terms are broken, if the law requires it, or to protect users and the service. Where we reasonably can, we will tell you why.",
        "You can delete your account at any time in Account Settings. What happens to your data is described in the Privacy Policy.",
      ],
    },
    {
      id: "availability",
      title: "Availability and maintenance",
      body: [
        "We try to keep Futurixia available, but we do not promise it will always be free from interruptions or errors. We may pause the service for maintenance, security or other reasons, and we may change or discontinue features. If we change a price, the new price will be shown before you buy.",
      ],
    },
    {
      id: "liability",
      title: "Our responsibility to you",
      body: [
        "Futurixia is provided “as is” and “as available”. To the extent the law allows, we are not responsible for indirect or consequential loss, or for decisions you make about education, careers or money using information on the service.",
        "Nothing in these terms limits any liability that cannot be limited by law.",
      ],
    },
    {
      id: "law",
      title: "Governing law and disputes",
      body: [
        "These terms are governed by the laws of India.",
        "If you have a problem, please contact us first so we can try to resolve it informally.",
        L.governingCity
          ? `Disputes that cannot be settled informally will be subject to the courts at ${L.governingCity}, India, which have jurisdiction.`
          : "Disputes that cannot be settled informally will be subject to the competent courts in India.",
      ],
    },
    {
      id: "support",
      title: "Support and grievances",
      body: [
        support,
        ...(L.grievanceOfficerName || L.grievanceOfficerEmail
          ? [`Grievance contact: ${[L.grievanceOfficerName, L.grievanceOfficerEmail].filter(Boolean).join(", ")}.`]
          : []),
      ],
    },
    {
      id: "changes",
      title: "Changes to these terms",
      body: [
        `We may update these terms. The “last updated” date shows the current version (${L.lastUpdated}). If a change is important, we will ask you to review and accept the new version when you next sign in. If you keep using Futurixia after a change takes effect, you accept the updated terms.`,
        "If any part of these terms is found to be unenforceable, the rest stays in effect. If we do not enforce a term straight away, that does not mean we have given it up.",
      ],
    },
  ]
}
