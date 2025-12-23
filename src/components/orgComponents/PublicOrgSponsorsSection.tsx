import React from "react";
import type { OrganizationSponsor, Sponsor } from "@prisma/client";
import PublicSponsorCard from "../PublicSponsorCard";
import type { PublicOrgSponsor } from "@/src/lib/global_types";

const PublicOrgSponsorsSection = ({
  sponsors,
}: {
  sponsors: PublicOrgSponsor[];
}) => {
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-6 md:gap-8">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Our Sponsors
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            Our sponsors are the backbone of our organization.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {sponsors.map((row) => (
            <PublicSponsorCard key={row.id} sponsorLink={row} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PublicOrgSponsorsSection;
