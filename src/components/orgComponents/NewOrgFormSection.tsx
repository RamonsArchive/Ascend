import React from "react";
import NewOrgForm from "./NewOrgForm";
import { new_org_data } from "@/src/constants/orgConstants/org_index";

const NewOrgFormSection = ({
  isLoggedIn,
  path,
}: {
  isLoggedIn: boolean;
  path: string;
}) => {
  const { formSection } = new_org_data;

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-8 md:gap-10">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            {formSection.title}
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            {formSection.description}
          </div>
        </div>

        <NewOrgForm
          submitLabel={new_org_data.cta.label}
          isLoggedIn={isLoggedIn}
          path={path}
        />
      </div>
    </section>
  );
};

export default NewOrgFormSection;
