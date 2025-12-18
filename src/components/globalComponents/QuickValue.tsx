import React from "react";
import { CheckCircle2 } from "lucide-react";
import { global_home_data } from "@/src/constants/globalConstants/global_index";

const QuickValue = () => {
  const { quick_value } = global_home_data;
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-8 md:gap-10">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight">
            {quick_value.title}
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-3xl">
            A platform designed for high‑signal competitions: structured orgs,
            discoverable events, and a judging workflow that scales.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {quick_value.bullets.map((b) => (
            <div
              key={b}
              className="marketing-card flex items-start gap-3 px-5 py-4 rounded-xl"
            >
              <CheckCircle2 className="h-5 w-5 text-secondary-500 shrink-0" />
              <div className="text-sm md:text-base text-white/85 leading-relaxed">
                {b}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickValue;
