"use client";

import React, { useMemo, useRef, useState, useActionState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import SplitText from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import type { ActionState } from "@/src/lib/global_types";
import { parseServerActionResponse } from "@/src/lib/utils";
import { updateOrgJoinSettings } from "@/src/actions/org_actions";
import { OrgJoinMode } from "@prisma/client";
import { editOrgJoinSettingsClientSchema } from "@/src/lib/validation";
import type { JoinSettingsErrors } from "@/src/lib/global_types";
import { JOIN_MODE_OPTIONS } from "@/src/constants/orgConstants/org_index";

gsap.registerPlugin(ScrollTrigger, SplitText);

const initialState: ActionState = {
  status: "INITIAL",
  error: "",
  data: null,
};

const EditOrgJoinSettingsForm = ({
  orgId,
  allowJoinRequests,
  joinMode,
  currentUserId,
}: {
  orgId: string;
  allowJoinRequests: boolean;
  joinMode: OrgJoinMode | null;
  // IMPORTANT: pass this in from the page (session.user.id)
  currentUserId: string;
}) => {
  const joinModeLabelRef = useRef<HTMLLabelElement>(null);
  const allowLabelRef = useRef<HTMLLabelElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  const [statusMessage, setStatusMessage] = useState("");
  const [errors, setErrors] = useState<JoinSettingsErrors>({});

  const [formData, setFormData] = useState(() => {
    const initialJoinMode = joinMode ?? OrgJoinMode.INVITE_ONLY;
    return {
      joinMode: initialJoinMode,
      allowJoinRequests:
        initialJoinMode === OrgJoinMode.REQUEST ? !!allowJoinRequests : false,
    };
  });

  const allowToggleEnabled = formData.joinMode === OrgJoinMode.REQUEST;

  useGSAP(() => {
    let cleanup: undefined | (() => void);

    const initAnimations = () => {
      if (
        !joinModeLabelRef.current ||
        !allowLabelRef.current ||
        !saveButtonRef.current
      ) {
        requestAnimationFrame(initAnimations);
        return;
      }

      const triggerEl = document.getElementById("edit-org-join-settings-form");
      if (!triggerEl) {
        requestAnimationFrame(initAnimations);
        return;
      }

      const splits = [
        new SplitText(joinModeLabelRef.current, { type: "words" }),
        new SplitText(allowLabelRef.current, { type: "words" }),
      ];

      const labelWords = splits.flatMap((s) => s.words);

      const inputs = Array.from(
        triggerEl.querySelectorAll("select, button, input")
      ).filter(Boolean) as HTMLElement[];

      gsap.set(labelWords, { opacity: 0, y: 48 });
      gsap.set(inputs, { opacity: 0, y: 48 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerEl,
          start: "top 85%",
          end: "top 40%",
          scrub: 1,
        },
        defaults: { ease: "power3.out", duration: 0.6 },
      });

      tl.to(labelWords, { opacity: 1, y: 0, stagger: 0.03 }, 0).to(
        inputs,
        { opacity: 1, y: 0, stagger: 0.05 },
        0.06
      );

      requestAnimationFrame(() => ScrollTrigger.refresh());

      cleanup = () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        splits.forEach((s) => s.revert());
      };
    };

    initAnimations();
    return () => cleanup?.();
  }, []);

  const submitForm = async (
    _state: ActionState,
    _fd: FormData
  ): Promise<ActionState> => {
    try {
      void _state;
      void _fd;

      setErrors({});
      setStatusMessage("");

      const parsed = await editOrgJoinSettingsClientSchema.parseAsync({
        orgId,
        joinMode: formData.joinMode,
        allowJoinRequests: formData.allowJoinRequests,
      });

      setStatusMessage("Saving join settings…");

      const result = await updateOrgJoinSettings(orgId, currentUserId, {
        joinMode: parsed.joinMode,
        allowJoinRequests: parsed.allowJoinRequests,
      });

      if (result.status === "ERROR") {
        setStatusMessage(result.error || "Failed to update join settings.");
        toast.error("ERROR", {
          description: result.error || "Failed to update join settings.",
        });
        return result;
      }

      setStatusMessage("Saved.");
      toast.success("SUCCESS", { description: "Join settings updated." });
      return result;
    } catch (error) {
      console.error(error);
      setStatusMessage("Please fix the highlighted fields.");

      if (error instanceof z.ZodError) {
        const fieldErrors = z.flattenError(error).fieldErrors as Record<
          string,
          string[]
        >;
        const formatted: JoinSettingsErrors = {};
        Object.keys(fieldErrors).forEach((k) => {
          formatted[k as keyof JoinSettingsErrors] = fieldErrors[k]?.[0] || "";
        });
        setErrors(formatted);

        toast.error("ERROR", {
          description: Object.values(formatted).filter(Boolean).join(", "),
        });

        return parseServerActionResponse({
          status: "ERROR",
          error: Object.values(formatted).filter(Boolean).join(", "),
          data: null,
        }) as ActionState;
      }

      toast.error("ERROR", {
        description: "An error occurred while saving. Please try again.",
      });

      return parseServerActionResponse({
        status: "ERROR",
        error: "An error occurred while saving",
        data: null,
      }) as ActionState;
    }
  };

  const [, formAction, isPending] = useActionState(submitForm, initialState);

  const selectedHint = useMemo(() => {
    const found = JOIN_MODE_OPTIONS.find((o) => o.value === formData.joinMode);
    return found?.hint ?? "";
  }, [formData.joinMode]);

  return (
    <div className="marketing-card w-full max-w-6xl rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
      <form
        id="edit-org-join-settings-form"
        action={formAction}
        className="flex flex-col gap-6 md:gap-8"
      >
        <div className="flex flex-col gap-2">
          <label
            ref={joinModeLabelRef}
            className="text-xs md:text-sm text-white/75"
          >
            Join mode
          </label>

          <select
            value={formData.joinMode}
            onChange={(e) => {
              const next = e.target.value as OrgJoinMode;
              setFormData((p) => ({
                ...p,
                joinMode: next,
                // enforce invariant locally
                allowJoinRequests:
                  next === OrgJoinMode.REQUEST ? p.allowJoinRequests : false,
              }));
            }}
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          >
            {JOIN_MODE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {selectedHint ? (
            <div className="text-xs text-white/60">{selectedHint}</div>
          ) : null}

          {errors.joinMode ? (
            <p className="text-red-500 text-xs md:text-sm">{errors.joinMode}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label
            ref={allowLabelRef}
            className="text-xs md:text-sm text-white/75"
          >
            Join requests
          </label>

          <button
            type="button"
            disabled={!allowToggleEnabled}
            onClick={() => {
              if (!allowToggleEnabled) return;
              setFormData((p) => ({
                ...p,
                allowJoinRequests: !p.allowJoinRequests,
              }));
            }}
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] text-left disabled:opacity-50 disabled:hover:bg-white/5"
          >
            {allowToggleEnabled
              ? formData.allowJoinRequests
                ? "Enabled — admins can approve/decline requests"
                : "Disabled — requests are not accepted"
              : "Unavailable — set Join mode to REQUEST to enable"}
          </button>

          {errors.allowJoinRequests ? (
            <p className="text-red-500 text-xs md:text-sm">
              {errors.allowJoinRequests}
            </p>
          ) : null}
        </div>

        <div className="flex w-full justify-center">
          <button
            type="submit"
            ref={saveButtonRef}
            disabled={isPending}
            className="w-full max-w-sm px-5 py-3 rounded-2xl cursor-pointer bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save join settings"}
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

export default EditOrgJoinSettingsForm;
