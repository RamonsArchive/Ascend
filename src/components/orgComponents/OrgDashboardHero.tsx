import React from "react";
import Link from "next/link";
import type { OrgRole } from "@prisma/client";

const OrgDashboardHero = ({
  orgName,
  orgSlug,
  role,
  counts,
}: {
  orgName: string;
  orgSlug: string;
  role: OrgRole;
  counts: { events: number; members: number; sponsors: number };
}) => {
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-6">
        <div className="flex flex-col gap-3">
          <div className="text-white/60 text-xs md:text-sm">
            Org dashboard · <span className="text-white/80">{role}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold text-white leading-tight">
            {orgName}
          </h1>
          <div className="text-sm md:text-lg text-white/70 leading-relaxed max-w-4xl">
            Manage events, members, and sponsors for your organization.
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white/60 text-xs">Events</div>
            <div className="text-white font-semibold text-xl">
              {counts.events}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white/60 text-xs">Members</div>
            <div className="text-white font-semibold text-xl">
              {counts.members}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white/60 text-xs">Sponsors</div>
            <div className="text-white font-semibold text-xl">
              {counts.sponsors}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/app/orgs/${orgSlug}/events/new`}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 text-center"
          >
            Create an Event
          </Link>
          <Link
            href={`/app/orgs/${orgSlug}/settings`}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 text-center"
          >
            Organization settings
          </Link>
          <Link
            href={`/orgs/${orgSlug}`}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/90 font-semibold text-sm md:text-base transition-colors hover:bg-white/10 text-center"
          >
            View public page
          </Link>
        </div>
      </div>
    </section>
  );
};

export default OrgDashboardHero;
