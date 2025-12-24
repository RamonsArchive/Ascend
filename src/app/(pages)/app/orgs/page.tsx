import React from "react";
import { redirect } from "next/navigation";

import { fetchAllUserOrganizations } from "@/src/actions/org_actions";
import AppOrganizationsSection from "@/src/components/appComponents/AppOrganizationsSection";
import Link from "next/link";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import type { OrgListItem } from "@/src/lib/global_types";

const MyOrganizationsPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect(`/login?next=/app/orgs`);
  }

  const organizations = await fetchAllUserOrganizations();
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

  const orgs = organizations.data as OrgListItem[];

  return (
    <div className="relative w-full min-h-[calc(100vh-48px)]">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <AppOrganizationsSection
          title="My organizations"
          description="View and switch between your organizations."
          orgs={orgs}
          ctaHref="/app/orgs/new"
          ctaLabel="Create organization"
        />
      </div>
    </div>
  );
};

export default MyOrganizationsPage;
