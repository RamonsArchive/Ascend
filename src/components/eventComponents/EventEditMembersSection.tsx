import React from "react";
import type { EventMembersAdminData } from "@/src/lib/global_types";
import EventEditMembersClient from "./EventEditMembersClient";

const EventEditMembersSection = ({
  orgSlug,
  eventId,
  membersAdminData,
}: {
  orgSlug: string;
  eventId: string;
  membersAdminData: EventMembersAdminData | null;
}) => {
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-10 md:gap-12">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Event members
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            Manage teams and members. Remove someone from a team, or remove them
            from the event entirely.
          </div>
        </div>

        <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
          {membersAdminData ? (
            <EventEditMembersClient
              orgSlug={orgSlug}
              eventId={eventId}
              data={membersAdminData}
            />
          ) : (
            <div className="text-white/70 text-sm">Failed to load members.</div>
          )}
        </div>
      </div>
    </section>
  );
};

export default EventEditMembersSection;
