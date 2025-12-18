import React from "react";
import { ABOUT_DATA } from "@/src/constants/globalConstants/global_index";

const AboutMission = () => {
  const { text } = ABOUT_DATA;

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-6 md:gap-8">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Mission alignment
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            Ascend is built with the belief that access to technology and STEM
            opportunity should be equitable. We’re proud to partner with
            organizations like Digital Revolution that push this mission forward.
          </div>
        </div>

        <div className="marketing-card flex flex-col gap-3 px-6 py-6 rounded-2xl">
          <div className="text-sm md:text-base font-semibold text-white">
            {text.missionTitle}
          </div>
          <div className="text-sm md:text-base text-white/75 leading-relaxed">
            {text.missionStatement}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutMission;

