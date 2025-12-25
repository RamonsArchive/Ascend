"use client";

import React, { useMemo, useState, useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import type { ActionState } from "@/src/lib/global_types";
import { parseServerActionResponse } from "@/src/lib/utils";
import { removeEventTeam } from "@/src/actions/event_actions";

const initialState: ActionState = { status: "INITIAL", error: "", data: null };

const AdminEventTeamCard = ({
  orgSlug,
  eventId,
  team,
  dense,
}: {
  orgSlug: string;
  eventId: string;
  team: {
    id: string;
    name: string;
    track: string | null;
    lookingForMembers: boolean;
    createdAt: string;
    members: Array<{
      id: string;
      userId: string;
      role: "LEADER" | "MEMBER";
      user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
      };
    }>;
  };
  dense?: boolean;
}) => {
  const [statusMessage, setStatusMessage] = useState("");

  const memberCount = team.members.length;

  const preview = useMemo(() => team.members.slice(0, 5), [team.members]);

  const teamHref = `/app/events/teams/${team.id}`;
  // If you want orgSlug/eventSlug in url, pass them down and build it:
  // `/app/orgs/${orgSlug}/events/${eventSlug}/teams/${team.id}`

  const deleteTeamSubmit = async (
    _s: ActionState,
    _fd: FormData
  ): Promise<ActionState> => {
    try {
      void _s;
      void _fd;
      const ok = window.confirm(
        `Delete team "${team.name}"? This removes the team and its team memberships.`
      );
      if (!ok) return initialState;

      setStatusMessage("Deleting…");

      const fd = new FormData();
      fd.set("eventId", eventId);
      fd.set("teamId", team.id);

      const res = await removeEventTeam(orgSlug, initialState, fd);
      if (res.status === "ERROR") {
        setStatusMessage(res.error || "Failed to delete team.");
        toast.error("ERROR", {
          description: res.error || "Failed to delete team.",
        });
        return res;
      }

      setStatusMessage("Team deleted.");
      toast.success("SUCCESS", { description: "Team deleted." });
      return res;
    } catch (e) {
      console.error(e);
      setStatusMessage("Failed to delete team.");
      toast.error("ERROR", { description: "Failed to delete team." });
      return parseServerActionResponse({
        status: "ERROR",
        error: "Failed to delete team",
        data: null,
      }) as ActionState;
    }
  };

  const [, deleteAction, deleting] = useActionState(
    deleteTeamSubmit,
    initialState
  );

  return (
    <div className="w-full rounded-3xl bg-white/4 border border-white/10 px-6 py-6 md:px-8 md:py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={teamHref}
                className="text-white font-semibold text-lg hover:opacity-90 transition-opacity"
              >
                {team.name}
              </Link>
              {team.track ? (
                <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/70 text-[11px] font-semibold">
                  {team.track}
                </div>
              ) : null}
              <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/70 text-[11px] font-semibold">
                {memberCount} member{memberCount === 1 ? "" : "s"}
              </div>
              {team.lookingForMembers ? (
                <div className="px-3 py-1 rounded-full border border-accent-400/20 bg-accent-500/10 text-accent-200 text-[11px] font-semibold">
                  Looking for members
                </div>
              ) : null}
            </div>

            <div className="text-white/60 text-xs break-all">
              Team ID: {team.id}
            </div>
          </div>

          <form action={deleteAction}>
            <button
              type="submit"
              disabled={deleting}
              className="w-full md:w-auto px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-xs md:text-sm disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Delete team"}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-3">
          <div className="text-white/70 text-xs md:text-sm">Preview</div>
          <div className="flex flex-wrap items-center gap-3">
            {preview.map((m) => {
              const fallback = (m.user.name ?? m.user.email ?? "U")
                .trim()
                .slice(0, 1)
                .toUpperCase();
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-3 py-2"
                >
                  <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-white/10 bg-white/5">
                    {m.user.image ? (
                      <Image
                        src={m.user.image}
                        alt="avatar"
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[11px] text-white/70">
                        {fallback}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-white text-xs font-semibold leading-tight">
                      {m.user.name ?? "Member"}
                    </div>
                    <div className="text-white/60 text-[11px]">{m.role}</div>
                  </div>
                </div>
              );
            })}
            {team.members.length > preview.length ? (
              <div className="text-white/60 text-xs">
                +{team.members.length - preview.length} more
              </div>
            ) : null}
          </div>
        </div>

        {statusMessage ? (
          <div className="flex items-center justify-center w-full">
            <p className="text-white/90 text-xs md:text-sm text-center px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              {statusMessage}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AdminEventTeamCard;
