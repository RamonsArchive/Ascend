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

export const nav_links = [
  { label: "Home", href: "/", alt: "Home" },
  { label: "Events", href: "/events", alt: "Events" },
  { label: "About", href: "/about", alt: "About" },
  { label: "Contact", href: "/contact", alt: "Contact" },
] as const;

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
        Run <span className="text-secondary-500">ideathons</span> and{" "}
        <span className="text-accent-500">hackathons</span> with an{" "}
        <span className="text-secondary-500">enterprise</span>-grade workspace.
      </>
    ),
    description: (
      <>
        Create an organization, publish events, manage teams and submissions,
        and run judging end-to-end — without spreadsheets or chaos.
      </>
    ),
    primary_cta: { label: "Explore events", href: "/events" },
    secondary_cta: { label: "Open App", href: "/app" },

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
        { label: "Open App", href: "/app" },
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
   CONTACT (/contact)
   ========================= */

export const global_contact_data = {
  seo: {
    title: "Contact — Ascend",
    description: "Questions, partnerships, or event support — reach out.",
  },

  header: {
    title: (
      <>
        Contact <span className="text-accent-500">Ascend</span>
      </>
    ),
    description: (
      <>
        Want to run an event or bring Ascend to your organization? Send a
        message and we’ll get back to you.
      </>
    ),
  },

  form: {
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      {
        key: "organization",
        label: "Organization (optional)",
        type: "text",
        required: false,
      },
      { key: "message", label: "Message", type: "textarea", required: true },
    ],
    submitLabel: "Send message",
    successMessage: <>Message sent — we’ll reply soon.</>,
  },

  links: [
    // Fill these when you actually have them (or remove)
    { label: "Email", href: "mailto:hello@ascend.dev" },
  ],
} as const;
