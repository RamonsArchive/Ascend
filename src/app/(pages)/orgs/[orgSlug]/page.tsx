import React from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { prisma } from "@/src/lib/prisma";
import { auth } from "@/src/lib/auth";
import PublicOrgHero from "@/src/components/orgComponents/PublicOrgHero";

const PublicOrgPage = async ({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) => {
  const { orgSlug } = await params;

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

  if (!org) return notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? null;

  const membership = userId
    ? await prisma.orgMembership.findUnique({
        where: { orgId_userId: { orgId: org.id, userId } },
      })
    : null;

  const canEdit = membership?.role === "OWNER" || membership?.role === "ADMIN";

  return (
    <div className="relative w-full">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <PublicOrgHero
          org={org}
          canEdit={canEdit}
          role={membership?.role ?? null}
        />
      </div>
    </div>
  );
};

export default PublicOrgPage;
