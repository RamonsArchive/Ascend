import React from "react";
import { getCachedSession } from "@/src/lib/cached-auth";
import { redirect } from "next/navigation";
import {
  assertEventAdminOrOwner,
  fetchEventData,
} from "@/src/actions/event_actions";
import Link from "next/link";
import EventSettingsHero from "@/src/components/eventComponents/EventSettingsHero";
import EventEditDetails from "@/src/components/eventComponents/EventEditDetails";
import EventEditTeam from "@/src/components/eventComponents/EventEditTeam";
import { EventCompleteData } from "@/src/lib/global_types";
import EventMembersAdminSection from "@/src/components/eventComponents/EventMembersAdminSection";

const EventSettingsPage = async ({
  params,
}: {
  params: { orgSlug: string; eventSlug: string };
}) => {
  const { orgSlug, eventSlug } = params;
  const session = await getCachedSession();
  const userId = session?.user?.id ?? "";
  const isLoggedIn = !!userId;
  if (!isLoggedIn) {
    redirect(`/login?next=/app/events/${eventSlug}/settings`);
  }
  const hasPermissions = await assertEventAdminOrOwner(
    orgSlug,
    eventSlug,
    userId
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

  const eventData = await fetchEventData(orgSlug, eventSlug);
  if (eventData.status === "ERROR" || !eventData.data) {
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

  const event = eventData.data as EventCompleteData;

  return (
    <div className="relative w-full min-h-[calc(100vh-48px)]">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <EventSettingsHero event={event} />
        <EventEditDetails event={event} />
        <EventEditTeam
          eventId={event.id}
          orgId={event.orgId ?? ""}
          defaults={{
            maxTeamSize: event.maxTeamSize ?? 5,
            lockTeamChangesAtStart: event.lockTeamChangesAtStart ?? false,
            allowSelfJoinRequests: event.allowSelfJoinRequests ?? false,
          }}
        />
        <EventMembersAdminSection eventId={event.id} />
        {/* Add EventMembersAdminSection here later */}
      </div>
    </div>
  );
};

export default EventSettingsPage;
