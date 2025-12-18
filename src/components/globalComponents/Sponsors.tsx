import React from "react";
import { Handshake, Sparkle } from "lucide-react";
import { global_home_data } from "@/src/constants/globalConstants/global_index";

const Sponsors = () => {
  const { sections } = global_home_data;
  const { title, description, items, disclaimer } = sections.sponsors;

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-8 md:gap-10">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight">
            {title}
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-3xl">
            {description}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {items.map((s) => (
            <div
              key={s.name}
              className="marketing-card flex items-center justify-between gap-4 px-6 py-5 rounded-2xl"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center px-3 py-3 rounded-xl bg-white/5 border border-white/10">
                  <Handshake className="h-5 w-5 text-secondary-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-base md:text-lg font-semibold text-white">
                    {s.name}
                  </div>
                  <div className="text-xs md:text-sm text-white/60">
                    {s.tier}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center px-3 py-3 rounded-xl bg-white/5 border border-white/10">
                <Sparkle className="h-4 w-4 text-accent-500" />
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs md:text-sm text-white/55 leading-relaxed max-w-3xl">
          {disclaimer}
        </div>
      </div>
    </section>
  );
};

export default Sponsors;
