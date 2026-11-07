import { privacyContact } from "../lib/legalInfo"

// Each section: { id, title, body: [ "paragraph" | ["bullet", ...] | { note } | { table: { head, rows } } ] }
export function getPrivacySections(L) {
  const operator = L.operatorName ? `${L.operatorName}, which runs ${L.serviceName}` : L.serviceName
  const contact = privacyContact(L)
  const reach = contact
    ? `You can write to us at ${contact} or use the Contact Us form on the website.`
    : "You can reach us through the Contact Us form on the website."

  return [
    {
      id: "who-we-are",
      title: "Who we are and what this policy covers",
      body: [
        `${operator} (“we”, “us”) provides a career guidance website for students at ${L.websiteUrl}. This Privacy Policy explains what personal information we collect, why we collect it, who else handles it, how long we keep it and the choices you have.`,
        ...(L.operatorAddress ? [`Our address: ${L.operatorAddress}.`] : []),
        "By creating an account and accepting this policy, you agree to the practices described here. If you do not agree, please do not create an account.",
      ],
    },
    {
      id: "what-we-collect",
      title: "Information we collect",
      body: [
        "We collect only what the service needs to work:",
        [
          "Account details: your email address and sign-in method. If you sign in with a password, it is handled by our authentication provider (Supabase) and is not readable by us. If you choose “Continue with Google”, Google shares basic account details such as your name and email address with us.",
          "Profile details you enter: your name, age, country, education level, class or course, current stage, experience level, interests, skills and career goals.",
          "Learning activity: the roadmap steps you mark as done and when, the roadmaps you complete and the completion date, and the skills you list.",
          "Reflections: your multiple-choice answers in the “A Day in This Career” section, such as how a role felt to you, what you would do next and whether you tried the activity. These are saved to your account so you can see them again.",
          "Certificates (Pro Max): your name as entered in your profile, the career title, the number of steps completed, the issue date and a certificate ID.",
          "Plan and settings: your plan and its end date, your chosen theme, whether you have finished the welcome tour, and the date and version of the terms you accepted, including a parent or guardian confirmation if you are under 18.",
          "Messages you send us: if you use Contact Us or the career request form, we receive your name, email address and message.",
          "Anonymous feedback: your “Was this helpful?” answer and an optional comment of up to 300 characters. It is stored with a random identifier kept in your browser and is not linked to your account. Please do not write personal details in comments.",
          "Technical data: like most websites, our hosting and sign-in providers record technical information such as IP address, browser type and the pages requested, in server logs.",
        ],
        "Authorised administrators of Futurixia can access stored information in order to run and support the service.",
      ],
    },
    {
      id: "how-we-use",
      title: "How we use your information",
      body: [
        [
          "to create your account, keep it secure and sign you in",
          "to personalise your career roadmap using the details you entered (for example your stage, interests and skills), by applying fixed rules",
          "to save your progress and show your dashboard, personal career report and study plans",
          "to issue and verify certificates",
          "to manage your plan and the features that come with it",
          "to reply to your messages and requests",
          "to improve career pages using anonymous feedback",
          "to keep the service secure, prevent misuse and meet our legal obligations",
        ],
        "We do not sell your personal information, we do not show advertising and we do not use your information to build advertising profiles.",
      ],
    },
    {
      id: "students-under-18",
      title: "Students and users under 18",
      body: [
        `Futurixia is made for students. You must be at least ${L.minimumAge} years old to create an account.`,
        "If you are under 18, we ask you to confirm that a parent or guardian has read these documents and agrees to your use of Futurixia. We record that confirmation, with its date, against your account. This is a confirmation given by you; we do not independently verify the identity of the parent or guardian.",
        "We ask for your age as a number, not your date of birth, and we do not ask for your school, address or phone number.",
        "We do not use the information of any student for advertising, and we do not track students across other websites.",
        "A parent or guardian can ask us to explain what we hold about a child, correct it or delete it, using the contact details below. Students can delete their own account at any time from Account Settings.",
        "Indian data-protection law has specific rules for the personal data of children, including parental consent. We will update how we obtain and record consent as those rules come into force.",
      ],
    },
    {
      id: "certificates",
      title: "Certificates and public verification",
      body: [
        "Every certificate has a unique ID and a public verification page. Anyone who has the certificate ID or link can open that page without logging in.",
        { note: "The public verification page shows the holder’s name, the career, the number of steps completed and the completion date. Nothing else from your account is shown." },
        "You choose who receives your certificate link. If you delete your account, your certificates are deleted and their verification links stop working.",
      ],
    },
    {
      id: "feedback-reflections",
      title: "Feedback and reflections",
      body: [
        "Reflections in “A Day in This Career” are linked to your account and are visible only to you (and to authorised administrators). They are deleted with your account.",
        "Anonymous feedback is not linked to your account, so we cannot find it through your email address. If you wrote a comment and want it removed, contact us with the approximate date and the career page and we will try to locate it.",
      ],
    },
    {
      id: "third-parties",
      title: "Who else handles your information",
      body: [
        "We use the following service providers. They process information on our behalf to run the service. We do not allow them to use it for their own advertising.",
        {
          table: {
            head: ["Provider", "What it does for us", "Information involved"],
            rows: [
              ["Supabase", "Sign-in, database and secure server functions", "Email address, sign-in method, profile details, progress, reflections, certificates, plan, theme and consent records"],
              ["Vercel", "Hosts the website and the account-deletion service", "Technical data in server logs, and the sign-in token sent when you ask to delete your account"],
              ["Google", "Sign-in, only if you choose “Continue with Google”", "Name and email address from your Google account, as you authorise"],
              ["Formspree", "Delivers Contact Us and career-request messages to us", "The name, email address and message you type"],
            ],
          },
        },
        "Online payments are not available yet. When they are, we will name the payment provider in this policy and explain what payment information we keep.",
        "We may disclose information if the law requires it, or to protect the rights, safety and security of our users and the service.",
      ],
    },
    {
      id: "international",
      title: "Where information is processed",
      body: [
        L.databaseRegion
          ? `Our database is hosted in ${L.databaseRegion}. Our other providers may process information on servers in other countries.`
          : "Our providers may store and process information on servers in India or in other countries.",
        "By using Futurixia you understand that your information may be processed outside the country where you live.",
      ],
    },
    {
      id: "security",
      title: "How we protect information",
      body: [
        [
          "the website and the database are accessed over encrypted (HTTPS) connections",
          "access rules in the database let each student read and change only their own records",
          "secret keys for server functions are kept on the server and are never included in the website code",
          "access to the administration area is limited to authorised administrators",
        ],
        "No online service is completely secure, and we cannot guarantee absolute security. If a personal data breach affects you, we will inform you and the authorities as the law requires.",
        "Please keep your password private and log out on shared devices.",
      ],
    },
    {
      id: "cookies-storage",
      title: "Cookies and browser storage",
      body: [
        "Futurixia stores a few items in your browser so the service works:",
        [
          "your sign-in session, kept by our authentication provider",
          "your theme preference, so the site looks right before it finishes loading",
          "a marker that you have seen the welcome tour",
          "a random identifier used to keep anonymous feedback separate from any account",
        ],
        "At the date of this policy, Futurixia does not use advertising cookies or third-party analytics tools. You can clear this storage in your browser settings; you will be logged out.",
      ],
    },
    {
      id: "retention",
      title: "How long we keep information",
      body: [
        [
          "Account, profile, progress, reflections and certificates: for as long as your account exists. They are deleted when you delete your account.",
          "Messages you send through Contact Us: kept in our support inbox and form provider account so we can reply and keep a record. We do not currently delete them automatically; you can ask us to delete yours.",
          "Server logs: kept by our hosting and sign-in providers for the periods set by those providers.",
          "Backups: our database provider may keep backups for a limited period after you delete your account, after which they are removed.",
          "Records we must keep by law: none exist at the moment because paid plans cannot be bought online yet. When payments start, payment records will be kept for as long as the law requires.",
        ],
      ],
    },
    {
      id: "your-choices",
      title: "Your choices and rights",
      body: [
        [
          "See and correct your information: use Edit Profile on your dashboard.",
          "Delete your account and personal data: use Account Settings, then Delete account (see below).",
          "Ask for a copy of your information, ask us to correct something you cannot change yourself, or withdraw your consent: contact us.",
          "Parents and guardians can make these requests for a child.",
        ],
        "We will respond to requests as the law requires. If you are not satisfied with our response, please contact our grievance contact below.",
        "Withdrawing consent means we can no longer provide the service to you, because the service depends on the information described above.",
      ],
    },
    {
      id: "account-deletion",
      title: "Deleting your account",
      body: [
        "You can delete your account yourself in Account Settings. You will be asked to confirm, and deletion cannot be undone.",
        [
          "Deleted: your login, profile, progress, listed skills, saved careers, completed-roadmap history, reflections and certificates.",
          "Not deleted: anonymous feedback (it is not linked to your account), messages you sent to us, copies in provider backups for a limited period, and any records the law requires us to keep.",
        ],
        "If you have a paid plan and a question about it, please contact us before you delete your account.",
      ],
    },
    {
      id: "contact",
      title: "Contact us and grievances",
      body: [
        reach,
        ...(L.grievanceOfficerName || L.grievanceOfficerEmail
          ? [`Grievance contact: ${[L.grievanceOfficerName, L.grievanceOfficerEmail].filter(Boolean).join(", ")}.`]
          : []),
        ...(L.operatorAddress ? [`Postal address: ${L.operatorAddress}.`] : []),
      ],
    },
    {
      id: "changes",
      title: "Changes to this policy",
      body: [
        "We may update this policy from time to time. The “last updated” date at the top shows the current version. If a change is important, we will ask you to review and accept it again when you next sign in.",
        `Current version: ${L.lastUpdated}.`,
      ],
    },
  ]
}
