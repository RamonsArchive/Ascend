import React from "react";
import PrivateEventHero from "@/src/components/eventComponents/PrivateEventHero";
import PrivateEventInfo from "@/src/components/eventComponents/PrivateEventInfo";
import PrivateEventTracks from "@/src/components/eventComponents/PrivateEventTracks";
import PrivateEventAwards from "@/src/components/eventComponents/PrivateEventAwards";
import { getCachedSession } from "@/src/lib/cached-auth";
import { redirect } from "next/navigation";
import {
  fetchEventCompleteData,
  fetchEventMembersData,
  fetchEventStaffData,
} from "@/src/actions/event_actions";
import Link from "next/link";
import { fetchOrgId } from "@/src/actions/org_actions";
import {
  EventCompleteData,
  EventMembersData,
  EventStaffData,
} from "@/src/lib/global_types";
import PublicEventSponsorsSection from "@/src/components/eventComponents/PublicEventSponsorSection";
import EventStaffSection from "@/src/components/eventComponents/EventStaffSection";
import PublicEventMembersSection from "@/src/components/eventComponents/PublicEventMembersSection";

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
  let eventMembersDataRes = null; // fetchEventMembersData

  [eventDataRes, eventStaffDataRes, eventMembersDataRes] = await Promise.all([
    fetchEventCompleteData(orgId, eventSlug),
    fetchEventStaffData(orgId, eventSlug),
    fetchEventMembersData(orgId, eventSlug),
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
  const eventMembersData = eventMembersDataRes.data as EventMembersData;
  return (
    <div className="relative w-full">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <PrivateEventHero orgSlug={orgSlug} event={eventData} />
        <PublicEventSponsorsSection sponsors={eventData.sponsors} />
        <EventStaffSection staff={eventStaffData} />
        <PrivateEventInfo
          rulesMarkdown={eventData.rulesMarkdown}
          rubricMarkdown={eventData.rubricMarkdown}
        />
        <PrivateEventTracks tracks={eventData.tracks} />
        <PrivateEventAwards awards={eventData.awards} />
        <PublicEventMembersSection
          userId={userId}
          orgSlug={orgSlug}
          eventSlug={eventSlug}
          membersData={eventMembersData}
        />
      </div>
    </div>
  );
};

export default PrivateEventHomePage;
