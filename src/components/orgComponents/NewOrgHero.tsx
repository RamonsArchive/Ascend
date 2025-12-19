import React from "react";
import { new_org_data } from "@/src/constants/orgConstants/org_index";

const NewOrgHero = () => {
  const { hero } = new_org_data;
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-5xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl md:text-5xl font-semibold text-white leading-tight">
            <span className="text-accent-500">{hero.title}</span>
          </h1>
          <div className="text-sm md:text-lg text-white/70 leading-relaxed">
            {hero.subtitle}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-primary-950/50 p-5">
          <div className="text-white/80 text-sm leading-relaxed">
            {hero.description}
          </div>
          <div className="text-white/70 text-sm leading-relaxed">
            {hero.description2}
          </div>
          <div className="text-white/50 text-xs leading-relaxed">
            Tip: your contact note supports Markdown (links, lists, emphasis).
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewOrgHero;
