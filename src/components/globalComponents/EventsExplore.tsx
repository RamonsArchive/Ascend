"use client";

import React, { useMemo, useState } from "react";
import PublicEventCard from "@/src/components/PublicEventCard";
import { global_events_data } from "@/src/constants/globalConstants/global_index";
import type { PublicEventListItem, OrgListItem } from "@/src/lib/global_types";
import type { EventType } from "@prisma/client";

const FETCH_LIMIT = 12;

type ChipKey = "ALL" | "HACKATHON" | "IDEATHON";

const EventsExplore = ({
  events,
  orgs,
}: {
  events: PublicEventListItem[];
  orgs: OrgListItem[];
}) => {
  const { events: eventsCopy, filters, empty_state } = global_events_data;

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ChipKey>("ALL");
  const [orgFilter, setOrgFilter] = useState<string>("ALL"); // orgId or "ALL"

  const fetchedCount = events.length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return events.filter((e) => {
      // search
      const haystack = [
        e.heroTitle ?? "",
        e.heroSubtitle ?? "",
        e.name ?? "",
        // if you include org on the event, this becomes nicer:
        (e as any).org?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = q ? haystack.includes(q) : true;

      // type
      const matchesType =
        typeFilter === "ALL" ? true : (e.type as EventType) === typeFilter;

      // org
      const eventOrgId =
        (e as any).orgId ?? (e as any).org?.id ?? (e as any).organizationId;

      const matchesOrg = orgFilter === "ALL" ? true : eventOrgId === orgFilter;

      return matchesQuery && matchesType && matchesOrg;
    });
  }, [events, query, typeFilter, orgFilter]);

  const chips = useMemo(
    () =>
      [
        { key: "ALL" as const, label: "All" },
        { key: "HACKATHON" as const, label: "Hackathons" },
        { key: "IDEATHON" as const, label: "Ideathons" },
      ] satisfies Array<{ key: ChipKey; label: string }>,
    []
  );

  const Pill = ({
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
      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
        active
          ? "bg-white text-primary-950 border-white"
          : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );

  return (
    <section className="flex flex-col items-center justify-center w-full pb-12 md:pb-16 lg:pb-20">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 gap-6 md:gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight">
            {eventsCopy.title}
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-3xl">
            {eventsCopy.subtitle}
          </div>

          {/* counts + note */}
          <div className="pt-2 flex flex-col gap-1 text-xs md:text-sm">
            <div className="text-white/70">
              Showing{" "}
              <span className="text-white font-semibold">
                {filtered.length}
              </span>{" "}
              of{" "}
              <span className="text-white font-semibold">{fetchedCount}</span>{" "}
              fetched events
            </div>
            <div className="text-white/50">
              Only the {FETCH_LIMIT} most recent events are shown here.
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={filters.searchPlaceholder}
            className="w-full rounded-md bg-primary-950/70 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-secondary-500/60 transition-colors"
          />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Chips */}
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <Pill
                  key={c.key}
                  active={typeFilter === c.key}
                  label={c.label}
                  onClick={() => setTypeFilter(c.key)}
                />
              ))}
            </div>

            {/* Org filter */}
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              className="w-full md:w-[260px] rounded-md bg-primary-950/70 border border-white/10 px-4 py-2.5 text-sm text-white outline-none focus:border-secondary-500/60 transition-colors"
            >
              <option value="ALL" className="bg-primary-950">
                All organizations
              </option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id} className="bg-primary-950">
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-primary-950/70 p-6">
            <div className="flex flex-col gap-2">
              <div className="text-white font-semibold">
                {empty_state.title}
              </div>
              <div className="text-white/70 text-sm">
                {query || typeFilter !== "ALL" || orgFilter !== "ALL"
                  ? "Try clearing filters or changing your search."
                  : empty_state.description}
              </div>

              {(query || typeFilter !== "ALL" || orgFilter !== "ALL") && (
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setTypeFilter("ALL");
                      setOrgFilter("ALL");
                    }}
                    className="px-4 py-2 rounded-md bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-xs"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((evt) => (
              <PublicEventCard
                key={evt.id}
                event={evt}
                orgSlug={evt.org.slug}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default EventsExplore;
