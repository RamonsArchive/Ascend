import React from "react";
import Link from "next/link";
import { org_sponsors_data } from "@/src/constants/orgConstants/org_index";

const LinkToSponsorsPage = ({ orgSlug }: { orgSlug: string }) => {
  const { settingsLink } = org_sponsors_data;
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-6">
        <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 md:gap-6">
            <div className="flex flex-col gap-2">
              <div className="text-white text-lg font-semibold">
                {settingsLink.title}
              </div>
              <div className="text-white/70 text-sm leading-relaxed max-w-3xl">
                {settingsLink.description}
              </div>
            </div>
            <Link
              href={`/app/orgs/${orgSlug}/sponsors`}
              className="w-full md:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 text-center"
            >
              {settingsLink.ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LinkToSponsorsPage;
