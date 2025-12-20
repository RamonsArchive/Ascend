import React from "react";
import { global_events_data } from "@/src/constants/globalConstants/global_index";

const EventsHowItWorks = () => {
  const { join_flow } = global_events_data;
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 gap-6 md:gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight">
            {join_flow.title}
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-3xl">
            A quick overview so participants know what to expect before they
            commit.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {join_flow.steps.map((s) => (
            <div
              key={s.title}
              className="rounded-xl border border-white/10 bg-primary-950/70 p-5 hover:border-accent-100 transition-colors duration-200"
            >
              <div className="text-white font-semibold">{s.title}</div>
              <div className="flex flex-col gap-2">
                <div className="text-white/70 text-sm leading-relaxed">
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-primary-950/50 p-5 hover:border-accent-100 transition-colors duration-200">
          <div className="flex flex-col gap-2">
            <div className="text-white font-semibold">Rules & notes</div>
            <ul className="flex flex-col gap-2">
              {join_flow.rules.map((r) => (
                <li key={r} className="text-white/70 text-sm leading-relaxed">
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventsHowItWorks;
