import React from "react";
import Link from "next/link";

const OrgCreateEventSettingsHero = ({ orgSlug }: { orgSlug: string }) => {
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            Create an Event For Your Organization
          </h1>
          <Link
            href={`/app/orgs/${orgSlug}/events/new`}
            className="w-fit px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 text-center"
          >
            Create Event
          </Link>
        </div>
      </div>
    </section>
  );
};

export default OrgCreateEventSettingsHero;
