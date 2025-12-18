import React from "react";
import {
  Building2,
  CalendarDays,
  Users,
  FileText,
  Scale,
  Settings2,
} from "lucide-react";
import { global_home_data } from "@/src/constants/globalConstants/global_index";

const GlobalFeatures = () => {
  const { sections } = global_home_data;
  const { title, cards } = sections.features;

  const iconFor = (t: string) => {
    const key = t.toLowerCase();
    if (key.includes("organization")) return Building2;
    if (key.includes("event")) return CalendarDays;
    if (key.includes("team")) return Users;
    if (key.includes("submission")) return FileText;
    if (key.includes("judg")) return Scale;
    return Settings2;
  };

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-8 md:gap-10">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight">
            {title}
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-3xl">
            Everything you need to ship an event experience participants trust,
            and organizers can run without chaos.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {cards.map((c) => {
            const Icon = iconFor(c.title);
            return (
              <div
                key={c.title}
                className="marketing-card flex flex-col gap-4 px-6 py-6 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center px-3 py-3 rounded-xl bg-white/5 border border-white/10">
                    <Icon className="h-5 w-5 text-secondary-500" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-white leading-snug">
                    {c.title}
                  </h3>
                </div>
                <div className="text-sm md:text-base text-white/75 leading-relaxed">
                  {c.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default GlobalFeatures;
