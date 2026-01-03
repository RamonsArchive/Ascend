// src/constants/global.tsx
//
// Ascend — Global Marketing + Directory Constants
// - Clean marketing nav
// - Global events directory (/events) copy + filters
// - Home page sections (hero, features, how-it-works, sponsors, FAQ)
// - About + Contact copy
//
// Notes:
// - “Create Organization” lives in the app (/app, /app/new) not marketing nav.
// - “Events” is global and public so users can discover what’s live right now.
//

// add dashboard link
export const nav_links = [
  { label: "Home", href: "/", alt: "Home" },
  { label: "Events", href: "/events", alt: "Events" },
  { label: "About", href: "/about", alt: "About" },
  { label: "Contact", href: "/contact", alt: "Contact" },
  { label: "Dashboard", href: "/app", alt: "Dashboard" },
];

export const nav_cta = {
  label: "Open App",
  href: "/app",
  alt: "Open App",
} as const;

/* =========================
   HOME (/)
   ========================= */

export const global_home_data = {
  seo: {
    title: "Ascend — Multi-Org Hackathon & Ideathon Platform",
    description:
      "Ascend helps organizations run ideathons and hackathons with public event pages, teams, submissions, and judging — all in one platform.",
  },

  hero: {
    title: <>Ascend</>,
    subtitle: (
      <>
        Launch orgs, publish events, manage teams, and run judging end‑to‑end.
      </>
    ),
    description: (
      <>
        Create an organization, publish events, manage teams and submissions,
        and run judging end-to-end — without spreadsheets or chaos.
      </>
    ),
    primary_cta: { label: "Explore events", href: "/events" },
    secondary_cta: { label: "create an organization", href: "/app/orgs/new" },

    // Your hero carousel concept
    carousel: {
      caption: (
        <>
          Built for <span className="text-accent-500">builders</span>,{" "}
          <span className="text-secondary-500">judges</span>, and{" "}
          <span className="text-accent-500">organizers</span>.
        </>
      ),
      items: [
        { tag: "Software", alt: "Code project preview" },
        { tag: "Hardware", alt: "Physical prototype preview" },
        { tag: "Design", alt: "Pitch deck and UI preview" },
      ],
    },
    images: [
      { src: "/GlobalAssets/Hero/himg2.png", alt: "Image 1" },
      { src: "/GlobalAssets/Hero/himg1.jpg", alt: "Image 2" },
    ],
    buttons: [
      {
        label: "Explore events",
        href: "/events",
      },
      {
        label: "Create an organization",
        href: "/app/orgs/new",
      },
    ],
  },

  quick_value: {
    title: (
      <>
        Everything you need to run a{" "}
        <span className="text-secondary-500">high-signal</span> competition
      </>
    ),
    bullets: [
      "Multi-organization workspaces with role-based access",
      "Public event pages with rules, tracks, schedules, and sponsor sections",
      "Teams: find teams, request to join, invite by email, and cap team size",
      "Submissions: configurable requirements (repo, demo, images, hardware check-in)",
      "Judging: rubric scoring, judge assignments, rankings, and winners",
      "Audit logs for sensitive actions (kicks, leader transfer, approvals)",
    ],
  },

  sections: {
    features: {
      title: (
        <>
          From <span className="text-accent-500">launch</span> to{" "}
          <span className="text-secondary-500">winners</span>
        </>
      ),
      cards: [
        {
          title: "Organizations",
          desc: "Create a workspace for your club, lab, or sponsor program. Switch contexts like Notion/Vercel.",
        },
        {
          title: "Events",
          desc: "Publish public pages with schedules, tracks, rules, FAQs, prizes, and announcements.",
        },
        {
          title: "Teams + Matchmaking",
          desc: "Find teams, request to join, invite by email, and match based on skills/interests.",
        },
        {
          title: "Submissions",
          desc: "Flexible submission schemas: repo links, decks, videos, images, and hardware check-ins.",
        },
        {
          title: "Judging",
          desc: "Assign judges, score with rubric breakdowns, aggregate results, and publish winners.",
        },
        {
          title: "Controls",
          desc: "Role permissions, registration windows, team locks after start, and audit history.",
        },
      ],
    },

    how_it_works: {
      title: (
        <>
          Three steps to launch an{" "}
          <span className="text-secondary-500">event</span>
        </>
      ),
      steps: [
        {
          title: "Create an organization",
          desc: "Start a workspace for your club, department, or sponsor initiative.",
        },
        {
          title: "Publish an event",
          desc: "Add rules, tracks, dates, prizes, sponsors, and a submission flow — then publish.",
        },
        {
          title: "Run it end-to-end",
          desc: "Participants register, teams form, submissions come in, judges score, and winners go live.",
        },
      ],
    },

    sponsors: {
      // Keep sponsors as a HOME section. Add /sponsors only if it becomes a major marketing surface.
      title: (
        <>
          Built with <span className="text-accent-500">partners</span>
        </>
      ),
      description: (
        <>
          Events can showcase sponsors and partners with tiers, logos, links,
          prizes, and shoutouts.
        </>
      ),
      items: [
        { name: "Red Bull Student Chapter", tier: "Partner" },
        { name: "Celsius Student Chapter", tier: "Partner" },
      ],
      disclaimer: <>Sponsor listings are configured per event by organizers.</>,
    },

    faq: {
      title: (
        <>
          Quick <span className="text-secondary-500">answers</span>
        </>
      ),
      items: [
        {
          q: "Do event pages have to be public?",
          a: "Public event pages are recommended so participants can see rules, tracks, and deadlines. Organizers can also run unlisted or private events.",
        },
        {
          q: "How do teams form?",
          a: "Participants can create a team, invite members by email, or browse teams that are looking for members and request to join.",
        },
        {
          q: "Can teams be locked after the event starts?",
          a: "Yes. Events can lock team changes after start time to prevent last-minute reshuffles (with organizer override if needed).",
        },
        {
          q: "What can submissions require?",
          a: "Organizers define a submission schema: repo link, pitch deck, description, images, video demo, or hardware check-in instructions.",
        },
      ],
    },

    final_cta: {
      title: (
        <>
          Ready to build something <span className="text-accent-500">real</span>
          ?
        </>
      ),
      description: (
        <>
          Explore live events or create your own organization and launch your
          next ideathon or hackathon.
        </>
      ),
      actions: [
        { label: "Explore events", href: "/events" },
        { label: "Create a workspace", href: "/app/new" },
      ],
    },
  },
} as const;

/* =========================
   EVENTS DIRECTORY (/events)
   ========================= */

export const global_events_data = {
  seo: {
    title: "Events — Ascend",
    description:
      "Browse live hackathons and ideathons. Register, find a team, and ship your project.",
  },

  header: {
    title: (
      <>
        Live <span className="text-secondary-500">Events</span>
      </>
    ),
    subtitle: (
      <>
        Discover what’s running now — then{" "}
        <span className="text-accent-500">register</span>, find a team, and
        start building.
      </>
    ),
    ctas: {
      primary: { label: "Host an event", href: "/app/orgs/new" },
      helperText: "Host your own hackathon or ideathon",
    },
  },

  // Copy you can use above your event list
  join_flow: {
    title: <>How joining works</>,
    steps: [
      {
        title: "Open an event",
        desc: "Review rules, tracks, schedule, sponsors, and prizes on the public event page.",
      },
      {
        title: "Register (if open)",
        desc: "Events can be open, request-to-join, unlisted, or invite-only depending on organizer settings.",
      },
      {
        title: "Join or create a team",
        desc: "Browse teams looking for members, request to join, or join via an email invite link (team size limits enforced).",
      },
    ],
    rules: [
      "Registration closes at or before the event start time (no late joining).",
      "Teams can disable join requests, and events can lock team changes after start.",
    ],
  },

  orgs: {
    title: <>Explore organizations</>,
    subtitle:
      "Browse organizers and communities publishing events on Ascend — from studios to universities and guilds.",
    cta: { label: "Create an organization", href: "/app/orgs/new" },
  },

  events: {
    title: <>Explore events</>,
    subtitle:
      "Filter by format, find what’s starting soon, and jump into an event that matches your pace.",
  },

  // UI filter labels (map these to DB fields)
  filters: {
    searchPlaceholder: "Search events, orgs, tracks, or keywords…",
    chips: [
      { key: "all", label: "All" },
      { key: "hackathon", label: "Hackathons" },
      { key: "ideathon", label: "Ideathons" },
      { key: "open", label: "Open registration" },
      { key: "startingSoon", label: "Starting soon" },
    ],
    sort: {
      label: "Sort",
      options: [
        { key: "recommended", label: "Recommended" },
        { key: "soonest", label: "Soonest start" },
        { key: "deadline", label: "Registration deadline" },
        { key: "newest", label: "Newest" },
      ],
    },
  },

  empty_state: {
    title: <>No events found</>,
    description: (
      <>
        Try adjusting your filters — or open the app and create a new
        organization to publish your own event.
      </>
    ),
    action: { label: "Open App", href: "/app" },
  },
} as const;

/* =========================
   ABOUT (/about)
   ========================= */

export const global_about_data = {
  seo: {
    title: "About — Ascend",
    description:
      "Ascend is a multi-organization platform for running ideathons and hackathons with teams, submissions, and judging.",
  },

  header: {
    title: (
      <>
        About <span className="text-secondary-500">Ascend</span>
      </>
    ),
    intro: (
      <>
        Ascend is built to help organizations run competitions that feel{" "}
        <span className="text-accent-500">clean</span>, fair, and scalable —
        from the first announcement to the final winners.
      </>
    ),
  },

  founder: {
    title: "Meet the founder",
    description:
      "Frustraited at the choas of oragnizing hackathon and ideathon, events, Ramon saw a need for a platform that would help organizations run competitions that feel clean, fair, and scalable — from the first announcement to the final winners. So in this fractured landscape where there are no good options for an all in one platform, he decided to build his own.",
  },

  pillars: [
    {
      title: "Organizer-first",
      desc: "Publish event pages, manage registrations, teams, submissions, and judging — without spreadsheets.",
    },
    {
      title: "Participant-friendly",
      desc: "Clear deadlines, tracks, and rules — plus an account dashboard for teams + submissions.",
    },
    {
      title: "Enterprise-ready",
      desc: "Role-based access, audit logs, and safe data scoping per org and event.",
    },
  ],

  built_for: {
    title: (
      <>
        Built for <span className="text-accent-500">real</span> teams
      </>
    ),
    bullets: [
      "Student orgs and campus competitions",
      "Research labs and innovation programs",
      "Sponsor-backed challenges and prize tracks",
      "Community hackathons and weekend builds",
    ],
  },
} as const;

/* =========================
   DIGITAL REVOLUTION ABOUT (content block)
   ========================= */

export const ABOUT_DATA = {
  id: "about",
  text: {
    mainTitle: "About",
    missionTitle: "Mission Statement",
    descriptionTitle: "Mission Continued...",
    howToSupportTitle: "How to Support",
    founderTitle: "Our Founder",
    impactTitle: "Our Impact Areas",

    missionStatement:
      "Democracy and egalitarian values cannot be achieved and maintained if countries or communities are mere spectators and renters of the digital world.",

    aboutDescription:
      "Digital Revolution was founded in 2025 by Ramon McDargh-Mitchell to help spread awareness and support underprivileged communities who are left behind in the digital age, and thus have fewer opportunities to succeed in education, careers, and civic participation. The foundation donates 100% of donations and 50% of proceeds from the shop to causes that help address the digital divide and expand access to STEM education opportunities.",

    missionDescription:
      "Our mission is to protect and promote egalitarian democratic values that cannot be achieved or maintained when countries or communities are excluded from the digital age. We believe in universal access to the widespread knowledge of the internet, community ownership of data infrastructure, and the ability to participate in the digital world under self-determined rules and protections. We oppose systems that create digital renters rather than owners, which are inherently oppressive due to their lack of egalitarian rights and dependence on foreign managers whose interests may not align with local communities. By bridging the digital divide, we also create pathways for individuals to access STEM education, coding bootcamps, online learning platforms, and technology careers that were previously out of reach.",

    founderDescription:
      "Ramon McDargh-Mitchell is a technology advocate and digital rights activist with a background in software development, computer science education, and community organizing. With experience in both industry and academia, Ramon has seen how digital inequality creates barriers not just to information access, but to STEM career opportunities and educational advancement. Having witnessed firsthand the growing digital divide in underserved communities, Ramon founded Digital Revolution to bridge the gap between technological advancement and equitable access. Through this foundation, Ramon aims to ensure that technological progress serves humanity's democratic ideals while creating pathways for individuals to pursue careers in science, technology, engineering, and mathematics.",

    howToSupport:
      "There are many ways to support our mission: shop our newly released products in our store (with 50% of proceeds going directly to STEM education initiatives), make a direct donation to our cause (100% of donations go to STEM education initiatives), volunteer with partner organizations working on digital literacy and coding education, mentor individuals pursuing STEM careers, or simply share our mission with others in your community.",
  },

  impactAreas: [
    {
      title: "Digital Infrastructure Access",
      description:
        "Ensuring communities have reliable internet connectivity and modern computing resources",
      stemConnection:
        "Foundation for accessing online STEM courses, research databases, and coding platforms",
    },
    {
      title: "Digital Literacy Programs",
      description:
        "Teaching essential computer skills and internet safety to underserved populations",
      stemConnection:
        "Building prerequisite skills for STEM education and technology career pathways",
    },
    {
      title: "STEM Education Pathways",
      description:
        "Creating bridges to science, technology, engineering, and mathematics opportunities",
      stemConnection:
        "Coding bootcamps, online engineering courses, data science workshops, and tech mentorship",
    },
    {
      title: "Community Data Sovereignty",
      description:
        "Empowering local communities to own and control their digital infrastructure",
      stemConnection:
        "Training local technicians, network administrators, and cybersecurity professionals",
    },
  ],

  logo: {
    src: "/Logos/lightDRLogo.svg",
    alt: "Digital Revolution Logo",
  },

  images: [
    {
      src: "/GlobalAssets/About/ramon_mcdarghmitchell.png",
      alt: "Ramon McDargh-Mitchell",
      description: "Founder, technology advocate, and digital rights activist",
    },
  ],

  values: [
    {
      title: "Digital Equity",
      description:
        "Everyone deserves equal access to digital tools, opportunities, and STEM education pathways",
    },
    {
      title: "Community Ownership",
      description:
        "Local communities should control their digital infrastructure and technology education programs",
    },
    {
      title: "Transparent Impact",
      description:
        "100% of donations and 50% of proceeds from the shop directly fund digital divide and STEM accessibility initiatives",
    },
    {
      title: "Democratic Values",
      description:
        "Technology should strengthen democratic participation and create inclusive pathways to STEM careers",
    },
    {
      title: "Educational Opportunity",
      description:
        "Digital access should unlock doors to science, technology, engineering, and mathematics for all",
    },
  ],

  stats: {
    founded: "2025",
    profitsDonated: "100% donations, 50% shop proceeds",
    communitiesServed: "Growing daily",
    missionFocus:
      "Digital equity, democratic access, and STEM opportunity expansion",
    educationFocus: "Bridging digital divides to unlock STEM potential",
  },

  initiatives: [
    {
      name: "Digital Democracy Project",
      description:
        "Ensuring communities can participate fully in digital civic life",
    },
    {
      name: "STEM Bridge Program",
      description:
        "Creating pathways from digital literacy to technology careers",
    },
    {
      name: "Community Tech Hubs",
      description:
        "Establishing local centers for digital learning and STEM education",
    },
    {
      name: "Open Source Education",
      description:
        "Developing freely accessible STEM curricula and coding resources",
    },
  ],

  partnerships: {
    educational: "Universities, community colleges, and coding bootcamps",
    corporate:
      "Technology companies providing resources and internship opportunities",
    nonprofit:
      "Organizations focused on educational equity and community development",
    government:
      "Agencies working on digital inclusion and workforce development",
  },
} as const;

/* =========================
   CONTACT (/contact)
   ========================= */

export const global_contact_data = {
  seo: {
    title: "Contact — Ascend",
    description: "Questions, partnerships, or event support — reach out.",
  },

  hero: {
    eyebrow: "Contact",
    title: (
      <>
        Let’s build your next <span className="text-accent-500">event</span>
      </>
    ),
    description:
      "Questions, partnerships, or bringing Ascend to your organization — send a note and we’ll get back to you.",
  },

  formSection: {
    title: "Send a message",
    description:
      "Share a little context and we’ll reply with next steps. No spam — just a real response.",
    services: [
      "Event setup / onboarding",
      "Partnerships",
      "Product feedback",
      "Other",
    ],
    submitLabel: "Send message",
    successMessage: "Message sent — we’ll reply soon.",
  },

  linksSection: {
    title: "Find us online",
    description:
      "Use the social links below to reach us directly. (Contact links are sourced from the global links index.)",
  },
} as const;
