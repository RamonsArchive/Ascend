import React from "react";
import NewOrgHero from "@/src/components/orgComponents/NewOrgHero";
import NewOrgForm from "@/src/components/orgComponents/NewOrgForm";
import { new_org_data } from "@/src/constants/orgConstants/org_index";

const NewOrgsPage = () => {
  return (
    <div className="relative w-full">
      {/* Org onboarding theme background (distinct from marketing pages) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(70% 55% at 50% 0%, rgba(45, 212, 191, 0.22) 0%, rgba(11, 16, 32, 0) 60%), radial-gradient(70% 55% at 50% 100%, rgba(245, 158, 11, 0.12) 0%, rgba(11, 16, 32, 0) 70%), repeating-linear-gradient(to right, rgba(255, 255, 255, 0.045) 0 1px, rgba(255, 255, 255, 0) 1px 88px), repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 0 1px, rgba(255, 255, 255, 0) 1px 88px)",
          opacity: 0.55,
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 75%, rgba(0,0,0,0.2) 100%)",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 75%, rgba(0,0,0,0.2) 100%)",
        }}
      />

      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <NewOrgHero />
        <NewOrgForm submitLabel={new_org_data.cta.label} />
      </div>
    </div>
  );
};

export default NewOrgsPage;
