import { assertOrgAdminOrOwner } from "@/src/actions/org_actions";
import OrgNav from "@/src/components/orgComponents/OrgNav";
import React from "react";
import { getCachedSession } from "@/src/lib/cached-auth";

const layout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) => {
  const { orgSlug } = await params;
  const session = await getCachedSession();
  const userId = session?.user?.id ?? "";
  let hasPermissions = false;
  if (userId) {
    const prems = await assertOrgAdminOrOwner(orgSlug, userId);
    if (prems.status === "SUCCESS") {
      hasPermissions = true;
    }
  }
  console.log("hasPermissions", hasPermissions);
  return (
    <>
      <OrgNav orgSlug={orgSlug} hasPermissions={hasPermissions} />
      <main className="mt-[48px]">{children}</main>
    </>
  );
};

export default layout;
