"use client";

import React, { useMemo } from "react";
import type {
  OrgRole,
  OrgSettingsData,
  OrgSettingsView,
  PublicEventListItem,
  OrgJoinRequestWithUser,
  OrgMember,
} from "@/src/lib/global_types";

import SettingsClient from "@/src/components/SettingsClient";
import type { SettingsTab } from "@/src/lib/global_types";

import EditOrgFormSection from "./EditOrgFormSection";
import EditOrgJoinSettingsSection from "./EditOrgJoinSettingsSection";
import EditOrgMembersHero from "./EditOrgMembersHero";
import AddOrgMemberSection from "./AddOrgMemberSection";
import EditOrgMembersSection from "./EditOrgMembersSection";
import type { SponsorLibraryItem } from "@/src/lib/global_types";
import InitialOrgSponsorsSection from "./InitialOrgSponsorsSection";
import EditOrgSponsorsSection from "./EditOrgSponsorsSection";

// If you want “Members” to show invites + requests + members, keep it 1 tab.
// You can reuse your existing AddOrgMemberSection + EditOrgMembersSection here later.

const orgTabs: Array<SettingsTab<OrgSettingsView>> = [
  {
    key: "DETAILS",
    label: "Details",
    description: "Name, description, contact info, branding.",
  },
  {
    key: "JOIN",
    label: "Join",
    description: "Join mode, allow join requests.",
  },
  {
    key: "MEMBERS",
    label: "Members",
    description: "Invite, links, requests, and member management.",
  },
  {
    key: "SPONSORS",
    label: "Sponsors",
    description: "Manage sponsors and ordering.",
  },
  {
    key: "EVENTS",
    label: "Events",
    description: "View and manage org events.",
  },
];

const OrgSettingsClient = ({
  orgSlug,
  org,
  currentUserId,
  userRole,
  membersData,
  joinRequestsData,
  sponsorsData,
  eventsData,
}: {
  orgSlug: string;
  org: OrgSettingsData;
  currentUserId: string;
  userRole: OrgRole;
  membersData: OrgMember[];
  joinRequestsData: OrgJoinRequestWithUser[];
  sponsorsData: SponsorLibraryItem[];
  eventsData: PublicEventListItem[];
}) => {
  const sections = useMemo(
    () => [
      {
        key: "DETAILS" as const,
        render: () => (
          <EditOrgFormSection
            orgId={org.id}
            initialOrg={{
              name: org.name,
              description: org.description,
              publicEmail: org.publicEmail,
              publicPhone: org.publicPhone,
              websiteUrl: org.websiteUrl,
              contactNote: org.contactNote,
              logoKey: org.logoKey,
              coverKey: org.coverKey,
            }}
          />
        ),
      },

      {
        key: "JOIN" as const,
        render: () => (
          <EditOrgJoinSettingsSection
            orgId={org.id}
            allowJoinRequests={org.allowJoinRequests}
            joinMode={org.joinMode}
            currentUserId={currentUserId}
          />
        ),
      },

      {
        key: "MEMBERS" as const,
        render: () => (
          <React.Fragment key="members-section">
            <EditOrgMembersHero />
            <AddOrgMemberSection
              orgId={org.id}
              joinRequests={joinRequestsData}
            />
            <EditOrgMembersSection
              orgId={org.id}
              members={membersData}
              currentUserId={currentUserId}
              viewerRole={userRole}
            />
          </React.Fragment>
        ),
      },

      {
        key: "SPONSORS" as const,
        render: () => (
          <React.Fragment key="sponsors-section">
            <EditOrgSponsorsSection
              orgId={org.id}
              sponsorLibrary={sponsorsData}
              currentUserId={currentUserId}
            />
            <InitialOrgSponsorsSection
              initialSponsors={org.sponsors}
              orgId={org.id}
              sponsorLibrary={sponsorsData}
            />
          </React.Fragment>
        ),
      },

      {
        key: "EVENTS" as const,
        render: () => (
          <section className="flex flex-col items-center justify-center w-full">
            <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-6 md:gap-8">
              <div className="flex flex-col gap-3">
                <h2 className="text-2xl md:text-3xl font-semibold text-white">
                  Events
                </h2>
                <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
                  Jump to your org’s events page to manage events.
                </div>
              </div>

              <a
                href={`/app/orgs/${orgSlug}/events`}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 text-center"
              >
                Go to org events
              </a>
            </div>
          </section>
        ),
      },
    ],
    [org, orgSlug, currentUserId]
  );

  return (
    <SettingsClient initialView="DETAILS" tabs={orgTabs} sections={sections} />
  );
};

export default OrgSettingsClient;
