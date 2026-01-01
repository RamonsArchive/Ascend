import {
  PublicEventSponsorLink,
  SponsorLibraryItem,
} from "@/src/lib/global_types";
import React from "react";
import AddSponsorToEventModal from "./AddSponsorToEventModal";
import EditEventSponsorForm from "./EditEventSponsorForm";

const InitialEventSponsorsSection = ({
  orgId,
  eventId,
  initialSponsors,
  sponsorLibrary,
}: {
  orgId: string;
  eventId: string;
  initialSponsors: PublicEventSponsorLink[];
  sponsorLibrary: SponsorLibraryItem[];
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [defaultSponsorId, setDefaultSponsorId] = React.useState<string | null>(
    null,
  );

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-10 md:gap-12">
        <AddSponsorToEventModal
          orgId={orgId}
          eventId={eventId}
          sponsorLibrary={sponsorLibrary}
          isOpen={isAddModalOpen}
          defaultSponsorId={defaultSponsorId}
          onClose={() => setIsAddModalOpen(false)}
        />

        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Event sponsors
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            Manage event sponsor placement, tier, and ordering.
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
              Add sponsor
            </button>
          </div>
        </div>

        {initialSponsors.length === 0 ? (
          <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
            <div className="flex flex-col gap-2">
              <div className="text-white font-semibold">
                No sponsors attached yet
              </div>
              <div className="text-white/70 text-sm leading-relaxed">
                Add a sponsor from the library above.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 md:gap-8">
            {initialSponsors
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((s) => (
                <EditEventSponsorForm
                  key={s.id}
                  orgId={orgId}
                  eventId={eventId}
                  initialSponsor={s}
                />
              ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default InitialEventSponsorsSection;
