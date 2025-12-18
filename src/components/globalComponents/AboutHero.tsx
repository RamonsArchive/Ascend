import React from "react";
import { global_about_data } from "@/src/constants/globalConstants/global_index";

const AboutHero = () => {
  const { header, pillars } = global_about_data;

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-12 md:py-16 gap-8 md:gap-10">
        <div className="flex flex-col gap-4 md:gap-5">
          <div className="text-xs md:text-sm text-white/60 font-medium">
            About
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white leading-tight">
            {header.title}
          </h1>
          <div className="text-sm md:text-base text-white/75 leading-relaxed max-w-3xl">
            {header.intro}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="marketing-card flex flex-col gap-4 px-6 py-6 rounded-2xl"
            >
              <div className="text-base md:text-lg font-semibold text-white">
                {p.title}
              </div>
              <div className="text-sm md:text-base text-white/75 leading-relaxed">
                {p.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
