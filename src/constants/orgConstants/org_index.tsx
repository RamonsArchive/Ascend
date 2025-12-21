export const new_org_data = {
  seo: {
    title: "Create an organization — Ascend",
    description: "Create an organization to host events and manage your team.",
  },
  header: {
    title: "Create an organization",
    subtitle: "Create an organization to host events and manage your team.",
  },
  formSection: {
    title: "Set up your org profile",
    description:
      "This is your public-facing organization card. Add a logo, a cover image, and a short description so participants instantly recognize your brand.",
  },
  hero: {
    title: "Create an organization",
    subtitle: "Create an organization to host events and manage your team.",
    description:
      "Create an organization to host events and manage your team. You can add a logo and cover image to your organization. ",
    description2:
      "Have sponsors? Add them to your organization to display their logos and links on your event pages after creating an organization.",
  },
  form: {
    name: {
      label: "Organization Name",
      placeholder: "Enter your organization name",
    },
    description: {
      label: "Organization Description",
      placeholder: "Enter your organization description",
    },
    logo: {
      label: "Organization Logo",
      placeholder: "Upload your organization logo",
    },
    cover: {
      label: "Organization Cover",
      placeholder: "Upload your organization cover",
    },
  },
  cta: {
    label: "Create Organization",
  },
};

export const edit_org_data = {
  seo: {
    title: "Organization settings — Ascend",
    description:
      "Update your organization profile, branding, and contact info.",
  },
  hero: {
    title: "Organization settings",
    subtitle:
      "Update your profile, branding, and public contact information. Changes are reflected across your org pages.",
    description:
      "These details appear on your public organization page and inside the app. Keep them accurate so participants and sponsors can reach you.",
  },
  formSection: {
    title: "Profile & branding",
    description:
      "Update your org name, description (Markdown supported), logo, cover image, and public contact details.",
  },
  form: {
    name: {
      label: "Organization name",
      placeholder: "Enter organization name",
    },
    description: {
      label: "Description (Markdown)",
      placeholder:
        "Describe what your org does, who it’s for, and what you host…",
    },
    publicEmail: {
      label: "Public email",
      placeholder: "hello@org.com",
    },
    publicPhone: {
      label: "Public phone",
      placeholder: "5551234567",
    },
    websiteUrl: {
      label: "Website URL",
      placeholder: "https://yourorg.com",
    },
    logo: {
      label: "Logo",
    },
    cover: {
      label: "Cover image",
    },
    contactNote: {
      label: "Contact note (Markdown)",
      placeholder:
        "Example: **Sponsorships** — email [partners@org.com](mailto:partners@org.com)",
    },
  },
  cta: {
    label: "Save changes",
  },
};

export const org_nav_links = (orgSlug: string) =>
  [
    { label: "Overview", href: `/app/orgs/${orgSlug}` },
    { label: "Events", href: `/app/orgs/${orgSlug}/events` },
    { label: "Members", href: `/app/orgs/${orgSlug}/members` },
    { label: "Sponsors", href: `/app/orgs/${orgSlug}/sponsors` },
    { label: "Settings", href: `/app/orgs/${orgSlug}/settings` },
  ] as const;
