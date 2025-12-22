"use client";

import React, { useMemo, useRef, useState, useActionState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { z } from "zod";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import SplitText from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import type { ActionState } from "@/src/lib/global_types";
import {
  parseServerActionResponse,
  statusPill,
  statusLabel,
} from "@/src/lib/utils";
import { orgJoinRequestDecisionClientSchema } from "@/src/lib/validation";
import type { OrgJoinRequestWithUser } from "@/src/lib/global_types";

// TODO: replace these with your real actions
import { reviewOrgJoinRequest } from "@/src/actions/org_invites_actions";

gsap.registerPlugin(ScrollTrigger, SplitText);

const initialState: ActionState = { status: "INITIAL", error: "", data: null };

const OrgJoinRequestCard = ({
  orgId,
  joinRequest,
}: {
  orgId: string;
  joinRequest: OrgJoinRequestWithUser;
}) => {
  void orgId;
  const titleRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [statusMessage, setStatusMessage] = useState("");
  const [errors, setErrors] = useState<{ decision?: string }>({});

  const displayName = joinRequest.user?.name?.trim() || "Unknown user";
  const displayEmail = joinRequest.user?.email || "";
  const avatarSrc = joinRequest.user?.image || null;

  const canAct = joinRequest.status === "PENDING";

  const initials = useMemo(() => {
    const parts = displayName.split(" ").filter(Boolean);
    const a = parts[0]?.[0] ?? "U";
    const b = parts[1]?.[0] ?? "";
    return (a + b).toUpperCase();
  }, [displayName]);

  useGSAP(() => {
    let cleanup: undefined | (() => void);

    const init = () => {
      if (!titleRef.current || !cardRef.current) {
        requestAnimationFrame(init);
        return;
      }

      const split = new SplitText(titleRef.current, { type: "words" });
      gsap.set(split.words, { opacity: 0, y: 26 });
      gsap.set(cardRef.current, { opacity: 0, y: 18 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 88%",
          end: "top 55%",
          scrub: 1,
        },
        defaults: { ease: "power3.out", duration: 0.6 },
      });

      tl.to(cardRef.current, { opacity: 1, y: 0 }, 0).to(
        split.words,
        { opacity: 1, y: 0, stagger: 0.02 },
        0.05,
      );

      requestAnimationFrame(() => ScrollTrigger.refresh());

      cleanup = () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        split.revert();
      };
    };

    init();
    return () => cleanup?.();
  }, [joinRequest.id]);

  const decide = async (
    decision: "APPROVE" | "REJECT",
    _state: ActionState,
    _fd: FormData,
  ): Promise<ActionState> => {
    try {
      void _state;
      void _fd;

      setErrors({});
      setStatusMessage("");

      if (!canAct) {
        toast.error("ERROR", {
          description: "This request is no longer pending.",
        });
        return parseServerActionResponse({
          status: "ERROR",
          error: "Request is not pending",
          data: null,
        }) as ActionState;
      }

      const parsed = await orgJoinRequestDecisionClientSchema.parseAsync({
        joinRequestId: joinRequest.id,
        decision,
      });

      setStatusMessage(
        decision === "APPROVE" ? "Approving request…" : "Declining request…",
      );

      const fd = new FormData();
      fd.set("orgId", orgId);
      fd.set("joinRequestId", parsed.joinRequestId);
      fd.set("decision", parsed.decision);

      const result = await reviewOrgJoinRequest(initialState, fd);

      if (result.status === "ERROR") {
        setStatusMessage(result.error || "Failed to update request.");
        toast.error("ERROR", {
          description: result.error || "Failed to update request.",
        });
        return result;
      }

      toast.success("SUCCESS", {
        description:
          decision === "APPROVE" ? "Member approved." : "Request declined.",
      });

      setStatusMessage("");
      return result;
    } catch (error) {
      console.error(error);
      setStatusMessage("Please try again.");

      if (error instanceof z.ZodError) {
        const fieldErrors = z.flattenError(error).fieldErrors as Record<
          string,
          string[]
        >;
        setErrors({
          decision: fieldErrors.decision?.[0] || "Invalid decision",
        });
        toast.error("ERROR", { description: "Invalid request." });

        return parseServerActionResponse({
          status: "ERROR",
          error: "Invalid request",
          data: null,
        }) as ActionState;
      }

      toast.error("ERROR", {
        description: "An error occurred. Please try again.",
      });
      return parseServerActionResponse({
        status: "ERROR",
        error: "An error occurred",
        data: null,
      }) as ActionState;
    }
  };

  const approveAction = async (s: ActionState, fd: FormData) =>
    decide("APPROVE", s, fd);
  const declineAction = async (s: ActionState, fd: FormData) =>
    decide("REJECT", s, fd);

  const [, approveFormAction, approvePending] = useActionState(
    approveAction,
    initialState,
  );
  const [, declineFormAction, declinePending] = useActionState(
    declineAction,
    initialState,
  );

  const isPending = approvePending || declinePending;

  return (
    <div
      ref={cardRef}
      className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4"
    >
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={`${displayName} avatar`}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/80 font-semibold text-sm">
                  {initials}
                </div>
              )}
            </div>

            {/* Identity */}
            <div className="flex flex-col gap-1">
              <div ref={titleRef} className="text-white font-semibold">
                {displayName}
              </div>
              <div className="text-white/70 text-sm break-all">
                {displayEmail}
              </div>
              <div className="text-white/50 text-xs break-all">
                User ID: {joinRequest.userId}
              </div>
            </div>
          </div>

          {/* Status pill */}
          <div
            className={`inline-flex items-center justify-center px-3 py-2 rounded-2xl text-xs font-semibold ${statusPill(
              joinRequest.status,
            )}`}
          >
            {statusLabel(joinRequest.status)}
          </div>
        </div>

        {/* Message */}
        <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="text-white/80 text-xs font-semibold">Message</div>
          <div className="text-white/70 text-sm leading-relaxed pt-2">
            {joinRequest.message?.trim()
              ? joinRequest.message
              : "No message provided."}
          </div>
        </div>

        {/* Actions */}
        {errors.decision ? (
          <p className="text-red-500 text-xs md:text-sm">{errors.decision}</p>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3">
          <form action={approveFormAction} className="w-full sm:w-auto">
            <button
              type="submit"
              disabled={!canAct || isPending}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl cursor-pointer bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {approvePending ? "Approving..." : "Approve"}
            </button>
          </form>

          <form action={declineFormAction} className="w-full sm:w-auto">
            <button
              type="submit"
              disabled={!canAct || isPending}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 font-semibold text-sm md:text-base hover:bg-white/10 transition-colors disabled:opacity-60"
            >
              {declinePending ? "Declining..." : "Decline"}
            </button>
          </form>

          {!canAct ? (
            <div className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 text-sm md:text-base flex items-center justify-center">
              This request is finalized
            </div>
          ) : null}
        </div>

        {/* Status message */}
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

export default OrgJoinRequestCard;
