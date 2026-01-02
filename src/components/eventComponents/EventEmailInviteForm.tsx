"use client";

import React, { useRef, useState, useActionState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import type { ActionState } from "@/src/lib/global_types";
import { parseServerActionResponse } from "@/src/lib/utils";
import { createEventInviteEmailClientSchema } from "@/src/lib/validation";
import { createEventEmailInvite } from "@/src/actions/event_invites_actions";

const initialState: ActionState = { status: "INITIAL", error: "", data: null };

const EventEmailInviteForm = ({ eventId }: { eventId: string }) => {
  const [statusMessage, setStatusMessage] = useState("");

  const [formData, setFormData] = useState(() => ({
    email: "",
    message: "",
    minutesToExpire: "10080", // 1 week
  }));

  const [errors, setErrors] = useState<{
    email?: string;
    message?: string;
    minutesToExpire?: string;
  }>({});

  const clearForm = () => {
    setFormData({ email: "", message: "", minutesToExpire: "10080" });
    setErrors({});
    setStatusMessage("");
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

      const parsed = await createEventInviteEmailClientSchema.parseAsync({
        eventId,
        email: formData.email,
        message: formData.message || undefined,
        minutesToExpire:
          formData.minutesToExpire.trim() === ""
            ? undefined
            : Number(formData.minutesToExpire),
      });

      setStatusMessage("Sending invite…");

      const fd = new FormData();
      fd.set("eventId", parsed.eventId);
      fd.set("email", parsed.email);
      if (parsed.message) fd.set("message", parsed.message);
      if (typeof parsed.minutesToExpire === "number") {
        fd.set("minutesToExpire", String(parsed.minutesToExpire));
      }

      const result = await createEventEmailInvite(initialState, fd);

      if (result.status === "ERROR") {
        setStatusMessage(result.error || "Failed to send invite.");
        toast.error("ERROR", {
          description: result.error || "Failed to send invite.",
        });
        return result;
      }

      setStatusMessage("Invite sent.");
      toast.success("SUCCESS", { description: "Invite sent." });

      clearForm();
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
        error: "An error occurred while sending invite",
        data: null,
      }) as ActionState;
    }
  };

  const [, formAction, isPending] = useActionState(submit, initialState);

  return (
    <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
      <form
        id="event-email-invite-form"
        action={formAction}
        className="flex flex-col gap-6 md:gap-8"
      >
        <div className="flex flex-col gap-2">
          <label className="text-xs md:text-sm text-white/75 flex items-center gap-1">
            Invite by email
            <span className="text-xs text-red-500">*</span>
          </label>
          <input
            value={formData.email}
            onChange={(e) =>
              setFormData((p) => ({ ...p, email: e.target.value }))
            }
            placeholder="person@domain.com"
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          />
          {errors.email ? (
            <p className="text-red-500 text-xs md:text-sm">{errors.email}</p>
          ) : null}
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
              placeholder="Default 10080 (1 week)"
              inputMode="numeric"
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            />

            <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-xs text-white/65 leading-relaxed">
              Tip: 1440 = 1 day • 10080 = 1 week • 43200 = 30 days
            </div>
          </div>

          {errors.minutesToExpire ? (
            <p className="text-red-500 text-xs md:text-sm">
              {errors.minutesToExpire}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs md:text-sm text-white/75">
            Message (optional)
          </label>
          <textarea
            value={formData.message}
            onChange={(e) =>
              setFormData((p) => ({ ...p, message: e.target.value }))
            }
            placeholder="Add a short note…"
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors min-h-[110px] resize-none shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          />
          {errors.message ? (
            <p className="text-red-500 text-xs md:text-sm">{errors.message}</p>
          ) : null}
        </div>

        <div className="flex w-full justify-center">
          <button
            type="submit"
            disabled={isPending}
            className="w-full max-w-sm px-5 py-3 rounded-2xl cursor-pointer bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Sending..." : "Send invite"}
          </button>
        </div>
      </form>

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

export default EventEmailInviteForm;
