"use client";

import React from "react";
import type { Prisma } from "@prisma/client";

import { org_sponsors_data } from "@/src/constants/orgConstants/org_index";
import AddOrgSponsorForm from "@/src/components/orgComponents/AddOrgSponsorForm";
import EditOrgSponsorForm from "@/src/components/orgComponents/EditOrgSponsorForm";

export type OrgSponsorWithSponsor = Prisma.OrganizationSponsorGetPayload<{
  include: {
    sponsor: {
      select: {
        id: true;
        name: true;
        slug: true;
        websiteKey: true;
        description: true;
        logoKey: true;
        coverKey: true;
      };
    };
  };
}>;

const EditOrgSponsorsSection = ({
  orgId,
  initialSponsors,
}: {
  orgId: string;
  initialSponsors: OrgSponsorWithSponsor[];
}) => {
  const { addSection, listSection } = org_sponsors_data;

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-10 md:gap-12">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            {addSection.title}
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            {addSection.description}
          </div>
        </div>

        <AddOrgSponsorForm orgId={orgId} />

        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            {listSection.title}
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            {listSection.description}
          </div>
        </div>

        {initialSponsors.length === 0 ? (
          <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
            <div className="flex flex-col gap-2">
              <div className="text-white font-semibold">
                {listSection.emptyTitle}
              </div>
              <div className="text-white/70 text-sm leading-relaxed">
                {listSection.emptyDescription}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 md:gap-8">
            {initialSponsors.map((s) => (
              <EditOrgSponsorForm key={s.id} orgId={orgId} initialSponsor={s} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default EditOrgSponsorsSection;
