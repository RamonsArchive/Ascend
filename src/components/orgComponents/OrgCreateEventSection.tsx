import React from "react";
import OrgCreateEventForm from "./OrgCreateEventForm";

const OrgCreateEventSection = ({ orgSlug }: { orgSlug: string }) => {
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-6 md:gap-8">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Create event
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            Create a new event for your organization.
          </div>
        </div>
        <OrgCreateEventForm orgSlug={orgSlug} />
      </div>
    </section>
  );
};

export default OrgCreateEventSection;
