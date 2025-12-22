import React from "react";
import EditOrgSponsorsSection from "@/src/components/orgComponents/EditOrgSponsorsSection";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { assertOrgAdminOrOwner } from "@/src/actions/org_actions";
import Link from "next/link";
import {
  fetchOrgSponsors,
  fetchSponsorLibrary,
} from "@/src/actions/org_sponsor_actions";
import EditOrgSponsorsHero from "@/src/components/orgComponents/EditOrgSponsorsHero";
import type { SponsorLibraryItem } from "@/src/components/orgComponents/SponsorLibraryCard";
import type { OrgSponsorWithSponsor } from "@/src/lib/global_types";

const OrgSponsorsPage = async ({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) => {
  const { orgSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? "";
  const isLoggedIn = !!userId;

  if (!isLoggedIn) {
    redirect(`/login?next=/app/orgs/${orgSlug}/sponsors`);
  }

  const hasPermissions = await assertOrgAdminOrOwner(orgSlug, userId);
  if (hasPermissions.status === "ERROR") {
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
  const { orgId } = hasPermissions.data as {
    orgId: string;
  };

  const orgSponsors = await fetchOrgSponsors(orgId);
  console.log("orgSponsors", orgSponsors);
  if (orgSponsors.status === "ERROR") return notFound();
  const sponsors = orgSponsors.data as OrgSponsorWithSponsor[];

  const library = await fetchSponsorLibrary(); // might want to fetch only top 50 or something in future
  if (library.status === "ERROR") return notFound();
  const sponsorLibrary = library.data as SponsorLibraryItem[];

  return (
    <div className="relative w-full">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <EditOrgSponsorsHero />
        <EditOrgSponsorsSection
          orgId={orgId}
          initialSponsors={sponsors}
          sponsorLibrary={sponsorLibrary}
          currentUserId={userId}
        />
      </div>
    </div>
  );
};

export default OrgSponsorsPage;
