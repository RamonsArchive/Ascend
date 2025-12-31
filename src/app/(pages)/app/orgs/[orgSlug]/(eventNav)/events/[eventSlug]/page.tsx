import React from "react";
import PrivateEventHero from "@/src/components/eventComponents/PrivateEventHero";
import PrivateEventInfo from "@/src/components/eventComponents/PrivateEventInfo";
import PrivateEventTracks from "@/src/components/eventComponents/PrivateEventTracks";
import PrivateEventAwards from "@/src/components/eventComponents/PrivateEventAwards";
import PrivateEventTeams from "@/src/components/eventComponents/PrivateEventTeams";
import { getCachedSession } from "@/src/lib/cached-auth";
import { redirect } from "next/navigation";
import {
  assertEventAdminOrOwner,
  fetchEventCompleteData,
  fetchEventMembersAdminData,
  fetchEventStaffData,
} from "@/src/actions/event_actions";
import Link from "next/link";
import { fetchOrgId } from "@/src/actions/org_actions";
import {
  EventCompleteData,
  EventMembersAdminData,
  EventStaffData,
} from "@/src/lib/global_types";
import PublicEventSponsorsSection from "@/src/components/eventComponents/PublicEventSponsorSection";
const PrivateEventHomePage = async ({
  params,
}: {
  params: Promise<{ orgSlug: string; eventSlug: string }>;
}) => {
  const { orgSlug, eventSlug } = await params;
  const session = await getCachedSession();
  const userId = session?.user?.id ?? "";
  const isLoggedIn = !!userId;
  if (!isLoggedIn) {
    redirect(`/login?next=/app/orgs/${orgSlug}/events/${eventSlug}`);
  }
  const hasPermissions = await assertEventAdminOrOwner(
    orgSlug,
    eventSlug,
    userId
  );
  if (!hasPermissions.data || hasPermissions.status === "ERROR")
    return (
      <div className="relative w-full">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
          <div className="text-white text-xl font-semibold">Not authorized</div>
          <div className="text-white/70 text-sm leading-relaxed">
            You need OWNER or ADMIN access to view this page.
          </div>
          <Link
            href={`/orgs/${orgSlug}/events/${eventSlug}`}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 text-center"
          >
            Back to public event home
          </Link>
        </div>
      </div>
    );

  const orgIdRes = await fetchOrgId(orgSlug);
  if (orgIdRes.status === "ERROR" || !orgIdRes.data) {
    return (
      <div className="relative w-full">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
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
      </div>
    );
  }
  const orgId = orgIdRes.data as string;
  let eventDataRes = null;
  let eventStaffDataRes = null; // fetchEventStaffData
  let eventMembersDataRes = null; // fetchEventMembersAdminData

  [eventDataRes, eventStaffDataRes, eventMembersDataRes] = await Promise.all([
    fetchEventCompleteData(orgId, eventSlug),
    fetchEventStaffData(orgId, eventSlug),
    fetchEventMembersAdminData(orgId, eventSlug),
  ]);

  if (eventDataRes.status === "ERROR" || !eventDataRes.data) {
    return (
      <div className="relative w-full">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
          <div className="text-white text-xl font-semibold">Error</div>
          <div className="text-white/70 text-sm leading-relaxed">
            Failed to fetch event data.
          </div>
          <Link
            href={`/orgs/${orgSlug}/events/${eventSlug}`}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 text-center"
          >
            Back to event home
          </Link>
        </div>
      </div>
    );
  }

  const eventData = eventDataRes.data as EventCompleteData;
  const eventStaffData = eventStaffDataRes.data as EventStaffData; // event staff data implement this
  const eventMembersData = eventMembersDataRes.data as EventMembersAdminData;

  return (
    <div className="relative w-full">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <PrivateEventHero orgSlug={orgSlug} event={eventData} />
        <PublicEventSponsorsSection sponsors={eventData.sponsors} />
        <PrivateEventInfo event={eventData} />
        <PrivateEventTracks tracks={eventData.tracks} />
        <PrivateEventAwards awards={eventData.awards} />
        <PrivateEventTeams
          orgSlug={orgSlug}
          eventSlug={eventSlug}
          teams={eventMembersData.teams}
        />
      </div>
    </div>
  );
};

export default PrivateEventHomePage;
