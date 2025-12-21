import React from "react";
import EditOrgHero from "@/src/components/orgComponents/EditOrgHero";
import EditOrgFormSection from "@/src/components/orgComponents/EditOrgFormSection";
import EditOrgSponsorsSection from "@/src/components/orgComponents/EditOrgSponsorsSection";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/src/lib/prisma";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";

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

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: {
      id: true,
      name: true,
      description: true,
      publicEmail: true,
      publicPhone: true,
      websiteUrl: true,
      contactNote: true,
      logoKey: true,
      coverKey: true,
      memberships: { select: { userId: true, role: true } },
    },
  });

  if (!org) return notFound();

  const membership = org.memberships.find((m) => m.userId === userId);
  const canEdit = membership?.role === "OWNER" || membership?.role === "ADMIN";

  if (!canEdit) {
    return (
      <div className="relative w-full">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
          <section className="flex flex-col items-center justify-center w-full">
            <div className="flex flex-col w-full max-w-3xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-4">
              <div className="text-white text-xl font-semibold">
                Not authorized
              </div>
              <div className="text-white/70 text-sm leading-relaxed">
                You need OWNER or ADMIN access to edit organization settings.
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
  return (
    <div className="relative w-full">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <EditOrgHero />
        <EditOrgFormSection
          orgId={org.id}
          initialOrg={{
            name: org.name,
            description: org.description,
            publicEmail: org.publicEmail,
            publicPhone: org.publicPhone,
            websiteUrl: org.websiteUrl,
            contactNote: org.contactNote,
            logoKey: org.logoKey,
            coverKey: org.coverKey,
          }}
        />
        <EditOrgSponsorsSection orgId={org.id} />
      </div>
    </div>
  );
};

export default EditOrgPage;
