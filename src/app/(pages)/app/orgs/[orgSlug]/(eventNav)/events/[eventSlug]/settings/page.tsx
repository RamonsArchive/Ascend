import React from "react";
import { getCachedSession } from "@/src/lib/cached-auth";
import { redirect } from "next/navigation";
import {
  assertEventAdminOrOwner,
  fetchEventCompleteData,
  fetchEventMembersAdminData,
} from "@/src/actions/event_actions";
import Link from "next/link";
import EventSettingsHero from "@/src/components/eventComponents/EventSettingsHero";
import {
  EventCompleteData,
  EventMembersAdminData,
  SponsorLibraryItem,
} from "@/src/lib/global_types";
import EventSettingsClient from "@/src/components/eventComponents/EventSettingsClient";
import { fetchOrgId } from "@/src/actions/org_actions";
import { fetchSponsorLibrary } from "@/src/actions/global_actions";

const EventSettingsPage = async ({
  params,
}: {
  params: Promise<{ orgSlug: string; eventSlug: string }>;
}) => {
  const { orgSlug, eventSlug } = await params;
  const session = await getCachedSession();
  const userId = session?.user?.id ?? "";
  const isLoggedIn = !!userId;
  if (!isLoggedIn) {
    redirect(`/login?next=/app/events/${eventSlug}/settings`);
  }
  const hasPermissions = await assertEventAdminOrOwner(
    orgSlug,
    eventSlug,
    userId,
  );
  if (!hasPermissions) {
    return (
      <div className="relative w-full min-h-[calc(100vh-48px)]">
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
                href={`/app/events/${eventSlug}`}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 text-center"
              >
                Back to event home
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const orgIdRes = await fetchOrgId(orgSlug);
  if (orgIdRes.status === "ERROR" || !orgIdRes.data) {
    return (
      <div className="relative w-full min-h-[calc(100vh-48px)]">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
          <section className="flex flex-col items-center justify-center w-full">
            <div className="flex flex-col w-full max-w-3xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-4">
              <div className="text-white text-xl font-semibold">Error</div>
              <div className="text-white/70 text-sm leading-relaxed">
                Failed to fetch organization id.
              </div>
              <Link
                href={`/orgs/${orgSlug}`}
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

  let eventDataRes = null;
  let sponsorLibraryRes = null;
  let memberRes = null;

  [eventDataRes, sponsorLibraryRes, memberRes] = await Promise.all([
    fetchEventCompleteData(orgIdRes.data as string, eventSlug),
    fetchSponsorLibrary(),
    fetchEventMembersAdminData(orgIdRes.data as string, eventSlug),
  ]);
  if (eventDataRes.status === "ERROR" || !eventDataRes.data) {
    return (
      <div className="relative w-full min-h-[calc(100vh-48px)]">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
          <section className="flex flex-col items-center justify-center w-full">
            <div className="flex flex-col w-full max-w-3xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-4">
              <div className="text-white text-xl font-semibold">Error</div>
              <div className="text-white/70 text-sm leading-relaxed">
                Failed to fetch event data.
              </div>
              <Link
                href={`/events/${eventSlug}`}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 text-center"
              >
                Back to event home
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const event = eventDataRes.data as EventCompleteData;
  const membersAdminData = (memberRes.data as EventMembersAdminData) ?? [];
  const sponsorLibrary = (sponsorLibraryRes.data as SponsorLibraryItem[]) ?? [];

  return (
    <div className="relative w-full min-h-[calc(100vh-48px)]">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <EventSettingsHero event={event} />
        <EventSettingsClient
          orgSlug={orgSlug}
          event={event}
          membersAdminData={membersAdminData}
          sponsorLibrary={sponsorLibrary}
          currentUserId={userId}
        />
      </div>
    </div>
  );
};

export default EventSettingsPage;
