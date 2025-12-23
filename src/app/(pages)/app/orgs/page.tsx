import React from "react";
import { redirect } from "next/navigation";

import { getCachedSession } from "@/src/lib/cached-auth";
import { getAllOrganizations } from "@/src/actions/org_actions";
import AppOrganizationsSection from "@/src/components/appComponents/AppOrganizationsSection";
import type { Organization, OrgMembership } from "@prisma/client";
import Link from "next/link";

const MyOrganizationsPage = async () => {
  const session = await getCachedSession();
  if (!session?.user?.id) {
    redirect(`/login?next=/app/orgs`);
  }

  const organizations = await getAllOrganizations();
  if (organizations.status === "ERROR") {
    return (
      <div className="relative w-full min-h-[calc(100vh-48px)]">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
          <div className="text-white text-xl font-semibold">Error</div>
          <div className="text-white/70 text-sm leading-relaxed">
            Failed to fetch organizations
          </div>
          <Link href="/" className="text-white/70 text-sm leading-relaxed">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  type OrgWithMemberships = Organization & { memberships: OrgMembership[] };
  const orgs = organizations.data as OrgWithMemberships[];

  return (
    <div className="relative w-full">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <AppOrganizationsSection
          title="My organizations"
          description="Switch organizations, manage members, and create events."
          orgs={orgs}
          ctaHref="/app/orgs/new"
          ctaLabel="Create organization"
        />
      </div>
    </div>
  );
};

export default MyOrganizationsPage;
