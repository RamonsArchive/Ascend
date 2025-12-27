"use client";

import React, { useMemo, useState } from "react";

import type { EventMembersAdminData } from "@/src/lib/global_types";
import AdminEventTeamCard from "./AdminEventTeamCard";
import EventUnassignedMemberCard from "./EventUnassignedMemberCard";

const EventEditMembersClient = ({
  orgSlug,
  eventId,
  data,
}: {
  orgSlug: string;
  eventId: string;
  data: EventMembersAdminData;
}) => {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"GRID" | "LIST">("GRID");

  const filteredTeams = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.teams;

    return data.teams.filter((t) => {
      const teamMatch =
        t.name.toLowerCase().includes(q) ||
        (t.track ?? "").toLowerCase().includes(q);
      const memberMatch = t.members.some((m) => {
        const name = (m.user.name ?? "").toLowerCase();
        const email = (m.user.email ?? "").toLowerCase();
        return name.includes(q) || email.includes(q);
      });
      return teamMatch || memberMatch;
    });
  }, [data.teams, query]);

  const filteredUnassigned = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.unassigned;
    return data.unassigned.filter((m) => {
      const name = (m.user.name ?? "").toLowerCase();
      const email = (m.user.email ?? "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [data.unassigned, query]);

  const teamCount = data.teams.length;
  const memberCount =
    data.unassigned.length +
    data.teams.reduce((acc, t) => acc + t.members.length, 0);

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-white/75">Search</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search teams, names, or emails…"
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-white/75">View</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setView("GRID")}
                className={[
                  "px-4 py-3 rounded-2xl border text-sm font-semibold transition-colors",
                  view === "GRID"
                    ? "bg-white text-primary-950 border-white"
                    : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10",
                ].join(" ")}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setView("LIST")}
                className={[
                  "px-4 py-3 rounded-2xl border text-sm font-semibold transition-colors",
                  view === "LIST"
                    ? "bg-white text-primary-950 border-white"
                    : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10",
                ].join(" ")}
              >
                List
              </button>
            </div>
          </div>
        </div>

        <div className="text-white/60 text-xs md:text-sm">
          Teams:{" "}
          <span className="text-white/90 font-semibold">{teamCount}</span> •
          Members:{" "}
          <span className="text-white/90 font-semibold">{memberCount}</span>
        </div>
      </div>

      {/* Teams */}
      <div className="flex flex-col gap-3">
        <div className="text-white/80 text-sm md:text-base font-semibold">
          Teams
        </div>

        {view === "GRID" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {filteredTeams.map((team) => (
              <AdminEventTeamCard
                key={team.id}
                orgSlug={orgSlug}
                eventId={eventId}
                team={team}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4 md:gap-6">
            {filteredTeams.map((team) => (
              <AdminEventTeamCard
                key={team.id}
                orgSlug={orgSlug}
                eventId={eventId}
                team={team}
                dense
              />
            ))}
          </div>
        )}

        {filteredTeams.length === 0 ? (
          <div className="text-white/60 text-sm">
            No teams match your search.
          </div>
        ) : null}
      </div>

      {/* Unassigned */}
      <div className="flex flex-col gap-3">
        <div className="text-white/80 text-sm md:text-base font-semibold">
          Unassigned members
        </div>

        <div className="flex flex-col gap-4 md:gap-6">
          {filteredUnassigned.map((m) => (
            <EventUnassignedMemberCard
              key={m.id}
              orgSlug={orgSlug}
              eventId={eventId}
              member={m}
            />
          ))}
        </div>

        {filteredUnassigned.length === 0 ? (
          <div className="text-white/60 text-sm">
            No unassigned members (or none match your search).
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default EventEditMembersClient;
