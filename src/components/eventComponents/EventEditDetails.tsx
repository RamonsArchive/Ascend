import React from "react";
import EventEditDetailsForm from "./EventEditDetailsForm";
import type { EventCompleteData } from "@/src/lib/global_types";

const EventEditDetails = ({ event }: { event: EventCompleteData }) => {
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-6 md:gap-8">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Event details
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            Control how your event appears publicly and how participants join.
          </div>
        </div>
        <EventEditDetailsForm event={event} />
      </div>
    </section>
  );
};

export default EventEditDetails;
