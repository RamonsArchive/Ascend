import React from "react";
import EditOrgHero from "@/src/components/orgComponents/EditOrgHero";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  assertOrgAdminOrOwner,
  fetchOrgSettingsData,
} from "@/src/actions/org_actions";
import { getCachedSession } from "@/src/lib/cached-auth";
import { PublicEventListItem, OrgRole } from "@/src/lib/global_types";
import type { SponsorLibraryItem } from "@/src/lib/global_types";
import { fetchSponsorLibrary } from "@/src/actions/global_actions";
import { fetchAllOrgEvents } from "@/src/actions/event_actions";
import { OrgSettingsData } from "@/src/lib/global_types";
import OrgSettingsClient from "@/src/components/orgComponents/OrgSettingsClient";

const EditOrgPage = async ({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) => {
  const { orgSlug } = await params;
  const session = await getCachedSession();
  const userId = session?.user?.id ?? "";
  const isLoggedIn = !!userId;

  if (!isLoggedIn) {
    redirect(`/login?next=/app/orgs/${orgSlug}/settings`);
  }

  const hasPermissions = await assertOrgAdminOrOwner(orgSlug, userId);
  if (!hasPermissions.data || hasPermissions.status === "ERROR")
    return (
      <div className="relative w-full">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
          <section className="flex flex-col items-center justify-center w-full">
            <div className="flex flex-col w-full max-w-3xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-4">
              <div className="text-white text-xl font-semibold">
                Not authorized
              </div>
              <div className="text-white/70 text-sm leading-relaxed">
                You need OWNER or ADMIN access to edit organization settings.
              </div>
              <Link
                href={`/app/orgs/${orgSlug}`}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 text-center"
              >
                Back to org dashboard
              </Link>
            </div>
          </section>
        </div>
      </div>
    );

  let orgRes = null;
  let sponsorsLibraryRes = null;
  let eventsRes = null;

  [orgRes, sponsorsLibraryRes, eventsRes] = await Promise.all([
    fetchOrgSettingsData(orgSlug),
    fetchSponsorLibrary(),
    fetchAllOrgEvents(orgSlug),
  ]);

  if (orgRes.status === "ERROR" || !orgRes.data)
    return (
      <div className="relative w-full">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
          <section className="flex flex-col items-center justify-center w-full">
            <div className="flex flex-col w-full max-w-3xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-4">
              <div className="text-white text-xl font-semibold">
                Organization not found
              </div>
              <div className="text-white/70 text-sm leading-relaxed">
                The organization you are looking for does not exist.
              </div>
              <Link
                href={`/`}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 text-center"
              >
                Back to home
              </Link>
            </div>
          </section>
        </div>
      </div>
    );

  if (sponsorsLibraryRes.status === "ERROR") sponsorsLibraryRes = null;
  if (eventsRes.status === "ERROR") eventsRes = null;
  const { memberships, joinRequests } = orgRes.data as OrgSettingsData;

  const sponsorLibrary = sponsorsLibraryRes?.data as SponsorLibraryItem[]; // library
  const eventsData = eventsRes?.data as PublicEventListItem[];

  const membersData = memberships; // could be but with date and string for createdAt
  const joinRequestsData = joinRequests;

  const { userRole } = hasPermissions.data as {
    orgId: string;
    userRole: OrgRole;
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <EditOrgHero />
        <OrgSettingsClient
          orgSlug={orgSlug}
          org={orgRes.data as OrgSettingsData}
          currentUserId={userId}
          userRole={userRole}
          membersData={membersData}
          joinRequestsData={joinRequestsData}
          sponsorsData={sponsorLibrary}
          eventsData={eventsData}
        />
      </div>
    </div>
  );
};

export default EditOrgPage;
