import React from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import PublicOrgHero from "@/src/components/orgComponents/PublicOrgHero";
import Link from "next/link";
import { fetchOrgSponsors } from "@/src/actions/org_sponsor_actions";
import { fetchAllOrgEvents } from "@/src/actions/event_actions";
import { fetchOrgMembers } from "@/src/actions/org_members_actions";
import type { OrgMembership } from "@prisma/client";
import PublicOrgSponsorsSection from "@/src/components/orgComponents/PublicOrgSponsorsSection";
import PublicOrgEventsSection from "@/src/components/orgComponents/PublicOrgEventsSection";
import PublicOrgMembersSection from "@/src/components/orgComponents/PublicOrgMembersSection";
import type {
  PublicEventListItem,
  PublicOrgSponsor,
  OrgMember,
} from "@/src/lib/global_types";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";

const PublicOrgPage = async ({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) => {
  const { orgSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? null;

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoKey: true,
      coverKey: true,
    },
  });

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

  const canEdit = membership?.role === "OWNER" || membership?.role === "ADMIN";

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
        <PublicOrgHero
          org={org}
          canEdit={canEdit}
          role={membership?.role ?? null}
        />
        <PublicOrgSponsorsSection sponsors={sponsors} />
        <PublicOrgEventsSection events={events} />
        <PublicOrgMembersSection members={members} />
      </div>
    </div>
  );
};

export default PublicOrgPage;
