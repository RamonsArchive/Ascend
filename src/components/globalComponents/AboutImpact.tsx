import React from "react";
import { ABOUT_DATA } from "@/src/constants/globalConstants/global_index";
import { BookOpen, Building2, GraduationCap, Network } from "lucide-react";

const AboutImpact = () => {
  const { impactAreas } = ABOUT_DATA;

  const iconFor = (title: string) => {
    if (title.includes("Infrastructure")) return Network;
    if (title.includes("Literacy")) return BookOpen;
    if (title.includes("STEM")) return GraduationCap;
    return Building2;
  };

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-8 md:gap-10">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Impact areas we support
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            Through partnerships and community programs, Ascend supports efforts
            that expand access to the digital world and unlock STEM pathways.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {impactAreas.map((a) => {
            const Icon = iconFor(a.title);
            return (
              <div
                key={a.title}
                className="marketing-card flex flex-col gap-4 px-6 py-6 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center px-3 py-3 rounded-xl bg-white/5 border border-white/10">
                    <Icon className="h-5 w-5 text-secondary-500" />
                  </div>
                  <div className="text-base md:text-lg font-semibold text-white">
                    {a.title}
                  </div>
                </div>
                <div className="text-sm md:text-base text-white/75 leading-relaxed">
                  {a.description}
                </div>
                <div className="text-xs md:text-sm text-white/60 leading-relaxed">
                  <span className="text-white/75 font-medium">
                    STEM connection:
                  </span>{" "}
                  {a.stemConnection}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AboutImpact;

