"use client";

import React, { useActionState, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import type { ActionState } from "@/src/lib/global_types";
import { parseServerActionResponse } from "@/src/lib/utils";

// TODO: implement this server action
import { createTeamJoinRequest } from "@/src/actions/team_invites_actions";

const initialState: ActionState = { status: "INITIAL", error: "", data: null };

const PublicEventTeamCardInteractive = ({
  orgSlug,
  eventSlug,
  team,
  dense,
}: {
  orgSlug: string;
  eventSlug: string;
  team: {
    id: string;
    slug: string;
    name: string;
    lookingForMembers: boolean;
    track: { id: string; name: string } | null;
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
  const preview = useMemo(() => team.members.slice(0, 6), [team.members]);
  const href = `/app/orgs/${orgSlug}/events/${eventSlug}/teams/${team.slug}`;

  const submitRequest = async (
    _state: ActionState,
    _fd: FormData
  ): Promise<ActionState> => {
    try {
      void _state;
      void _fd;

      setStatusMessage("");

      const ok = window.confirm(`Request to join "${team.name}"?`);
      if (!ok) return initialState;

      setStatusMessage("Sending request…");

      const res = await createTeamJoinRequest(orgSlug, eventSlug, team.id, "");

      if (res.status === "ERROR") {
        setStatusMessage(res.error || "Failed to send request.");
        toast.error("ERROR", {
          description: res.error || "Failed to send request.",
        });
        return res;
      }

      setStatusMessage("Request sent.");
      toast.success("SUCCESS", { description: "Join request sent to team." });
      return res;
    } catch (e) {
      console.error(e);
      setStatusMessage("Failed to send request.");
      toast.error("ERROR", { description: "Failed to send request." });
      return parseServerActionResponse({
        status: "ERROR",
        error: "Failed to send request",
        data: null,
      }) as ActionState;
    }
  };

  const [, requestAction, requestPending] = useActionState(
    submitRequest,
    initialState
  );

  return (
    <div
      className={[
        "w-full rounded-3xl bg-white/4 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
        dense ? "px-6 py-6 md:px-8 md:py-7" : "px-6 py-6 md:px-8 md:py-8",
      ].join(" ")}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Link
              href={href}
              className="text-white font-semibold text-lg md:text-xl leading-tight hover:opacity-90 transition-opacity"
            >
              {team.name}
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              {team.track ? (
                <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/70 text-[11px] font-semibold">
                  {team.track.name}
                </div>
              ) : null}

              <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/70 text-[11px] font-semibold">
                {memberCount} member{memberCount === 1 ? "" : "s"}
              </div>

              {team.lookingForMembers ? (
                <div className="px-3 py-1 rounded-full border border-accent-400/20 bg-accent-500/10 text-accent-200 text-[11px] font-semibold">
                  Looking for members
                </div>
              ) : (
                <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/60 text-[11px] font-semibold">
                  Closed
                </div>
              )}
            </div>
          </div>

          <Link
            href={href}
            className="text-white/40 text-xs hover:text-white/60 transition-colors"
          >
            View
          </Link>
        </div>

        <div className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="grid grid-cols-6 gap-2">
            {preview.map((m) => {
              const fallback = (m.user.name ?? m.user.email ?? "U")
                .trim()
                .slice(0, 1)
                .toUpperCase();

              return (
                <div
                  key={m.id}
                  className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-white/5"
                  title={m.user.name ?? m.user.email}
                >
                  {m.user.image ? (
                    <Image
                      src={m.user.image}
                      alt="avatar"
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-white/70">
                      {fallback}
                    </div>
                  )}

                  <div className="absolute bottom-1 left-1 px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-[10px] text-white/80">
                    {m.role}
                  </div>
                </div>
              );
            })}

            {team.members.length > preview.length ? (
              <div className="aspect-square rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-xs text-white/70">
                +{team.members.length - preview.length}
              </div>
            ) : null}

            {preview.length < 6
              ? Array.from({ length: 6 - preview.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="aspect-square rounded-xl border border-white/10 bg-white/3"
                  />
                ))
              : null}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-white/60 text-xs">
            {team.lookingForMembers
              ? "Request to join if you’re registered for the event."
              : "This team is not accepting requests."}
          </div>

          <div className="flex gap-3">
            <Link
              href={href}
              className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-xs md:text-sm"
            >
              View team
            </Link>

            {team.lookingForMembers ? (
              <form action={requestAction}>
                <button
                  type="submit"
                  disabled={requestPending}
                  className="px-4 py-2 rounded-2xl bg-white text-primary-950 font-semibold text-xs md:text-sm hover:opacity-95 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {requestPending ? "Sending…" : "Request to join"}
                </button>
              </form>
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

export default PublicEventTeamCardInteractive;
