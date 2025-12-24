import React from "react";
import EventEditTeamForm from "./EventEditTeamForm";

const EventEditTeam = ({
  eventId,
  orgId,
  defaults,
}: {
  eventId: string;
  orgId: string;
  defaults: {
    maxTeamSize: number;
    lockTeamChangesAtStart: boolean;
    allowSelfJoinRequests: boolean;
  };
}) => {
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-6 md:gap-8">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Event team
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            Manage team members and their permissions.
          </div>
        </div>
        <EventEditTeamForm
          eventId={eventId}
          orgId={orgId}
          defaults={defaults}
        />
      </div>
    </section>
  );
};

export default EventEditTeam;
