import React from "react";

const OrgEventsHero = () => {
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl md:text-5xl font-semibold text-white leading-tight">
            Events
          </h1>
          <div className="text-sm md:text-lg text-white/70 leading-relaxed max-w-4xl">
            Create and manage hackathons and ideathons for your organization.
          </div>
        </div>

        <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
          <div className="text-white/70 text-sm leading-relaxed">
            Start by creating an event in draft mode. You can add staff, judges,
            sponsors, awards, rules, and rubric later inside event settings.
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrgEventsHero;
