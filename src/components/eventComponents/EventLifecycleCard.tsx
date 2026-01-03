"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import type { ActionState, EventLifecycleAction } from "@/src/lib/global_types";
import { updateEventLifecycle } from "@/src/actions/event_actions";
import { eventPillClasses, eventStatusLabel } from "@/src/lib/utils";
import { card, inner, titleText, subtleText } from "@/src/lib/utils";

type Props = {
  orgId: string;
  eventId: string;
  status: EventLifecycleAction; // allow string if your EventCompleteData types status as string
};

function actionLabel(action: EventLifecycleAction) {
  switch (action) {
    case "PUBLISHED":
      return "Publish";
    case "DRAFT":
      return "Move to Draft";
    case "ARCHIVED":
      return "Archive";
  }
}

function actionHelp(action: EventLifecycleAction) {
  switch (action) {
    case "PUBLISHED":
      return "Makes the event live to participants (depending on visibility).";
    case "DRAFT":
      return "Keeps the event editable and not fully launched.";
    case "ARCHIVED":
      return "Locks the event as inactive and hides it from normal flows.";
  }
}

const EventLifecycleCard = ({ orgId, eventId, status }: Props) => {
  const router = useRouter();
  const [pendingAction, setPendingAction] =
    useState<EventLifecycleAction | null>(null);

  const current = String(status || "").toUpperCase();
  const isPending = pendingAction !== null;

  const run = async (action: EventLifecycleAction) => {
    if (isPending) return;

    // no-op guard
    if (current === action) return;

    // confirm archive
    if (action === "ARCHIVED") {
      const ok = window.confirm(
        "Archive this event?\n\nThis usually hides it from normal participant flows. You can keep it for records, but it should be treated as inactive.",
      );
      if (!ok) return;
    }

    try {
      setPendingAction(action);

      const res = await updateEventLifecycle(orgId, eventId, action);

      if (res.status === "ERROR") {
        toast.error("ERROR", { description: res.error || "Failed to update." });
        return;
      }

      toast.success("SUCCESS", { description: `Status updated to ${action}.` });
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("ERROR", { description: "Failed to update event status." });
    } finally {
      setPendingAction(null);
    }
  };

  const actions: EventLifecycleAction[] = ["PUBLISHED", "DRAFT", "ARCHIVED"];

  return (
    <div className={`w-full ${card} p-6 md:p-8 flex flex-col gap-4`}>
      <div className="flex flex-col gap-1">
        <div className={titleText}>Lifecycle</div>
        <div className={subtleText}>
          Publish, revert to draft, or archive this event.
        </div>
      </div>

      <div className={`${inner} p-4 flex flex-col gap-3`}>
        <div className="flex flex-col gap-2">
          <div className="text-white/70 text-xs">Current status</div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={[
                "px-3 py-1 rounded-full border text-[11px] font-semibold",
                eventPillClasses("STATUS", current),
              ].join(" ")}
            >
              {eventStatusLabel(current)}
            </div>

            {isPending ? (
              <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/70 text-[11px] font-semibold">
                Updating…
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {actions.map((a) => {
            const selected = current === a;
            const disabled = selected || isPending;

            const baseBtn =
              "w-full px-4 py-3 rounded-2xl border text-sm font-semibold transition-colors";
            const primary =
              "bg-white text-primary-950 border-white hover:opacity-90";
            const neutral =
              "bg-white/5 text-white/80 border-white/10 hover:bg-white/10";
            const danger =
              "bg-white/5 text-white/80 border-white/10 hover:bg-white/10";

            const btnClass =
              a === "PUBLISHED"
                ? `${baseBtn} ${primary}`
                : a === "ARCHIVED"
                  ? `${baseBtn} ${danger}`
                  : `${baseBtn} ${neutral}`;

            return (
              <div key={a} className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => run(a)}
                  className={`${btnClass} disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {selected ? `${actionLabel(a)} (Current)` : actionLabel(a)}
                </button>

                <div className="text-white/50 text-xs leading-relaxed">
                  {actionHelp(a)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-white/50 text-xs leading-relaxed">
          Tip: Put “Publish” behind a quick final review (dates, cover, rules)
          so you don’t launch accidentally.
        </div>
      </div>
    </div>
  );
};

export default EventLifecycleCard;
