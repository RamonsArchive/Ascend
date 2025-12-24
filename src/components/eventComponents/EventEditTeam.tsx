"use client";

import React, { useRef, useState, useActionState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import SplitText from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import type { ActionState } from "@/src/lib/global_types";
import { parseServerActionResponse } from "@/src/lib/utils";
import { updateEventTeamSettingsClientSchema } from "@/src/lib/validation";
import { updateEventTeamSettings } from "@/src/actions/event_actions";

gsap.registerPlugin(ScrollTrigger, SplitText);

const initialState: ActionState = { status: "INITIAL", error: "", data: null };

const EventEditTeamForm = ({
  eventId,
  orgId,
  defaults,
}: {
  eventId: string;
  orgId: string;
  defaults: {
    maxTeamSize: number;
    lockTeamChangesAtStart: boolean;
    allowSelfJoinRequests: boolean;
  };
}) => {
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const maxTeamSizeLabelRef = useRef<HTMLLabelElement>(null);
  const lockTeamsLabelRef = useRef<HTMLLabelElement>(null);
  const allowSelfJoinLabelRef = useRef<HTMLLabelElement>(null);

  const [statusMessage, setStatusMessage] = useState("");

  const [formData, setFormData] = useState(() => ({
    maxTeamSize: String(defaults.maxTeamSize ?? 5),
    lockTeamChangesAtStart: !!defaults.lockTeamChangesAtStart,
    allowSelfJoinRequests: !!defaults.allowSelfJoinRequests,
  }));

  const [errors, setErrors] = useState<{
    maxTeamSize?: string;
    lockTeamChangesAtStart?: string;
    allowSelfJoinRequests?: string;
  }>({});

  useGSAP(() => {
    let cleanup: undefined | (() => void);

    const init = () => {
      if (
        !maxTeamSizeLabelRef.current ||
        !lockTeamsLabelRef.current ||
        !allowSelfJoinLabelRef.current ||
        !submitButtonRef.current
      ) {
        requestAnimationFrame(init);
        return;
      }

      const triggerEl = document.getElementById("event-edit-team-form");
      if (!triggerEl) {
        requestAnimationFrame(init);
        return;
      }

      const splits = [
        new SplitText(maxTeamSizeLabelRef.current, { type: "words" }),
        new SplitText(lockTeamsLabelRef.current, { type: "words" }),
        new SplitText(allowSelfJoinLabelRef.current, { type: "words" }),
      ];

      const allLabels = splits.flatMap((s) => s.words);

      const allInputs = [
        submitButtonRef.current,
        ...Array.from(
          triggerEl.querySelectorAll("input, textarea, select, button")
        ),
      ].filter(Boolean) as HTMLElement[];

      gsap.set(allLabels, { opacity: 0, y: 48 });
      gsap.set(allInputs, { opacity: 0, y: 48 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerEl,
          start: "top 85%",
          end: "top 40%",
          scrub: 1,
        },
        defaults: { ease: "power3.out", duration: 0.6 },
      });

      tl.to(allLabels, { opacity: 1, y: 0, stagger: 0.02 }, 0).to(
        allInputs,
        { opacity: 1, y: 0, stagger: 0.04 },
        0.05
      );

      requestAnimationFrame(() => ScrollTrigger.refresh());

      cleanup = () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        splits.forEach((s) => s.revert());
      };
    };

    init();
    return () => cleanup?.();
  }, []);

  const submit = async (
    _state: ActionState,
    _fd: FormData
  ): Promise<ActionState> => {
    try {
      void _state;
      void _fd;

      setErrors({});
      setStatusMessage("");

      const parsed = await updateEventTeamSettingsClientSchema.parseAsync({
        eventId,
        maxTeamSize:
          formData.maxTeamSize.trim() === ""
            ? undefined
            : Number(formData.maxTeamSize),
        lockTeamChangesAtStart: formData.lockTeamChangesAtStart,
        allowSelfJoinRequests: formData.allowSelfJoinRequests,
      });

      setStatusMessage("Saving team settings…");

      const fd = new FormData();
      fd.set("eventId", parsed.eventId);
      fd.set("maxTeamSize", String(parsed.maxTeamSize));
      fd.set("lockTeamChangesAtStart", String(parsed.lockTeamChangesAtStart));
      fd.set("allowSelfJoinRequests", String(parsed.allowSelfJoinRequests));

      const result = await updateEventTeamSettings(initialState, fd);

      if (result.status === "ERROR") {
        setStatusMessage(result.error || "Failed to save.");
        toast.error("ERROR", {
          description: result.error || "Failed to save.",
        });
        return result;
      }

      setStatusMessage("Saved.");
      toast.success("SUCCESS", { description: "Team settings updated." });

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
        error: "An error occurred while saving settings",
        data: null,
      }) as ActionState;
    }
  };

  const [, formAction, isPending] = useActionState(submit, initialState);

  return (
    <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
      <form
        id="event-edit-team-form"
        action={formAction}
        className="flex flex-col gap-6 md:gap-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="flex flex-col gap-2">
            <label
              ref={maxTeamSizeLabelRef}
              className="text-xs md:text-sm text-white/75 flex items-center gap-1"
            >
              Max team size
              <span className="text-xs text-red-500">*</span>
            </label>
            <input
              value={formData.maxTeamSize}
              onChange={(e) =>
                setFormData((p) => ({ ...p, maxTeamSize: e.target.value }))
              }
              placeholder="e.g. 5"
              inputMode="numeric"
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            />
            {errors.maxTeamSize ? (
              <p className="text-red-500 text-xs md:text-sm">
                {errors.maxTeamSize}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-xs text-white/65 leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            Cap how many members can be on a team.
            <div className="text-white/50">
              Recommended: 3–6 for smoother judging and coordination.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="flex flex-col gap-2">
            <label
              ref={lockTeamsLabelRef}
              className="text-xs md:text-sm text-white/75"
            >
              Lock team changes at start
            </label>

            <button
              type="button"
              onClick={() =>
                setFormData((p) => ({
                  ...p,
                  lockTeamChangesAtStart: !p.lockTeamChangesAtStart,
                }))
              }
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/10 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            >
              <div className="text-left">
                <div className="text-sm md:text-base text-white">
                  {formData.lockTeamChangesAtStart ? "Enabled" : "Disabled"}
                </div>
                <div className="text-xs text-white/55">
                  If enabled, joining/leaving should be blocked once the event
                  begins.
                </div>
              </div>

              <div
                className={[
                  "h-6 w-11 rounded-full border border-white/10 p-1 transition-colors",
                  formData.lockTeamChangesAtStart
                    ? "bg-accent-500/30"
                    : "bg-white/10",
                ].join(" ")}
              >
                <div
                  className={[
                    "h-4 w-4 rounded-full bg-white transition-transform",
                    formData.lockTeamChangesAtStart
                      ? "translate-x-5"
                      : "translate-x-0",
                  ].join(" ")}
                />
              </div>
            </button>

            {errors.lockTeamChangesAtStart ? (
              <p className="text-red-500 text-xs md:text-sm">
                {errors.lockTeamChangesAtStart}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label
              ref={allowSelfJoinLabelRef}
              className="text-xs md:text-sm text-white/75"
            >
              Allow self join requests
            </label>

            <button
              type="button"
              onClick={() =>
                setFormData((p) => ({
                  ...p,
                  allowSelfJoinRequests: !p.allowSelfJoinRequests,
                }))
              }
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/10 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            >
              <div className="text-left">
                <div className="text-sm md:text-base text-white">
                  {formData.allowSelfJoinRequests ? "Enabled" : "Disabled"}
                </div>
                <div className="text-xs text-white/55">
                  If enabled, users can request to join teams on the event page.
                </div>
              </div>

              <div
                className={[
                  "h-6 w-11 rounded-full border border-white/10 p-1 transition-colors",
                  formData.allowSelfJoinRequests
                    ? "bg-accent-500/30"
                    : "bg-white/10",
                ].join(" ")}
              >
                <div
                  className={[
                    "h-4 w-4 rounded-full bg-white transition-transform",
                    formData.allowSelfJoinRequests
                      ? "translate-x-5"
                      : "translate-x-0",
                  ].join(" ")}
                />
              </div>
            </button>

            {errors.allowSelfJoinRequests ? (
              <p className="text-red-500 text-xs md:text-sm">
                {errors.allowSelfJoinRequests}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex w-full justify-center">
          <button
            type="submit"
            disabled={isPending}
            ref={submitButtonRef}
            className="w-full max-w-sm px-5 py-3 rounded-2xl cursor-pointer bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save team settings"}
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

export default EventEditTeamForm;
