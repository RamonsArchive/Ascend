import React from "react";
import { org_members_data } from "@/src/constants/orgConstants/org_index";

const EditOrgMembersHero = () => {
  const { hero } = org_members_data;
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl md:text-5xl font-semibold text-white leading-tight">
            {hero.title}
          </h1>
        </div>
      </div>
    </section>
  );
};

export default EditOrgMembersHero;
