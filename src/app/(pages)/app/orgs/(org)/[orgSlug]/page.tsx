import React from "react";
import { redirect } from "next/navigation";

import { prisma } from "@/src/lib/prisma";
import OrgDashboardHero from "@/src/components/orgComponents/OrgDashboardHero";
import { getCachedSession } from "@/src/lib/cached-auth";
import Link from "next/link";
import { fetchOrgSponsors } from "@/src/actions/org_sponsor_actions";
import { fetchOrgMembers } from "@/src/actions/org_members_actions";
import { fetchAllOrgEvents } from "@/src/actions/event_actions";
import type {
  PublicEventListItem,
  PublicOrgSponsor,
  OrgMember,
} from "@/src/lib/global_types";
import { fetchPublicOrgCountsData } from "@/src/actions/org_actions";
import PublicOrgSponsorsSection from "@/src/components/orgComponents/PublicOrgSponsorsSection";
import PublicOrgEventsSection from "@/src/components/orgComponents/PublicOrgEventsSection";
import PublicOrgMembersSection from "@/src/components/orgComponents/PublicOrgMembersSection";

const OrgOverviewPage = async ({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) => {
  const { orgSlug } = await params;
  const session = await getCachedSession();
  const userId = session?.user?.id ?? "";
  const isLoggedIn = !!userId;
  if (!isLoggedIn) {
    redirect(`/login?next=/app/orgs/${orgSlug}`);
  }

  const orgCountResult = await fetchPublicOrgCountsData(orgSlug);
  const org =
    orgCountResult.status === "SUCCESS"
      ? (orgCountResult.data as {
          id: string;
          name: string;
          slug: string;
          logoKey: string;
          coverKey: string;
          _count: { events: number; memberships: number; sponsors: number };
        })
      : null;

  if (!org)
    return (
      <div className="relative w-full">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
          <div className="text-white text-xl font-semibold">
            Organization not found
          </div>
          <Link href="/" className="text-white/70 text-sm leading-relaxed">
            Back to home
          </Link>
        </div>
      </div>
    );

  const membership = userId
    ? await prisma.orgMembership.findUnique({
        where: { orgId_userId: { orgId: org.id, userId } },
      })
    : null;

  const [sponsorsRes, eventsRes, membersRes] = await Promise.all([
    fetchOrgSponsors(org.id),
    fetchAllOrgEvents(orgSlug),
    fetchOrgMembers(org.id),
  ]);

  const sponsors =
    sponsorsRes.status === "SUCCESS"
      ? (sponsorsRes.data as PublicOrgSponsor[])
      : [];

  const events =
    eventsRes.status === "SUCCESS"
      ? (eventsRes.data as PublicEventListItem[])
      : [];

  const members =
    membersRes.status === "SUCCESS" ? (membersRes.data as OrgMember[]) : [];
  console.log(sponsors, events, members);

  return (
    <div className="relative w-full">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <OrgDashboardHero
          orgName={org.name}
          orgSlug={org.slug}
          role={membership?.role ?? "MEMBER"}
          counts={{
            events: org._count.events,
            members: org._count.memberships,
            sponsors: org._count.sponsors,
          }}
        />
        <PublicOrgSponsorsSection sponsors={sponsors} />
        <PublicOrgEventsSection events={events} />
        <PublicOrgMembersSection members={members} />
      </div>
    </div>
  );
};

export default OrgOverviewPage;
