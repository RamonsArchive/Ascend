import { assertOrgAdminOrOwner } from "@/src/actions/org_actions";
import OrgCreateEventHero from "@/src/components/orgComponents/OrgCreateEventHero";
import OrgCreateEventSection from "@/src/components/orgComponents/OrgCreateEventSection";
import { getCachedSession } from "@/src/lib/cached-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";

const NewEventPage = async ({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) => {
  const { orgSlug } = await params;
  const session = await getCachedSession();
  const userId = session?.user?.id ?? "";
  const isLoggedIn = !!userId;
  if (!isLoggedIn) {
    redirect(`/login?next=/app/orgs/${orgSlug}/events/new`);
  }
  const hasPermissions = await assertOrgAdminOrOwner(orgSlug, userId);
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
  return (
    <main className="relative w-full">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <OrgCreateEventHero />
        <OrgCreateEventSection orgSlug={orgSlug} />
      </div>
    </main>
  );
};

export default NewEventPage;
