"use client";

import React, { useState } from "react";
import type { ActionState, EventMembersData } from "@/src/lib/global_types";
import PublicEventTeamCardInteractive from "./PublicEventTeamCardInteractive";
import PublicEventLookingForTeamCard from "./PublicEventLookingForTeamCard";
import { createTeamEmailInvite } from "@/src/actions/team_invites_actions";
import { parseServerActionResponse } from "@/src/lib/utils";
import { setLookingForTeam } from "@/src/actions/team_actions";
import { toast } from "sonner";

const PublicEventMembersClient = ({
  userId,
  orgSlug,
  eventSlug,
  data,
}: {
  userId: string;
  orgSlug: string;
  eventSlug: string;
  data: EventMembersData;
}) => {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"GRID" | "LIST">("GRID");

  // invite UI state
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string>("");
  const [inviteSuccess, setInviteSuccess] = useState<string>("");

  const meLookingForTeam =
    data.unassigned.find((m) => m.user.id === userId && m.lookingForTeam) ??
    null;

  const q = query.trim().toLowerCase();

  const teams = !q
    ? data.teams
    : data.teams.filter((t) => {
        const teamMatch =
          t.name.toLowerCase().includes(q) ||
          (t.track?.name ?? "").toLowerCase().includes(q);

        const memberMatch = t.members.some((m) => {
          const name = (m.user.name ?? "").toLowerCase();
          const email = (m.user.email ?? "").toLowerCase();
          return name.includes(q) || email.includes(q);
        });

        return teamMatch || memberMatch;
      });

  // ✅ public-safe “unassigned” = only those who opted into lookingForTeam
  const lookingForTeam = data.unassigned
    .filter((m) => m.lookingForTeam)
    .filter((m) => {
      if (!q) return true;
      const name = (m.user.name ?? "").toLowerCase();
      const email = (m.user.email ?? "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });

  const teamCount = data.teams.length;
  const memberCount =
    data.unassigned.length +
    data.teams.reduce((acc, t) => acc + t.members.length, 0);

  // Single-team-per-event: find the ONE team where I'm LEADER
  const myLeaderTeam =
    data.teams.find((t) =>
      t.members.some((m) => m.userId === userId && m.role === "LEADER"),
    ) ?? null;

  const canInvite = !!myLeaderTeam;

  const handleInvite = async (
    target: EventMembersData["unassigned"][number],
  ) => {
    setInviteError("");
    setInviteSuccess("");

    if (!canInvite || !myLeaderTeam) {
      setInviteError("Only team leaders can invite members.");
      return;
    }

    const teamIdToUse = myLeaderTeam.id;

    if (!target.user.email) {
      setInviteError("That user does not have an email available.");
      return;
    }

    setInvitingUserId(target.user.id);

    const res = await createTeamEmailInvite(
      orgSlug,
      eventSlug,
      teamIdToUse,
      target.user.email,
      null,
      null,
    );

    setInvitingUserId(null);

    if (res.status === "ERROR") {
      setInviteError(res.error || "Failed to send invite.");
      return;
    }

    setInviteSuccess(`Invite sent to ${target.user.email}`);
  };

  const handleSetLookingForTeam = async () => {
    try {
      const res = await setLookingForTeam(
        orgSlug,
        eventSlug,
        !meLookingForTeam,
      );
      if (res.status === "ERROR") {
        toast.error("ERROR", {
          description: res.error || "Failed to set looking for team.",
        });
        return;
      }

      toast.success("SUCCESS", {
        description: `Looking for team set to ${!meLookingForTeam ? "true" : "false"}.`,
      });
      return parseServerActionResponse({
        status: "SUCCESS",
        error: "",
        data: null,
      }) as ActionState;
    } catch (error) {
      console.error(error);
      toast.error("ERROR", {
        description: "Failed to set looking for team.",
      });
      return parseServerActionResponse({
        status: "ERROR",
        error: "Failed to set looking for team.",
        data: null,
      }) as ActionState;
    }
  };

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
                    : "bg-white/5 text-white/80 border border-white/10 hover:bg-white/10",
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

        {data.teams.length === 0 ? (
          <div className="w-full rounded-3xl bg-white/4 border border-white/10 px-6 py-6 md:px-8 md:py-8">
            <div className="text-white/80 font-semibold">No teams yet</div>
            <div className="text-white/60 text-sm leading-relaxed">
              Teams will appear here once participants start creating them.
            </div>
          </div>
        ) : view === "GRID" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {teams.map((team) => (
              <PublicEventTeamCardInteractive
                key={team.id}
                orgSlug={orgSlug}
                eventSlug={eventSlug}
                team={team}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4 md:gap-6">
            {teams.map((team) => (
              <PublicEventTeamCardInteractive
                key={team.id}
                orgSlug={orgSlug}
                eventSlug={eventSlug}
                team={team}
                dense
              />
            ))}
          </div>
        )}

        {data.teams.length > 0 && teams.length === 0 ? (
          <div className="text-white/60 text-sm">
            No teams match your search.
          </div>
        ) : null}
      </div>

      {/* People looking for a team */}
      <div className="flex flex-col gap-3">
        <div className="flex md:flex-row flex-col items-start md:items-center justify-between gap-2">
          <div className="text-white/80 text-sm md:text-base font-semibold">
            People looking for a team{" "}
            <span className="text-white/60 text-xs">
              (Create a team to invite people to join.)
            </span>
          </div>
          <button
            className="px-4 py-2 cursor-pointer rounded-2xl bg-white text-primary-950 font-semibold text-xs md:text-sm hover:opacity-95 transition-opacity"
            onClick={handleSetLookingForTeam}
          >
            {meLookingForTeam
              ? "Stop looking for a team"
              : "Start looking for a team"}
          </button>
        </div>

        {canInvite ? (
          <div className="w-full rounded-3xl bg-white/4 border border-white/10 px-6 py-6 md:px-8 md:py-8 flex flex-col gap-3">
            <div className="text-white/80 text-sm font-semibold">
              Invite people to join{" "}
              <span className="text-white/90">{myLeaderTeam?.name}</span>
            </div>

            <div className="text-white/60 text-sm leading-relaxed">
              You’re a team leader. You can invite anyone who opted into
              “looking for a team”.
            </div>

            {inviteError ? (
              <div className="text-red-200 text-sm">{inviteError}</div>
            ) : null}

            {inviteSuccess ? (
              <div className="text-white/70 text-sm">{inviteSuccess}</div>
            ) : null}
          </div>
        ) : null}

        {lookingForTeam.length === 0 ? (
          <div className="text-white/60 text-sm">
            No one is currently marked as “looking for a team”.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {lookingForTeam.map((m) => (
              <div key={m.id} className="flex flex-col gap-3">
                <PublicEventLookingForTeamCard
                  orgSlug={orgSlug}
                  eventSlug={eventSlug}
                  member={m}
                />

                {canInvite ? (
                  <button
                    type="button"
                    onClick={() => handleInvite(m)}
                    disabled={invitingUserId === m.user.id}
                    className={[
                      "w-full px-4 py-3 rounded-2xl border text-sm font-semibold transition-colors",
                      invitingUserId === m.user.id
                        ? "bg-white/10 text-white/70 border-white/10 cursor-not-allowed"
                        : "bg-white text-primary-950 border-white hover:opacity-95",
                    ].join(" ")}
                  >
                    {invitingUserId === m.user.id
                      ? "Sending…"
                      : "Invite to join my team"}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicEventMembersClient;
