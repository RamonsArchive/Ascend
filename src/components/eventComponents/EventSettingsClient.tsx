"use client";

import React, { useMemo } from "react";
import type {
  EventCompleteData,
  EventMembersData,
  EventSettingsView,
} from "@/src/lib/global_types";

import SettingsClient from "@/src/components/SettingsClient";
import type { SettingsTab } from "@/src/lib/global_types";

import EventEditDetails from "@/src/components/eventComponents/EventEditDetails";
import EventEditTeam from "@/src/components/eventComponents/EventEditTeam";
import EventMembersAdminSection from "@/src/components/eventComponents/EventMembersAdminSection";
import EventEditMembersSection from "@/src/components/eventComponents/EventEditMembersSection";
import EventEditTracks from "@/src/components/eventComponents/EventEditTracks";
import EventEditAwards from "@/src/components/eventComponents/EventEditAwards";
import EventEditSponsorsSection from "@/src/components/eventComponents/EventEditSponsorsSection";
import InitialEventSponsorsSection from "@/src/components/eventComponents/InitialEventSponsorsSection";
import type { SponsorLibraryItem } from "@/src/lib/global_types";

const eventTabs: Array<SettingsTab<EventSettingsView>> = [
  {
    key: "DETAILS",
    label: "Details",
    description: "Title, dates, rules, visibility, and settings.",
  },
  {
    key: "TEAM_RULES",
    label: "Team rules",
    description: "Join policy, max team size, lock changes, etc.",
  },
  {
    key: "INVITES",
    label: "Invites",
    description: "Invite people via email or link.",
  },
  {
    key: "MEMBERS",
    label: "Members",
    description: "Manage teams and participants.",
  },
  { key: "TRACKS", label: "Tracks", description: "Manage event tracks." },
  { key: "AWARDS", label: "Awards", description: "Manage event awards." },
  {
    key: "SPONSORS",
    label: "Sponsors",
    description: "Attach global sponsors and manage ordering.",
  },
];

const EventSettingsClient = ({
  orgSlug,
  event,
  membersData,
  sponsorLibrary, // ✅ new
  currentUserId, // optional if you want to gate stuff
}: {
  orgSlug: string;
  event: EventCompleteData;
  membersData: EventMembersData | null;
  sponsorLibrary: SponsorLibraryItem[];
  currentUserId: string;
}) => {
  const sections = useMemo(
    () => [
      {
        key: "DETAILS" as const,
        render: () => <EventEditDetails event={event} />,
      },

      {
        key: "TEAM_RULES" as const,
        render: () => (
          <EventEditTeam
            eventId={event.id}
            orgId={event.orgId ?? ""}
            defaults={{
              maxTeamSize: event.maxTeamSize ?? 5,
              lockTeamChangesAtStart: event.lockTeamChangesAtStart ?? false,
              allowSelfJoinRequests: event.allowSelfJoinRequests ?? false,
            }}
          />
        ),
      },

      {
        key: "INVITES" as const,
        render: () => <EventMembersAdminSection eventId={event.id} />,
      },

      {
        key: "MEMBERS" as const,
        render: () => (
          <EventEditMembersSection
            orgId={event.orgId}
            eventId={event.id}
            membersData={membersData}
          />
        ),
      },

      {
        key: "TRACKS" as const,
        render: () => (
          <EventEditTracks
            eventId={event.id}
            orgId={event.orgId ?? ""}
            defaults={event.tracks ?? []}
          />
        ),
      },

      {
        key: "AWARDS" as const,
        render: () => (
          <EventEditAwards
            eventId={event.id}
            orgId={event.orgId ?? ""}
            defaults={event.awards ?? []}
          />
        ),
      },
      {
        key: "SPONSORS" as const,
        render: () => (
          <React.Fragment key="event-sponsors-section">
            <EventEditSponsorsSection
              orgId={event.orgId ?? ""}
              eventId={event.id}
              sponsorLibrary={sponsorLibrary}
              currentUserId={currentUserId ?? ""}
            />
            <InitialEventSponsorsSection
              orgId={event.orgId ?? ""}
              eventId={event.id}
              initialSponsors={event.sponsors ?? []}
              sponsorLibrary={sponsorLibrary}
            />
          </React.Fragment>
        ),
      },
    ],
    [event, orgSlug, membersData, sponsorLibrary, currentUserId]
  );

  return (
    <SettingsClient
      initialView="DETAILS"
      tabs={eventTabs}
      sections={sections}
    />
  );
};

export default EventSettingsClient;
