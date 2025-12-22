import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import React from "react";

const JoinOrgLinkPage = async ({
  params,
}: {
  params: Promise<{ orgSlug: string; token: string }>;
}) => {
  const { orgSlug, token } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? "";
  return <div>JoinOrgLinkPage</div>;
};

export default JoinOrgLinkPage;
