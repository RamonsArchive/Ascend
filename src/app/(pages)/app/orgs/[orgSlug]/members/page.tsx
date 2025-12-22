import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import React from "react";
import { notFound, redirect } from "next/navigation";

import { fetchOrgMembers } from "@/src/actions/org_members_actions";
import { assertOrgAdminOrOwner } from "@/src/actions/org_actions";
import EditOrgMembersHero from "@/src/components/orgComponents/EditOrgMembersHero";
import EditOrgMembersSection from "@/src/components/orgComponents/EditOrgMembersSection";
import type { OrgJoinRequest, OrgRole, Prisma } from "@prisma/client";
import AddOrgMemberSection from "@/src/components/orgComponents/AddOrgMemberSection";
import Link from "next/link";
import { fetchOrgJoinRequests } from "@/src/actions/org_invites_actions";

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
  if (!hasPermissions.data)
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
  }

  const members = await fetchOrgMembers(orgId);
  if (members.status === "ERROR" || !members.data)
    return (
      <div className="relative w-full">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
          <section className="flex flex-col items-center justify-center w-full">
            <div className="flex flex-col w-full max-w-3xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-4">
              <div className="text-white text-xl font-semibold">Members</div>
              <div className="text-white/70 text-sm leading-relaxed">
                Failed to fetch members.
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
  const membersData = members.data as OrgMemberResponse[];
  const joinRequests = await fetchOrgJoinRequests(orgId, userId);
  if (joinRequests.status === "ERROR")
    return (
      <div className="relative w-full">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
          <section className="flex flex-col items-center justify-center w-full">
            <div className="flex flex-col w-full max-w-3xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-4">
              <div className="text-white text-xl font-semibold">Members</div>
              <div className="text-white/70 text-sm leading-relaxed">
                Failed to fetch join requests.
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
  const joinRequestsData = joinRequests.data as OrgJoinRequest[];
  return (
    <div className="relative w-full">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <EditOrgMembersHero />
        <AddOrgMemberSection
          orgId={orgId}
          currentUserId={userId}
          joinRequests={joinRequestsData}
        />
        <EditOrgMembersSection
          orgId={orgId}
          members={membersData}
          currentUserId={userId}
          viewerRole={userRole as "OWNER" | "ADMIN"}
        />
      </div>
    </div>
  );
};

export default OrgMembersPage;
