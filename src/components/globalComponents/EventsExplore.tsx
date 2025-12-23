import React from "react";
import { Event, Organization } from "@prisma/client";
import PublicEventCard from "@/src/components/PublicEventCard";
import { global_events_data } from "@/src/constants/globalConstants/global_index";

const EventsExplore = ({
  events,
  orgs,
}: {
  events: Event[];
  orgs: Organization[];
}) => {
  const { events: eventsCopy, filters, empty_state } = global_events_data;

  return (
    <section className="flex flex-col items-center justify-center w-full pb-12 md:pb-16 lg:pb-20">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 gap-6 md:gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight">
            {eventsCopy.title}
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-3xl">
            {eventsCopy.subtitle}
          </div>
        </div>

        {/* Filters (UI only for now) */}
        <div className="flex flex-col gap-3">
          <input
            placeholder={filters.searchPlaceholder}
            className="w-full rounded-md bg-primary-950/70 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-secondary-500/60 transition-colors"
          />
          <div className="flex flex-wrap gap-2">
            {filters.chips.map((c) => (
              <button
                key={c.key}
                type="button"
                className="px-3 py-1.5 rounded-full text-xs bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {events.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-primary-950/70 p-6">
            <div className="flex flex-col gap-2">
              <div className="text-white font-semibold">
                {empty_state.title}
              </div>
              <div className="text-white/70 text-sm">
                {empty_state.description}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((evt) => (
              <PublicEventCard key={evt.id} event={evt} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default EventsExplore;
