import React from "react";
import type { AwardDraft } from "@/src/lib/global_types";
import { EventListEditor } from "@/src/components/formComponents/EventListEditor";
import { updateEventAwards } from "@/src/actions/event_actions";

export type AwardPayload = {
  name: string;
  blurb?: string;
  order: number;
  allowMultipleWinners: boolean;
};

const EventEditAwards = ({
  eventId,
  orgId,
  defaults,
}: {
  eventId: string;
  orgId: string;
  defaults: AwardDraft[];
}) => {
  return (
    <section className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-48px)]">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-6 md:gap-8">
        <EventListEditor<AwardDraft>
          title="Event awards"
          subtitle="Define awards now (assign winners later)."
          emptyText="No awards yet."
          addLabel="+ Add award"
          defaults={defaults}
          renderRowExtras={({ item, setItem }) => (
            <label className="flex items-center gap-3 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
              <input
                type="checkbox"
                checked={!!item.allowMultipleWinners}
                onChange={(e) =>
                  setItem((prev) => ({
                    ...prev,
                    allowMultipleWinners: e.target.checked,
                  }))
                }
                className="h-4 w-4"
              />
              <div className="flex flex-col gap-1">
                <div className="text-white text-sm">Allow multiple winners</div>
                <div className="text-white/60 text-xs">
                  If enabled, you can assign this award to multiple teams.
                </div>
              </div>
            </label>
          )}
          onNormalize={(items) => {
            const payload: AwardPayload[] = items.map((a, idx) => ({
              name: a.name.trim(),
              blurb: (a.blurb ?? "").trim() || undefined,
              order: Number((a.order ?? "").trim() || idx),
              allowMultipleWinners: !!a.allowMultipleWinners,
            }));
            return payload;
          }}
          onSave={async (payload) => {
            return updateEventAwards(eventId, orgId, payload as any);
          }}
        />
      </div>
    </section>
  );
};

export default EventEditAwards;
