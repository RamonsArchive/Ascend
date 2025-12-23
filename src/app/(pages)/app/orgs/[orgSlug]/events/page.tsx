import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";
import OrgEventsHero from "@/src/components/orgComponents/OrgEventsHero";
import OrgCreateEventSection from "@/src/components/orgComponents/OrgCreateEventSection";
import OrgEventsList from "@/src/components/orgComponents/OrgEventsList";

const OrgEventsPage = async ({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) => {
  const { orgSlug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? "";
  const isLoggedIn = !!userId;
  if (!isLoggedIn) {
    redirect(`/login?next=/app/orgs/${orgSlug}/events`);
  }

  return (
    <div className="relative w-full">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <OrgEventsHero />
        <OrgCreateEventSection />
        <OrgEventsList />
      </div>
    </div>
  );
};

export default OrgEventsPage;
