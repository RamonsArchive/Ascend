export const event_nav_links = (
  orgSlug: string,
  eventSlug: string,
  hasPermissions: boolean,
) => {
  const links = [
    { label: "Event Home", href: `/app/orgs/${orgSlug}/events/${eventSlug}` },
    { label: "Info", href: `/app/orgs/${orgSlug}/events/${eventSlug}/info` },
    { label: "Teams", href: `/app/orgs/${orgSlug}/events/${eventSlug}/teams` },
    {
      label: "Submissions",
      href: `/app/orgs/${orgSlug}/events/${eventSlug}/submissions`,
    },
    {
      label: "Winners",
      href: `/app/orgs/${orgSlug}/events/${eventSlug}/winners`,
    },
    {
      label: "Settings",
      href: `/app/orgs/${orgSlug}/events/${eventSlug}/settings`,
    },
  ] as const;

  return hasPermissions ? links : links.filter((l) => l.label !== "Settings");
};
