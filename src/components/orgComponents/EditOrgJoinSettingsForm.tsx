"use client";

import React, { useEffect, useMemo, useState, useActionState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useRouter } from "next/navigation";

import type { ActionState } from "@/src/lib/global_types";
import { parseServerActionResponse } from "@/src/lib/utils";
import { updateOrgJoinSettings } from "@/src/actions/org_actions";
import { OrgJoinMode } from "@prisma/client";
import { editOrgJoinSettingsClientSchema } from "@/src/lib/validation";
import type { JoinSettingsErrors } from "@/src/lib/global_types";
import { JOIN_MODE_OPTIONS } from "@/src/constants/orgConstants/org_index";

const initialState: ActionState = {
  status: "INITIAL",
  error: "",
  data: null,
};

const normalizeAllow = (mode: OrgJoinMode, allow: boolean) =>
  mode === OrgJoinMode.REQUEST ? !!allow : false;

const EditOrgJoinSettingsForm = ({
  orgId,
  allowJoinRequests,
  joinMode,
  currentUserId,
}: {
  orgId: string;
  allowJoinRequests: boolean;
  joinMode: OrgJoinMode | null;
  currentUserId: string;
}) => {
  const [statusMessage, setStatusMessage] = useState("");
  const [errors, setErrors] = useState<JoinSettingsErrors>({});

  const [formData, setFormData] = useState(() => {
    const mode = joinMode ?? OrgJoinMode.INVITE_ONLY;
    return {
      joinMode: mode,
      allowJoinRequests: normalizeAllow(mode, allowJoinRequests),
    };
  });

  // ✅ CRITICAL: keep local state synced with server props after router.refresh()
  useEffect(() => {
    const mode = joinMode ?? OrgJoinMode.INVITE_ONLY;
    setFormData({
      joinMode: mode,
      allowJoinRequests: normalizeAllow(mode, allowJoinRequests),
    });
  }, [joinMode, allowJoinRequests]);

  const allowToggleEnabled = formData.joinMode === OrgJoinMode.REQUEST;

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

      // ✅ Optimistic UI: update local state immediately from returned data
      const updated = result.data as {
        joinMode: OrgJoinMode;
        allowJoinRequests: boolean;
      };

      setFormData({
        joinMode: updated.joinMode,
        allowJoinRequests: normalizeAllow(
          updated.joinMode,
          updated.allowJoinRequests
        ),
      });

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
    <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
      <div className="flex flex-col gap-6 md:gap-8">
        <form action={formAction} className="flex flex-col gap-6 md:gap-8">
          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-white/75">
              Join mode
            </label>

            <select
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              value={formData.joinMode}
              onChange={(e) => {
                const next = e.target.value as OrgJoinMode;
                setFormData((p) => ({
                  ...p,
                  joinMode: next,
                  allowJoinRequests: normalizeAllow(next, p.allowJoinRequests),
                }));
              }}
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
              <p className="text-red-500 text-xs md:text-sm">
                {errors.joinMode}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-white/75">
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
    </div>
  );
};

export default EditOrgJoinSettingsForm;
