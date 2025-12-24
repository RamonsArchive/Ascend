"use client";

import React, { useRef, useState, useActionState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import type { ActionState } from "@/src/lib/global_types";
import { parseServerActionResponse } from "@/src/lib/utils";
import { createEventInviteLinkClientSchema } from "@/src/lib/validation";
import { createEventInviteLink } from "@/src/actions/event_invites_actions";

const initialState: ActionState = { status: "INITIAL", error: "", data: null };

const DEFAULT_EXPIRE_MINUTES = 60 * 24 * 7; // 1 week
const MAX_EXPIRE_MINUTES = 60 * 24 * 7 * 4; // 4 weeks
const MIN_EXPIRE_MINUTES = 60; // 1 hour

const EventInviteLinkForm = ({ eventId }: { eventId: string }) => {
  const [statusMessage, setStatusMessage] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState(() => ({
    note: "",
    maxUses: "",
    minutesToExpire: String(DEFAULT_EXPIRE_MINUTES),
  }));

  const [errors, setErrors] = useState<{
    note?: string;
    maxUses?: string;
    minutesToExpire?: string;
  }>({});

  const copyUrl = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      toast.success("SUCCESS", { description: "Invite link copied." });
    } catch {
      toast.error("ERROR", { description: "Failed to copy. Copy manually." });
    }
  };

  const submit = async (
    _state: ActionState,
    _fd: FormData
  ): Promise<ActionState> => {
    try {
      void _state;
      void _fd;

      setErrors({});
      setStatusMessage("");
      setGeneratedUrl(null);

      const maxUsesNum =
        formData.maxUses.trim() === "" ? undefined : Number(formData.maxUses);

      const minutesToExpireNum =
        formData.minutesToExpire.trim() === ""
          ? undefined
          : Number(formData.minutesToExpire);

      const parsed = await createEventInviteLinkClientSchema.parseAsync({
        eventId,
        note: formData.note || undefined,
        maxUses: maxUsesNum,
        minutesToExpire: minutesToExpireNum,
      });

      setStatusMessage("Generating link…");

      const fd = new FormData();
      fd.set("eventId", parsed.eventId);
      if (parsed.note) fd.set("note", parsed.note);
      if (typeof parsed.maxUses === "number")
        fd.set("maxUses", String(parsed.maxUses));
      if (typeof parsed.minutesToExpire === "number") {
        fd.set("minutesToExpire", String(parsed.minutesToExpire));
      }

      const result = await createEventInviteLink(initialState, fd);

      if (result.status === "ERROR") {
        setStatusMessage(result.error || "Failed to generate link.");
        toast.error("ERROR", {
          description: result.error || "Failed to generate link.",
        });
        return result;
      }

      const shareUrl = (result.data as { shareUrl?: string } | null)?.shareUrl;
      if (!shareUrl) {
        toast.error("ERROR", { description: "Missing shareUrl from server." });
        return parseServerActionResponse({
          status: "ERROR",
          error: "Missing shareUrl from server",
          data: null,
        }) as ActionState;
      }

      setGeneratedUrl(shareUrl);
      setStatusMessage("Invite link created.");
      toast.success("SUCCESS", { description: "Invite link created." });

      return result;
    } catch (error) {
      console.error(error);
      setStatusMessage("Please fix the highlighted fields.");

      if (error instanceof z.ZodError) {
        const fieldErrors = z.flattenError(error).fieldErrors as Record<
          string,
          string[]
        >;
        const formattedErrors: Record<string, string> = {};
        Object.keys(fieldErrors).forEach((key) => {
          formattedErrors[key] = fieldErrors[key]?.[0] || "";
        });
        setErrors(formattedErrors);

        const msg = Object.values(formattedErrors).filter(Boolean).join(", ");
        toast.error("ERROR", { description: msg });

        return parseServerActionResponse({
          status: "ERROR",
          error: msg,
          data: null,
        }) as ActionState;
      }

      toast.error("ERROR", {
        description: "An error occurred. Please try again.",
      });
      return parseServerActionResponse({
        status: "ERROR",
        error: "An error occurred while generating link",
        data: null,
      }) as ActionState;
    }
  };

  const [, formAction, isPending] = useActionState(submit, initialState);

  return (
    <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
      <form
        id="event-invite-link-form"
        action={formAction}
        className="flex flex-col gap-6 md:gap-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-white/75">
              Max uses (optional)
            </label>
            <input
              value={formData.maxUses}
              onChange={(e) =>
                setFormData((p) => ({ ...p, maxUses: e.target.value }))
              }
              placeholder="e.g. 25"
              inputMode="numeric"
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            />
            {errors.maxUses ? (
              <p className="text-red-500 text-xs md:text-sm">
                {errors.maxUses}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-white/75">
              Note (optional)
            </label>
            <input
              value={formData.note}
              onChange={(e) =>
                setFormData((p) => ({ ...p, note: e.target.value }))
              }
              placeholder="Used for tracking (internal)"
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            />
            {errors.note ? (
              <p className="text-red-500 text-xs md:text-sm">{errors.note}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs md:text-sm text-white/75">
            Minutes to expire (optional)
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <input
              value={formData.minutesToExpire}
              onChange={(e) =>
                setFormData((p) => ({ ...p, minutesToExpire: e.target.value }))
              }
              placeholder={`Default ${DEFAULT_EXPIRE_MINUTES} (1 week)`}
              inputMode="numeric"
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            />

            <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-xs text-white/65 leading-relaxed">
              Min: {MIN_EXPIRE_MINUTES} (1 hour) • Max: {MAX_EXPIRE_MINUTES} (4
              weeks)
              <div className="text-white/50">
                Tip: 1440 = 1 day • 10080 = 1 week • 43200 = 30 days
              </div>
            </div>
          </div>

          {errors.minutesToExpire ? (
            <p className="text-red-500 text-xs md:text-sm">
              {errors.minutesToExpire}
            </p>
          ) : null}
        </div>

        <div className="flex w-full justify-center">
          <button
            type="submit"
            disabled={isPending}
            className="w-full max-w-sm px-5 py-3 rounded-2xl cursor-pointer bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Generating..." : "Generate invite link"}
          </button>
        </div>
      </form>

      {generatedUrl ? (
        <div className="flex flex-col gap-3 pt-6">
          <div className="text-white/80 text-xs md:text-sm">Generated link</div>
          <div className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 flex items-center justify-between gap-3">
            <div className="text-white text-xs md:text-sm break-all">
              {generatedUrl}
            </div>
            <button
              type="button"
              onClick={copyUrl}
              className="shrink-0 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-xs md:text-sm"
            >
              Copy
            </button>
          </div>
        </div>
      ) : null}

      {statusMessage ? (
        <div className="flex items-center justify-center w-full pt-6">
          <p className="text-white/90 text-xs md:text-sm text-center px-4 py-3 rounded-xl bg-white/5 border border-white/10">
            {statusMessage}
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default EventInviteLinkForm;
