import React from "react";
import EditOrgHero from "@/src/components/orgComponents/EditOrgHero";
import EditOrgFormSection from "@/src/components/orgComponents/EditOrgFormSection";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { Organization, OrgMembership } from "@prisma/client";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { fetchOrgData, assertOrgAdminOrOwner } from "@/src/actions/org_actions";
import LinkToSponsorsPage from "@/src/components/orgComponents/LinkToSponsorsPage";
import EditOrgJoinSettingsSection from "@/src/components/orgComponents/EditOrgJoinSettingsSection";

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

  const hasPermissions = await assertOrgAdminOrOwner(orgSlug, userId);
  console.log(hasPermissions);
  if (!hasPermissions.data || hasPermissions.status === "ERROR")
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

  const org = await fetchOrgData(orgSlug);
  if (org.status === "ERROR" || !org.data)
    return (
      <div className="relative w-full">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
          <section className="flex flex-col items-center justify-center w-full">
            <div className="flex flex-col w-full max-w-3xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-4">
              <div className="text-white text-xl font-semibold">
                Organization not found
              </div>
              <div className="text-white/70 text-sm leading-relaxed">
                The organization you are looking for does not exist.
              </div>
              <Link
                href={`/`}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 text-center"
              >
                Back to home
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  const {
    id,
    name,
    description,
    publicEmail,
    publicPhone,
    websiteUrl,
    contactNote,
    logoKey,
    coverKey,
    allowJoinRequests,
    joinMode,
  } = org.data as Organization;

  return (
    <div className="relative w-full">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <EditOrgHero />
        <EditOrgFormSection
          orgId={id}
          initialOrg={{
            name: name,
            description: description,
            publicEmail: publicEmail,
            publicPhone: publicPhone,
            websiteUrl: websiteUrl,
            contactNote: contactNote,
            logoKey: logoKey,
            coverKey: coverKey,
          }}
        />
        <EditOrgJoinSettingsSection
          orgId={id}
          allowJoinRequests={allowJoinRequests}
          joinMode={joinMode}
          currentUserId={userId}
        />
        <LinkToSponsorsPage orgSlug={orgSlug} />
      </div>
    </div>
  );
};

export default EditOrgPage;
