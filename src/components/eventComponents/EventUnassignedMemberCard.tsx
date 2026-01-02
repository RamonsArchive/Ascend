"use client";

import React, { useMemo, useState, useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { z } from "zod";

import type { ActionState } from "@/src/lib/global_types";
import { parseServerActionResponse, statusBadgeClasses } from "@/src/lib/utils";
import { removeEventParticipant } from "@/src/actions/event_actions";
import type { UnassignedMember } from "@/src/lib/global_types";

const initialState: ActionState = { status: "INITIAL", error: "", data: null };

const EventUnassignedMemberCard = ({
  orgId,
  eventId,
  member,
}: {
  orgId: string;
  eventId: string;
  member: UnassignedMember;
}) => {
  const [statusMessage, setStatusMessage] = useState("");
  const [errors, setErrors] = useState<{ remove?: string }>({});

  const avatarFallback = useMemo(() => {
    const n = (member.user.name ?? member.user.email ?? "U").trim();
    return n.slice(0, 1).toUpperCase();
  }, [member.user.name, member.user.email]);

  const submitRemove = async (
    _state: ActionState,
    _fd: FormData,
  ): Promise<ActionState> => {
    try {
      void _state;
      void _fd;

      setErrors({});
      const ok = window.confirm(
        `Remove ${member.user.name ?? member.user.email} from this event?`,
      );
      if (!ok) return initialState;

      setStatusMessage("Removing…");

      const fd = new FormData();
      fd.set("eventId", eventId);
      fd.set("participantId", member.id);

      const result = await removeEventParticipant(orgId, initialState, fd);

      if (result.status === "ERROR") {
        setStatusMessage(result.error || "Failed to remove participant.");
        toast.error("ERROR", {
          description: result.error || "Failed to remove participant.",
        });
        return result;
      }

      setStatusMessage("Removed.");
      toast.success("SUCCESS", { description: "Member removed from event." });
      return result;
    } catch (error) {
      console.error(error);
      setStatusMessage("Failed to remove participant.");

      if (error instanceof z.ZodError) {
        const msg = Object.values(z.flattenError(error).fieldErrors)
          .flat()
          .filter(Boolean)
          .join(", ");
        setErrors({ remove: msg || "Invalid input" });
        toast.error("ERROR", { description: msg || "Invalid input" });
        return parseServerActionResponse({
          status: "ERROR",
          error: msg || "Invalid input",
          data: null,
        }) as ActionState;
      }

      toast.error("ERROR", { description: "Failed to remove participant." });
      return parseServerActionResponse({
        status: "ERROR",
        error: "Failed to remove participant",
        data: null,
      }) as ActionState;
    }
  };

  const [, removeAction, removePending] = useActionState(
    submitRemove,
    initialState,
  );

  return (
    <div className="w-full rounded-3xl bg-white/4 border border-white/10 px-6 py-6 md:px-8 md:py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 md:gap-6">
          <div className="flex items-start gap-3">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0">
              {member.user.image ? (
                <Image
                  src={member.user.image}
                  alt="avatar"
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-white/70">
                  {avatarFallback}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col xs:flex-row xs:items-center gap-2">
                <div className="text-white font-semibold leading-tight">
                  {member.user.name ?? "Member"}
                </div>

                <div
                  className={[
                    "w-fit px-3 py-1 rounded-full border text-[11px] font-semibold tracking-wide",
                    statusBadgeClasses(member.status),
                  ].join(" ")}
                >
                  {member.status}
                </div>

                {member.lookingForTeam ? (
                  <div className="w-fit px-3 py-1 rounded-full border border-accent-400/20 bg-accent-500/10 text-accent-200 text-[11px] font-semibold tracking-wide">
                    Looking for team
                  </div>
                ) : null}
              </div>

              <div className="text-white/60 text-xs break-all">
                {member.user.email}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:items-end gap-3">
            <form action={removeAction} className="w-full md:w-auto">
              <button
                type="submit"
                disabled={removePending}
                className="w-full md:w-auto px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-xs md:text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {removePending ? "Removing..." : "Remove from event"}
              </button>
            </form>
          </div>
        </div>

        {errors.remove ? (
          <p className="text-red-500 text-xs md:text-sm">{errors.remove}</p>
        ) : null}

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

export default EventUnassignedMemberCard;
