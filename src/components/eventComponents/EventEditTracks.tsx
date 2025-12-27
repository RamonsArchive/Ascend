import React from "react";
import type { TrackDraft } from "@/src/lib/global_types";
import { EventListEditor } from "@/src/components/formComponents/EventListEditor";
import { updateEventTracks } from "@/src/actions/event_actions";

export type TrackPayload = { name: string; blurb?: string; order: number };

const EventEditTracks = ({
  eventId,
  orgId,
  defaults,
}: {
  eventId: string;
  orgId: string;
  defaults: TrackDraft[];
}) => {
  return (
    <section className="flex flex-col items-center justify-center w-full ">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-6 md:gap-8">
        <EventListEditor<TrackDraft>
          title="Event tracks"
          subtitle="Tracks help teams categorize their projects (e.g. AI, Health, Climate)."
          emptyText="No tracks yet."
          addLabel="+ Add track"
          defaults={defaults}
          onNormalize={(items) => {
            const payload: TrackPayload[] = items.map((t, idx) => ({
              name: t.name.trim(),
              blurb: (t.blurb ?? "").trim() || undefined,
              order: Number((t.order ?? "").trim() || idx),
            }));
            return payload;
          }}
          onSave={async (payload) => {
            return updateEventTracks(eventId, orgId, payload as any);
          }}
        />
      </div>
    </section>
  );
};

export default EventEditTracks;
