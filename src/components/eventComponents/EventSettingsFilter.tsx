"use client";

import React from "react";
import type { EventSettingsView } from "@/src/lib/global_types";

const tabs: Array<{
  key: EventSettingsView;
  label: string;
  description: string;
}> = [
  {
    key: "DETAILS",
    label: "Details",
    description: "Title, dates, rules, visibility, and settings.",
  },
  {
    key: "TEAM_RULES",
    label: "Team rules",
    description: "Join policy, max team size, lock changes, etc.",
  },
  {
    key: "INVITES",
    label: "Invites",
    description: "Invite people via email or link.",
  },
  {
    key: "MEMBERS",
    label: "Members",
    description: "Manage teams and participants.",
  },
  {
    key: "TRACKS",
    label: "Tracks",
    description: "Manage event tracks.",
  },
  {
    key: "AWARDS",
    label: "Awards",
    description: "Manage event awards.",
  },
];

const EventSettingsFilter = ({
  value,
  onChange,
}: {
  value: EventSettingsView;
  onChange: (next: EventSettingsView) => void;
}) => {
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 gap-6 md:gap-8">
        <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
          <div className="flex flex-col gap-6 md:gap-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
              {tabs.map((t) => {
                const active = value === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => onChange(t.key)}
                    className={[
                      "w-full rounded-2xl border px-4 py-3 text-left transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
                      active
                        ? "bg-white text-primary-950 border-white"
                        : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-semibold">{t.label}</div>
                      <div
                        className={[
                          "text-xs leading-relaxed",
                          active ? "text-primary-950/70" : "text-white/60",
                        ].join(" ")}
                      >
                        {t.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventSettingsFilter;
