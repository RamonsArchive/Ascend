import React from "react";
import { org_sponsors_data } from "@/src/constants/orgConstants/org_index";

const EditOrgSponsorsHero = () => {
  const { hero } = org_sponsors_data;
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl md:text-5xl font-semibold text-white leading-tight">
            {hero.title}
          </h1>
          <div className="text-sm md:text-lg text-white/70 leading-relaxed max-w-4xl">
            {hero.subtitle}
          </div>
        </div>

        <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
          <div className="text-white/70 text-sm leading-relaxed">
            {hero.description}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditOrgSponsorsHero;
