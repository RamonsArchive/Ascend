import React from "react";
import EditOrgHero from "@/src/components/orgComponents/EditOrgHero";
import EditOrgFormSection from "@/src/components/orgComponents/EditOrgForm";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { isMemberofOrg, fetchOrgData } from "@/src/actions/org_actions";
import Link from "next/link";
import { redirect } from "next/navigation";

const EditOrgPage = async ({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) => {
  const { orgSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? "";
  const isLoggedIn = !!userId;

  if (!isLoggedIn) {
    redirect(`/login?next=/app/orgs/${orgSlug}/settings`);
  }
  const isMemberOfOrg = await isMemberofOrg(orgSlug, userId);
  if (isMemberOfOrg.status === "ERROR") {
    return (
      <div className="text-white text-2xl font-bold">
        Error: {isMemberOfOrg.error}
        <Link href="/app/orgs">Back to organizations</Link>
      </div>
    );
  }

  const orgData = await fetchOrgData(orgSlug);
  if (orgData.status === "ERROR") {
    return (
      <div className="text-white text-2xl font-bold">
        Error: {orgData.error}
        <Link href="/app/orgs">Back to organizations</Link>
      </div>
    );
  }
  return (
    <div className="relative w-full">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <EditOrgHero />
        <EditOrgFormSection
          isLoggedIn={isLoggedIn}
          path={`/app/orgs/${orgSlug}/settings`}
          orgData={orgData.data}
        />
      </div>
    </div>
  );
};

export default EditOrgPage;
