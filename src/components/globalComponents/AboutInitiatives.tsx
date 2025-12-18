import React from "react";
import { ABOUT_DATA } from "@/src/constants/globalConstants/global_index";

const AboutInitiatives = () => {
  const { initiatives, partnerships } = ABOUT_DATA;

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-8 md:gap-10">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Initiatives & partnerships
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            Work we support and the kinds of partners we collaborate with to
            expand access and opportunity.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="marketing-card flex flex-col gap-6 px-6 py-6 rounded-2xl">
            <div className="text-base md:text-lg font-semibold text-white">
              Initiatives
            </div>
            <div className="flex flex-col gap-4">
              {initiatives.map((it) => (
                <div key={it.name} className="flex flex-col gap-1">
                  <div className="text-sm md:text-base font-semibold text-white/90">
                    {it.name}
                  </div>
                  <div className="text-sm md:text-base text-white/70 leading-relaxed">
                    {it.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="marketing-card flex flex-col gap-6 px-6 py-6 rounded-2xl">
            <div className="text-base md:text-lg font-semibold text-white">
              Partnerships
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <div className="text-sm md:text-base font-semibold text-white/90">
                  Educational
                </div>
                <div className="text-sm md:text-base text-white/70 leading-relaxed">
                  {partnerships.educational}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-sm md:text-base font-semibold text-white/90">
                  Corporate
                </div>
                <div className="text-sm md:text-base text-white/70 leading-relaxed">
                  {partnerships.corporate}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-sm md:text-base font-semibold text-white/90">
                  Nonprofit
                </div>
                <div className="text-sm md:text-base text-white/70 leading-relaxed">
                  {partnerships.nonprofit}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-sm md:text-base font-semibold text-white/90">
                  Government
                </div>
                <div className="text-sm md:text-base text-white/70 leading-relaxed">
                  {partnerships.government}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutInitiatives;
