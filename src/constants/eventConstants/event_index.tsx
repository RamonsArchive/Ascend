import { NavLink } from "@/src/lib/global_types";

export const event_nav_links = (
  orgSlug: string,
  eventSlug: string,
  hasPermissions: boolean
): NavLink[] => {
  const links = [
    {
      label: "Overview",
      href: `/app/orgs/${orgSlug}/events/${eventSlug}`,
      alt: "Overview",
    },
    {
      label: "Info",
      href: `/app/orgs/${orgSlug}/events/${eventSlug}/info`,
      alt: "Info",
    },
    {
      label: "Teams",
      href: `/app/orgs/${orgSlug}/events/${eventSlug}/teams`,
      alt: "Teams",
    },
    {
      label: "Submissions",
      href: `/app/orgs/${orgSlug}/events/${eventSlug}/submissions`,
      alt: "Submissions",
    },
    {
      label: "Winners",
      href: `/app/orgs/${orgSlug}/events/${eventSlug}/winners`,
      alt: "Winners",
    },
    {
      label: "Settings",
      href: `/app/orgs/${orgSlug}/events/${eventSlug}/settings`,
      alt: "Settings",
    },
  ];

  return hasPermissions ? links : links.filter((l) => l.label !== "Settings");
};

export const event_mobile_menu_footer_links = (orgSlug: string): NavLink[] => [
  {
    href: `/app/orgs/${orgSlug}`,
    label: "Back to Org",
    alt: "Back to Org",
  },
  { href: "/app", label: "Back to App", alt: "Back to App" },
];
