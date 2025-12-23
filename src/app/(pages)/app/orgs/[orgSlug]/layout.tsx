import { assertOrgAdminOrOwner } from "@/src/actions/org_actions";
import OrgNav from "@/src/components/orgComponents/OrgNav";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import React from "react";

const layout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) => {
  const { orgSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? "";
  let hasPermissions = false;
  if (userId) {
    const prems = await assertOrgAdminOrOwner(orgSlug, userId);
    if (prems.status === "SUCCESS") {
      hasPermissions = true;
    }
  }
  return (
    <>
      <OrgNav orgSlug={orgSlug} hasPermissions={hasPermissions} />
      {children}
    </>
  );
};

export default layout;
