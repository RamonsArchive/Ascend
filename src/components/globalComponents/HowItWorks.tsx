import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { global_home_data } from "@/src/constants/globalConstants/global_index";

const HowItWorks = () => {
  const { sections } = global_home_data;
  const { title, steps } = sections.how_it_works;

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-8 md:gap-10">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight">
            {title}
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-3xl">
            A simple flow organizers can repeat—without losing flexibility.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {steps.map((s, idx) => (
            <div
              key={s.title}
              className="marketing-card flex flex-col gap-4 px-6 py-6 rounded-2xl"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center px-3 py-3 rounded-xl bg-white/5 border border-white/10">
                    <Sparkles className="h-5 w-5 text-accent-500" />
                  </div>
                  <div className="text-xs md:text-sm text-white/60 font-medium">
                    Step {idx + 1}
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-white/30" />
                )}
              </div>
              <h3 className="text-base md:text-lg font-semibold text-white leading-snug">
                {s.title}
              </h3>
              <div className="text-sm md:text-base text-white/75 leading-relaxed">
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
