import React from "react";
import NewOrgHero from "@/src/components/orgComponents/NewOrgHero";
import NewOrgFormSection from "@/src/components/orgComponents/NewOrgFormSection";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";

const NewOrgsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ pathname: string }>;
}) => {
  const path = (await searchParams).pathname || "/app/orgs/new";
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  console.log("session", session);
  const isLoggedIn = !!session?.user?.id;
  return (
    <div className="relative w-full">
      {/* Org onboarding theme background (distinct from marketing pages) */}
      <div className="absolute inset-0 pointer-events-none marketing-bg" />

      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <NewOrgHero />
        <NewOrgFormSection isLoggedIn={isLoggedIn} path={path} />
      </div>
    </div>
  );
};

export default NewOrgsPage;
