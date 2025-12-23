"use client";

import React, { useMemo, useState } from "react";
import type { Event, EventType } from "@prisma/client";
import PublicEventTimeStateSection from "./PublicEventTimeStateSection";
import { getEventBucket, getRelevantYear, typeLabel } from "@/src/lib/utils";

const PublicOrgEventsSection = ({ events }: { events: Event[] }) => {
  const now = useMemo(() => new Date(), []);

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const e of events) set.add(getRelevantYear(e));
    return Array.from(set).sort((a, b) => b - a);
  }, [events]);

  const [selectedYear, setSelectedYear] = useState<number>(
    years[0] ?? new Date().getFullYear()
  );
  const [typeFilter, setTypeFilter] = useState<EventType | "ALL">("ALL");

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const y = getRelevantYear(e);
      if (y !== selectedYear) return false;
      if (typeFilter !== "ALL" && e.type !== typeFilter) return false;
      return true;
    });
  }, [events, selectedYear, typeFilter]);

  const buckets = useMemo(() => {
    const upcoming: Event[] = [];
    const live: Event[] = [];
    const past: Event[] = [];

    for (const e of filtered) {
      const b = getEventBucket(e, now);
      if (b === "UPCOMING") upcoming.push(e);
      else if (b === "LIVE") live.push(e);
      else past.push(e);
    }

    // Ordering
    upcoming.sort(
      (a, b) => (a.startAt?.getTime() ?? 0) - (b.startAt?.getTime() ?? 0)
    );
    live.sort(
      (a, b) => (a.startAt?.getTime() ?? 0) - (b.startAt?.getTime() ?? 0)
    );
    past.sort(
      (a, b) => (b.startAt?.getTime() ?? 0) - (a.startAt?.getTime() ?? 0)
    );

    return { upcoming, live, past };
  }, [filtered, now]);

  const FilterPill = ({
    active,
    label,
    onClick,
  }: {
    active: boolean;
    label: string;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
        active
          ? "bg-white text-primary-950 border-white"
          : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-8 md:gap-10">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Events
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            Browse upcoming, live, and past events. Filter by year and type.
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="text-xs md:text-sm text-white/75">Year</div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full md:w-[240px] rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors"
              >
                {years.map((y) => (
                  <option key={y} value={y} className="bg-primary-950">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FilterPill
                active={typeFilter === "ALL"}
                label="All"
                onClick={() => setTypeFilter("ALL")}
              />
              <FilterPill
                active={typeFilter === "HACKATHON"}
                label={typeLabel("HACKATHON")}
                onClick={() => setTypeFilter("HACKATHON")}
              />
              <FilterPill
                active={typeFilter === "IDEATHON"}
                label={typeLabel("IDEATHON")}
                onClick={() => setTypeFilter("IDEATHON")}
              />
            </div>
          </div>

          <div className="w-full h-px bg-white/10" />
        </div>

        <PublicEventTimeStateSection
          title="Upcoming"
          subtitle="Events that haven’t started yet."
          items={buckets.upcoming}
        />

        <PublicEventTimeStateSection
          title="Live"
          subtitle="Events happening right now (based on start/end dates)."
          items={buckets.live}
        />

        <PublicEventTimeStateSection
          title="Past"
          subtitle="Completed events."
          items={buckets.past}
        />
      </div>
    </div>
  );
};

export default PublicOrgEventsSection;
