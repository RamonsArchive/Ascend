import React from "react";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import OrgEventsHero from "@/src/components/orgComponents/OrgEventsHero";
import OrgCreateEventSection from "@/src/components/orgComponents/OrgCreateEventSection";
import OrgEventsList from "@/src/components/orgComponents/OrgEventsList";
import { assertOrgAdminOrOwner } from "@/src/actions/org_actions";
import Link from "next/link";
import { getCachedSession } from "@/src/lib/cached-auth";
import { fetchAllOrgEvents } from "@/src/actions/event_actions";
import type { Event } from "@prisma/client";

const OrgEventsPage = async ({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) => {
  const { orgSlug } = await params;

  const session = await getCachedSession();
  const userId = session?.user?.id ?? "";
  const isLoggedIn = !!userId;
  if (!isLoggedIn) {
    redirect(`/login?next=/app/orgs/${orgSlug}/events`);
  }

  const hasPermissions = await assertOrgAdminOrOwner(orgSlug, userId);
  if (!hasPermissions.data || hasPermissions.status === "ERROR") {
    return (
      <div className="relative w-full">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
          <section className="flex flex-col items-center justify-center w-full">
            <div className="flex flex-col w-full max-w-3xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-4">
              <div className="text-white text-xl font-semibold">
                Not authorized
              </div>
              <div className="text-white/70 text-sm leading-relaxed">
                You need OWNER or ADMIN access to view this page.
              </div>
              <Link
                href={`/app/orgs/${orgSlug}`}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 text-center"
              >
                Back to org dashboard
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const events = await fetchAllOrgEvents(orgSlug);
  if (events.status === "ERROR") {
    return (
      <div className="relative w-full">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
          <section className="flex flex-col items-center justify-center w-full">
            <div className="flex flex-col w-full max-w-3xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-4">
              <div className="text-white text-xl font-semibold">Error</div>
              <div className="text-white/70 text-sm leading-relaxed">
                Failed to fetch events.
              </div>
              <Link
                href={`/app/orgs/${orgSlug}`}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 text-center"
              >
                Back to org dashboard
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const eventsData = events.data as Event[];
  console.log(eventsData);
  return (
    <div className="relative w-full">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <OrgEventsHero />
        <OrgCreateEventSection orgSlug={orgSlug} />
        <OrgEventsList events={eventsData} orgSlug={orgSlug} />
      </div>
    </div>
  );
};

export default OrgEventsPage;
