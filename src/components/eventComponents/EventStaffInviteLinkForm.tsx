"use client";

import React, { useState, useActionState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import type { ActionState } from "@/src/lib/global_types";
import type { EventStaffRole } from "@/src/lib/global_types";
import { parseServerActionResponse } from "@/src/lib/utils";
import { createEventStaffInviteLinkClientSchema } from "@/src/lib/validation";
import { createEventStaffInviteLink } from "@/src/actions/event_staff_invites_actions";

const initialState: ActionState = { status: "INITIAL", error: "", data: null };

const DEFAULT_EXPIRE_MINUTES = 60 * 24 * 7;

const EventStaffInviteLinkForm = ({
  eventId,
  roleOptions,
}: {
  orgSlug: string; // kept for parity, not required because server returns shareUrl
  eventSlug: string; // same
  eventId: string;
  roleOptions: EventStaffRole[];
}) => {
  const [statusMessage, setStatusMessage] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState(() => ({
    note: "",
    maxUses: "",
    minutesToExpire: String(DEFAULT_EXPIRE_MINUTES),
    role: (roleOptions?.[0] ?? "STAFF") as EventStaffRole,
  }));

  const [errors, setErrors] = useState<{
    note?: string;
    maxUses?: string;
    minutesToExpire?: string;
    role?: string;
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

      const parsed = await createEventStaffInviteLinkClientSchema.parseAsync({
        eventId,
        role: formData.role,
        note: formData.note || undefined,
        maxUses: maxUsesNum,
        minutesToExpire: minutesToExpireNum,
      });

      setStatusMessage("Generating link…");

      const fd = new FormData();
      fd.set("eventId", parsed.eventId);
      fd.set("role", parsed.role);
      if (parsed.note) fd.set("note", parsed.note);
      if (typeof parsed.maxUses === "number")
        fd.set("maxUses", String(parsed.maxUses));
      if (typeof parsed.minutesToExpire === "number")
        fd.set("minutesToExpire", String(parsed.minutesToExpire));

      const result = await createEventStaffInviteLink(initialState, fd);

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
        const formatted: Record<string, string> = {};
        Object.keys(fieldErrors).forEach(
          (k) => (formatted[k] = fieldErrors[k]?.[0] || "")
        );
        setErrors(formatted);

        const msg = Object.values(formatted).filter(Boolean).join(", ");
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
    <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <form action={formAction} className="flex flex-col gap-6 md:gap-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-white/75">Role</label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  role: e.target.value as EventStaffRole,
                }))
              }
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white/80 outline-none"
            >
              {roleOptions.map((r) => (
                <option key={r} value={r} className="bg-primary-950">
                  Invite as {r}
                </option>
              ))}
            </select>
            {errors.role ? (
              <p className="text-red-500 text-xs">{errors.role}</p>
            ) : null}
          </div>

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
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none"
            />
            {errors.maxUses ? (
              <p className="text-red-500 text-xs">{errors.maxUses}</p>
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
              placeholder="Internal tracking"
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none"
            />
            {errors.note ? (
              <p className="text-red-500 text-xs">{errors.note}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs md:text-sm text-white/75">
            Minutes to expire (optional)
          </label>
          <input
            value={formData.minutesToExpire}
            onChange={(e) =>
              setFormData((p) => ({ ...p, minutesToExpire: e.target.value }))
            }
            inputMode="numeric"
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none"
          />
          {errors.minutesToExpire ? (
            <p className="text-red-500 text-xs">{errors.minutesToExpire}</p>
          ) : null}
        </div>

        <div className="flex w-full justify-center">
          <button
            type="submit"
            disabled={isPending}
            className="w-full max-w-sm px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Generating..." : "Generate staff invite link"}
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

export default EventStaffInviteLinkForm;
