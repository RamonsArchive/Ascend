import React from "react";
import { ChevronDown } from "lucide-react";
import { global_home_data } from "@/src/constants/globalConstants/global_index";

const FAQ = () => {
  const { sections } = global_home_data;
  const { title, items } = sections.faq;

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-8 md:gap-10">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight">
            {title}
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-3xl">
            Clear answers for organizers and participants.
          </div>
        </div>

        <div className="flex flex-col gap-3 md:gap-4">
          {items.map((item) => (
            <details
              key={item.q}
              className="marketing-card group rounded-2xl px-6 py-5"
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none">
                <div className="text-sm md:text-base font-semibold text-white">
                  {item.q}
                </div>
                <ChevronDown className="h-4 w-4 text-white/50 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="flex flex-col gap-2 pt-4 text-sm md:text-base text-white/70 leading-relaxed">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
