"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { signInWithGoogle } from "@/src/lib/auth-client";
import type { ActionState } from "@/src/lib/global_types";

type DisabledReason =
  | "INVITE_INVALID"
  | "INVITE_EXPIRED"
  | "INVITE_NOT_PENDING"
  | "LINK_INVALID"
  | "LINK_EXPIRED"
  | "LINK_NOT_PENDING"
  | "LINK_MAX_USES_REACHED"
  | "EMAIL_MISMATCH"
  | null;

type SessionShape = {
  userId: string | null;
  email: string | null;
  name: string | null;
};

type JoinGateProps = {
  baseUrl: string;
  kind: "EMAIL_INVITE" | "INVITE_LINK";
  entityType: "ORG" | "EVENT" | "TEAM";
  entity: {
    name: string;
    slug: string;
    description?: string | null;
    orgSlug?: string;
  }; // minimal
  inviteEmail?: string | null;
  session: SessionShape;
  isMember: boolean;
  token: string;
  disabledReason: DisabledReason;
  acceptAction: (token: string) => Promise<ActionState>;
};

const JoinGate = (props: JoinGateProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [statusMessage, setStatusMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const isLoggedIn = !!props.session.userId;

  const joinPath = useMemo(() => {
    if (props.entityType === "EVENT") {
      // entity.slug is eventSlug, entity.orgSlug must be provided
      const orgSlug = props.entity.orgSlug!;
      const eventSlug = props.entity.slug;
      return props.kind === "EMAIL_INVITE"
        ? `/app/orgs/${orgSlug}/events/${eventSlug}/join/${props.token}`
        : `/app/orgs/${orgSlug}/events/${eventSlug}/join-link/${props.token}`;
    }

    if (props.entityType === "ORG") {
      const orgSlug = props.entity.slug;
      return props.kind === "EMAIL_INVITE"
        ? `/app/orgs/${orgSlug}/join/${props.token}`
        : `/app/orgs/${orgSlug}/join-link/${props.token}`;
    }

    // TEAM: later
    return "/";
  }, [props.entityType, props.kind, props.entity, props.token]);

  const callbackURL = useMemo(() => {
    return `${props.baseUrl}${joinPath}?autojoin=1`;
  }, [props.baseUrl, joinPath]);

  const goToEntity = () => {
    if (props.entityType === "EVENT") {
      const orgSlug = props.entity.orgSlug!;
      router.push(`/app/orgs/${orgSlug}/events/${props.entity.slug}`);
      return;
    }
    if (props.entityType === "ORG") {
      router.push(`/app/orgs/${props.entity.slug}`);
      return;
    }
    router.push("/app");
  };

  const onLogin = async () => {
    setStatusMessage("Redirecting to sign in…");
    try {
      await signInWithGoogle(callbackURL);
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("ERROR", { description: "Failed to start sign-in." });
      setStatusMessage("");
    }
  };

  const onAccept = () => {
    startTransition(async () => {
      try {
        setStatusMessage(
          props.entityType === "EVENT"
            ? "Joining event…"
            : props.entityType === "ORG"
              ? "Joining organization…"
              : "Joining…"
        );

        const result = await props.acceptAction(props.token);

        if (result.status === "ERROR") {
          toast.error("ERROR", {
            description: result.error || "Failed to join.",
          });
          setStatusMessage(result.error || "Failed to join.");
          return;
        }

        toast.success("SUCCESS", { description: "You’ve joined." });
        setStatusMessage("Joined. Redirecting…");
        router.refresh();
        goToEntity();
      } catch (e) {
        console.error(e);
        toast.error("ERROR", { description: "Failed to join." });
        setStatusMessage("Failed to join.");
      }
    });
  };

  useEffect(() => {
    const autojoin = searchParams.get("autojoin") === "1";
    if (autojoin && isLoggedIn && !props.disabledReason && !props.isMember) {
      onAccept();
    }
  }, [isLoggedIn, searchParams, props.disabledReason, props.isMember]);

  const errorCopy = useMemo(() => {
    switch (props.disabledReason) {
      case "INVITE_INVALID":
      case "LINK_INVALID":
        return "This invite link is invalid or no longer exists.";
      case "INVITE_EXPIRED":
      case "LINK_EXPIRED":
        return "This invite has expired.";
      case "INVITE_NOT_PENDING":
      case "LINK_NOT_PENDING":
        return "This invite is no longer pending.";
      case "LINK_MAX_USES_REACHED":
        return "This invite link has reached its maximum number of uses.";
      case "EMAIL_MISMATCH":
        return `You’re signed in as ${props.session.email ?? "a different account"}, but this invite was sent to ${props.inviteEmail ?? "a different email"}.`;
      default:
        return "";
    }
  }, [props.disabledReason, props.inviteEmail, props.session.email]);

  const headline =
    props.entityType === "EVENT"
      ? `Join ${props.entity.name}`
      : props.entityType === "ORG"
        ? `Join ${props.entity.name}`
        : `Join`;

  const joinButtonLabel =
    props.entityType === "EVENT"
      ? "Join event"
      : props.entityType === "ORG"
        ? "Join organization"
        : "Join";

  if (props.isMember && isLoggedIn) {
    return (
      <div className="marketing-card w-full max-w-xl rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4 border border-white/10 z-10">
        <div className="flex flex-col gap-4">
          <div className="text-white text-xl md:text-2xl font-semibold">
            You’re already in
          </div>
          <div className="text-white/70 text-sm md:text-base leading-relaxed">
            You already have access to{" "}
            <span className="text-white font-semibold">
              {props.entity.name}
            </span>
            .
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={goToEntity}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90"
            >
              Continue
            </button>

            <button
              type="button"
              onClick={() => router.push("/app")}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="marketing-card relative w-full max-w-xl rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4 border border-white/10 z-10">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="text-white text-xl md:text-2xl font-semibold">
            {headline}
          </div>

          {props.entity.description ? (
            <div className="text-white/70 text-sm md:text-base leading-relaxed">
              {props.entity.description}
            </div>
          ) : (
            <div className="text-white/60 text-sm md:text-base leading-relaxed">
              You’ve been invited to join on Ascend.
            </div>
          )}
        </div>

        {props.disabledReason ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white/80 text-sm">
            {errorCopy}
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3">
          {!isLoggedIn ? (
            <button
              type="button"
              onClick={onLogin}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90"
            >
              Continue with Google
            </button>
          ) : (
            <button
              type="button"
              disabled={isPending || !!props.disabledReason}
              onClick={onAccept}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "Joining..." : joinButtonLabel}
            </button>
          )}

          <button
            type="button"
            onClick={() => router.push("/app")}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          >
            Cancel
          </button>
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

export default JoinGate;
