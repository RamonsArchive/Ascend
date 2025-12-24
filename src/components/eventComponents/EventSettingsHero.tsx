import React from "react";
import type { EventCompleteData } from "@/src/lib/global_types";

const pill = (label: string) =>
  "px-3 py-1 rounded-full border text-[11px] font-semibold tracking-wide " +
  label;

const EventSettingsHero = ({ event }: { event: EventCompleteData }) => {
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-6 md:gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-white/60 text-xs">@{event.slug}</div>
            <div className="h-1 w-1 rounded-full bg-white/20" />
            <div className="text-white/60 text-xs">{event.org.name}</div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/80 text-[11px] font-semibold">
                {event.status}
              </div>
              <div className="px-3 py-1 rounded-full border border-[rgba(255,61,138,0.25)] bg-[rgba(255,61,138,0.10)] text-[rgb(255,210,228)] text-[11px] font-semibold">
                Event admin
              </div>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Event settings
          </h2>

          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            Update your event details, registration rules, and participant flow.
            Admin tools (invites + permissions) live at the bottom.
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/80 text-xs">
              Teams: {event._count.teams}
            </div>
            <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/80 text-xs">
              Members: {event._count.members}
            </div>
            <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/80 text-xs">
              Submissions: {event._count.submissions}
            </div>
            <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/80 text-xs">
              Staff: {event._count.staff}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventSettingsHero;
