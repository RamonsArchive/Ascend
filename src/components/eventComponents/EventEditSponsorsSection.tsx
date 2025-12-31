"use client";

import React from "react";
import type { SponsorLibraryItem } from "@/src/lib/global_types";
import AddSponsorToEventModal from "./AddSponsorToEventModal";

const EventEditSponsorsSection = ({
  eventId,
  sponsorLibrary,
  currentUserId,
}: {
  eventId: string;
  sponsorLibrary: SponsorLibraryItem[];
  currentUserId: string;
}) => {
  void currentUserId;

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [defaultSponsorId, setDefaultSponsorId] = React.useState<string | null>(
    null
  );

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-10 md:gap-12">
        <AddSponsorToEventModal
          eventId={eventId}
          sponsorLibrary={sponsorLibrary}
          isOpen={isAddModalOpen}
          defaultSponsorId={defaultSponsorId}
          onClose={() => setIsAddModalOpen(false)}
        />

        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Sponsor library
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            Attach an existing global sponsor profile to this event. You can
            customize tier, ordering, and event-specific overrides.
          </div>
        </div>

        {sponsorLibrary.length === 0 ? (
          <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
            <div className="flex flex-col gap-2">
              <div className="text-white font-semibold">No sponsors found</div>
              <div className="text-white/70 text-sm leading-relaxed">
                Create sponsors in your org sponsor library (global) first, then
                attach them here.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 md:gap-8">
            {sponsorLibrary.slice(0, 5).map((s) => (
              <div
                key={s.id}
                className="w-full rounded-3xl border border-white/10 bg-white/4 px-6 py-6 md:px-8 md:py-8"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
                  <div className="flex flex-col gap-2 min-w-0">
                    <div className="text-white font-semibold text-lg truncate">
                      {s.name}
                    </div>
                    <div className="text-white/50 text-xs truncate">
                      @{s.slug}
                    </div>
                    {s.websiteKey ? (
                      <div className="text-white/70 text-xs break-all">
                        {s.websiteKey}
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDefaultSponsorId(s.id);
                      setIsAddModalOpen(true);
                    }}
                    className="w-full md:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 text-center"
                  >
                    Add to event
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default EventEditSponsorsSection;
