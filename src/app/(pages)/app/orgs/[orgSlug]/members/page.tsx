import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import React from "react";
import { notFound, redirect } from "next/navigation";

import { fetchOrgMembers } from "@/src/actions/org_members_actions";
import { OrgMembership } from "@prisma/client";
import { isAdminOrOwnerOfOrg } from "@/src/actions/org_actions";
import EditOrgMembersHero from "@/src/components/orgComponents/EditOrgMembersHero";
import EditOrgMembersSection from "@/src/components/orgComponents/EditOrgMembersSection";
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

  const isMember = await isAdminOrOwnerOfOrg(orgSlug, userId);
  if (isMember.status === "ERROR")
    return (
      <div className="relative w-full">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
          <section className="flex flex-col items-center justify-center w-full">
            <div className="flex flex-col w-full max-w-5xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-4">
              <div className="text-white text-2xl font-semibold">Members</div>
              <div className="text-white/70 text-sm leading-relaxed">
                You are not authorized to view this page.
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  const isAdminOrOwner = isMember.data as OrgMembership;
  if (!isAdminOrOwner) {
    return (
      <div className="relative w-full">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
          <section className="flex flex-col items-center justify-center w-full">
            <div className="flex flex-col w-full max-w-3xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-4">
              <div className="text-white text-2xl font-semibold">Members</div>
              <div className="text-white/70 text-sm leading-relaxed">
                You are not authorized to view this page.
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }
  const members = await fetchOrgMembers(orgSlug);
  if (members.status === "ERROR") return notFound();
  const membersData = members.data as OrgMembership[];
  return (
    <div className="relative w-full">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <EditOrgMembersHero />
        <EditOrgMembersSection members={membersData} />
      </div>
    </div>
  );
};

export default OrgMembersPage;
