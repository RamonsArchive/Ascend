import React from "react";
import NewOrgHero from "@/src/components/orgComponents/NewOrgHero";
import NewOrgFormSection from "@/src/components/orgComponents/NewOrgFormSection";

const NewOrgsPage = () => {
  return (
    <div className="relative w-full">
      {/* Org onboarding theme background (distinct from marketing pages) */}
      <div className="absolute inset-0 pointer-events-none marketing-bg" />

      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <NewOrgHero />
        <NewOrgFormSection />
      </div>
    </div>
  );
};

export default NewOrgsPage;
