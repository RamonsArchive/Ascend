import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import React from "react";
import { notFound, redirect } from "next/navigation";

import { fetchOrgMembers } from "@/src/actions/org_members_actions";
import {
  isAdminOrOwnerOfOrg,
  fetchOrgData,
  assertOrgAdminOrOwner,
} from "@/src/actions/org_actions";
import EditOrgMembersHero from "@/src/components/orgComponents/EditOrgMembersHero";
import EditOrgMembersSection from "@/src/components/orgComponents/EditOrgMembersSection";
import { Organization, OrgMembership } from "@prisma/client";
import type { OrgRole, Prisma } from "@prisma/client";

type OrgMember = Prisma.OrgMembershipGetPayload<{
  select: {
    id: true;
    userId: true;
    role: true;
    createdAt: true;
    user: { select: { id: true; name: true; email: true; image: true } };
  };
}>;

type OrgMemberResponse = Omit<OrgMember, "createdAt"> & { createdAt: string };
const OrgMembersPage = async ({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) => {
  const { orgSlug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? "";
  const isLoggedIn = !!userId;
  if (!isLoggedIn) {
    redirect(`/login?next=/app/orgs/${orgSlug}/members`);
  }

  const hasPermissions = await assertOrgAdminOrOwner(orgSlug, userId);
  if (hasPermissions.status === "ERROR") return notFound();
  const { orgId, userRole } = hasPermissions.data as {
    orgId: string;
    userRole: OrgRole | null;
  };

  if (userRole !== "OWNER" && userRole !== "ADMIN") {
    return (
      <div className="relative w-full">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
          <section className="flex flex-col items-center justify-center w-full">
            <div className="flex flex-col w-full max-w-3xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-4">
              <div className="text-white text-2xl font-semibold">Members</div>
              <div className="text-white/70 text-sm leading-relaxed">
                You need OWNER or ADMIN access to view this page.
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const members = await fetchOrgMembers(orgId);
  if (members.status === "ERROR") return notFound();
  const membersData = members.data as OrgMemberResponse[];
  return (
    <div className="relative w-full">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <EditOrgMembersHero />
        <EditOrgMembersSection
          orgSlug={orgSlug}
          members={membersData}
          currentUserId={userId}
          viewerRole={userRole as "OWNER" | "ADMIN"}
        />
      </div>
    </div>
  );
};

export default OrgMembersPage;
