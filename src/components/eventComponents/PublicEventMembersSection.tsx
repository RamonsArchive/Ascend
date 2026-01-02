import React from "react";
import type { EventMembersData } from "@/src/lib/global_types";
import PublicEventMembersClient from "./PublicEventMembersClient";

const PublicEventMembersSection = ({
  userId,
  orgSlug,
  eventSlug,
  membersData,
}: {
  userId: string;
  orgSlug: string;
  eventSlug: string;
  membersData: EventMembersData | null;
}) => {
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-10 md:gap-12">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Teams
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            Browse teams and request to join. If you’re not registered yet, join
            the event first.
          </div>
        </div>

        <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
          {membersData ? (
            <PublicEventMembersClient
              userId={userId}
              orgSlug={orgSlug}
              eventSlug={eventSlug}
              data={membersData}
            />
          ) : (
            <div className="text-white/70 text-sm">Failed to load teams.</div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PublicEventMembersSection;
