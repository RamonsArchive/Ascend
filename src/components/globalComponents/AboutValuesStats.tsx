import React from "react";
import { ABOUT_DATA, global_about_data } from "@/src/constants/globalConstants/global_index";
import { BadgeCheck, Globe, HandHeart } from "lucide-react";

const AboutValuesStats = () => {
  const { built_for } = global_about_data;
  const { values, stats } = ABOUT_DATA;

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-8 md:gap-10">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Values & focus
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            Ascend isn’t a donation organization — we build product and partner
            with mission-aligned groups. This section summarizes our direction
            and what we optimize for.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="marketing-card flex flex-col gap-3 px-6 py-6 rounded-2xl">
            <div className="text-xs md:text-sm text-white/60">Founded</div>
            <div className="text-base md:text-lg font-semibold text-white">
              {stats.founded}
            </div>
          </div>
          <div className="marketing-card flex flex-col gap-3 px-6 py-6 rounded-2xl">
            <div className="text-xs md:text-sm text-white/60">Communities</div>
            <div className="text-base md:text-lg font-semibold text-white">
              Growing daily
            </div>
          </div>
          <div className="marketing-card flex flex-col gap-3 px-6 py-6 rounded-2xl">
            <div className="text-xs md:text-sm text-white/60">Focus</div>
            <div className="text-base md:text-lg font-semibold text-white">
              {stats.missionFocus}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="marketing-card flex flex-col gap-6 px-6 py-6 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center px-3 py-3 rounded-xl bg-white/5 border border-white/10">
                <HandHeart className="h-5 w-5 text-accent-500" />
              </div>
              <div className="text-base md:text-lg font-semibold text-white">
                Values
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {values.map((v) => (
                <div key={v.title} className="flex flex-col gap-1">
                  <div className="text-sm md:text-base font-semibold text-white/90">
                    {v.title}
                  </div>
                  <div className="text-sm md:text-base text-white/70 leading-relaxed">
                    {v.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="marketing-card flex flex-col gap-6 px-6 py-6 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center px-3 py-3 rounded-xl bg-white/5 border border-white/10">
                <BadgeCheck className="h-5 w-5 text-secondary-500" />
              </div>
              <div className="text-base md:text-lg font-semibold text-white">
                {built_for.title}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {built_for.bullets.map((b) => (
                <div key={b} className="text-sm md:text-base text-white/80">
                  {b}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center px-3 py-3 rounded-xl bg-white/5 border border-white/10">
                <Globe className="h-5 w-5 text-secondary-500" />
              </div>
              <div className="text-sm md:text-base text-white/70 leading-relaxed">
                {stats.missionFocus}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutValuesStats;

