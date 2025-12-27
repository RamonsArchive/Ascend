"use client";
import React, { useState } from "react";
import type {
  EventCompleteData,
  EventMembersAdminData,
  EventSettingsView,
} from "@/src/lib/global_types";
import EventSettingsFilter from "./EventSettingsFilter";
import EventEditDetails from "@/src/components/eventComponents/EventEditDetails";
import EventEditTeam from "@/src/components/eventComponents/EventEditTeam";
import EventMembersAdminSection from "@/src/components/eventComponents/EventMembersAdminSection";
import EventEditMembersSection from "@/src/components/eventComponents/EventEditMembersSection";
import EventEditTracks from "@/src/components/eventComponents/EventEditTracks";
import EventEditAwards from "@/src/components/eventComponents/EventEditAwards";
const EventSettingsClient = ({
  orgSlug,
  event,
  membersAdminData,
}: {
  orgSlug: string;
  event: EventCompleteData;
  membersAdminData: EventMembersAdminData | null;
}) => {
  const [view, setView] = useState<EventSettingsView>("DETAILS");

  return (
    <>
      <EventSettingsFilter value={view} onChange={setView} />

      {view === "DETAILS" ? <EventEditDetails event={event} /> : null}

      {view === "TEAM_RULES" ? (
        <EventEditTeam
          eventId={event.id}
          orgId={event.orgId ?? ""}
          defaults={{
            maxTeamSize: event.maxTeamSize ?? 5,
            lockTeamChangesAtStart: event.lockTeamChangesAtStart ?? false,
            allowSelfJoinRequests: event.allowSelfJoinRequests ?? false,
          }}
        />
      ) : null}

      {view === "INVITES" ? (
        <EventMembersAdminSection eventId={event.id} />
      ) : null}

      {view === "MEMBERS" ? (
        <EventEditMembersSection
          orgSlug={orgSlug}
          eventId={event.id}
          membersAdminData={membersAdminData}
        />
      ) : null}

      {view === "TRACKS" ? (
        <EventEditTracks
          eventId={event.id}
          orgId={event.orgId ?? ""}
          defaults={event.tracks ?? []}
        />
      ) : null}

      {view === "AWARDS" ? (
        <EventEditAwards
          eventId={event.id}
          orgId={event.orgId ?? ""}
          defaults={event.awards ?? []}
        />
      ) : null}
    </>
  );
};

export default EventSettingsClient;
