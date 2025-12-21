import React from "react";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";

import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import OrgDashboardHero from "@/src/components/orgComponents/OrgDashboardHero";

const OrgOverviewPage = async ({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) => {
  const { orgSlug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect(`/login?next=/app/orgs/${orgSlug}`);
  }

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      memberships: true,
      _count: {
        select: {
          events: true,
          memberships: true,
          sponsors: true,
        },
      },
    },
  });

  if (!org) return notFound();

  const membership = org.memberships.find((m) => m.userId === session.user.id);
  if (!membership) {
    return (
      <div className="relative w-full">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
          <section className="flex flex-col items-center justify-center w-full">
            <div className="flex flex-col w-full max-w-3xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-4">
              <div className="text-white text-xl font-semibold">
                Access required
              </div>
              <div className="text-white/70 text-sm leading-relaxed">
                You’re signed in, but you don’t have access to this
                organization.
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <OrgDashboardHero
          orgName={org.name}
          orgSlug={org.slug}
          role={membership.role}
          counts={{
            events: org._count.events,
            members: org._count.memberships,
            sponsors: org._count.sponsors,
          }}
        />
      </div>
    </div>
  );
};

export default OrgOverviewPage;
