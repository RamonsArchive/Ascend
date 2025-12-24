import React from "react";
import Link from "next/link";
import { global_events_data } from "@/src/constants/globalConstants/global_index";

const EventsHero = () => {
  const { header } = global_events_data;
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-12 md:py-16 gap-6 md:gap-8">
        <div className="text-xs md:text-sm text-white/60 font-medium">
          Events
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl md:text-5xl font-semibold text-white leading-tight">
            {header.title}
          </h1>
          <div className="text-sm md:text-lg text-white/70 leading-relaxed max-w-3xl">
            {header.subtitle}
          </div>
        </div>

        <div className="flex flex-col items-start gap-3">
          <Link
            href={header.ctas.primary.href}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-md bg-secondary-500 text-white font-medium hover:bg-secondary-600 transition-colors duration-200"
          >
            {header.ctas.primary.label}
          </Link>
        </div>

        <div className="w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </section>
  );
};

export default EventsHero;
