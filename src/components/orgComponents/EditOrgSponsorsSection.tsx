"use client";

import React from "react";
import type { Prisma } from "@prisma/client";

import { org_sponsors_data } from "@/src/constants/orgConstants/org_index";
import AddOrgSponsorForm from "@/src/components/orgComponents/AddOrgSponsorForm";
import EditOrgSponsorForm from "@/src/components/orgComponents/EditOrgSponsorForm";
import AddSponsorToOrgModal from "@/src/components/orgComponents/AddSponsorToOrgModal";
import SponsorLibraryCard, {
  type SponsorLibraryItem,
} from "@/src/components/orgComponents/SponsorLibraryCard";

import type { OrgSponsorWithSponsor } from "@/src/lib/global_types";

const EditOrgSponsorsSection = ({
  orgId,
  initialSponsors,
  sponsorLibrary,
  currentUserId,
}: {
  orgId: string;
  initialSponsors: OrgSponsorWithSponsor[];
  sponsorLibrary: SponsorLibraryItem[];
  currentUserId: string;
}) => {
  const { librarySection, orgSection } = org_sponsors_data;
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [defaultSponsorId, setDefaultSponsorId] = React.useState<string | null>(
    null
  );

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-10 md:gap-12">
        <AddSponsorToOrgModal
          orgId={orgId}
          sponsorLibrary={sponsorLibrary}
          isOpen={isAddModalOpen}
          defaultSponsorId={defaultSponsorId}
          onClose={() => setIsAddModalOpen(false)}
        />

        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            {librarySection.title}
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            {librarySection.description}
          </div>
        </div>

        <AddOrgSponsorForm />

        {sponsorLibrary.length === 0 ? (
          <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
            <div className="flex flex-col gap-2">
              <div className="text-white font-semibold">
                {librarySection.emptyTitle}
              </div>
              <div className="text-white/70 text-sm leading-relaxed">
                {librarySection.emptyDescription}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 md:gap-8">
            {sponsorLibrary.slice(0, 5).map((s) => (
              <SponsorLibraryCard
                key={s.id}
                sponsor={s}
                currentUserId={currentUserId}
                onAddToOrg={(sponsorId) => {
                  setDefaultSponsorId(sponsorId);
                  setIsAddModalOpen(true);
                }}
              />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            {orgSection.title}
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            {orgSection.description}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                setDefaultSponsorId(null);
                setIsAddModalOpen(true);
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 text-center"
            >
              {orgSection.addCtaLabel}
            </button>
          </div>
        </div>

        {initialSponsors.length === 0 ? (
          <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
            <div className="flex flex-col gap-2">
              <div className="text-white font-semibold">
                {orgSection.emptyTitle}
              </div>
              <div className="text-white/70 text-sm leading-relaxed">
                {orgSection.emptyDescription}
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
