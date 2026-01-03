"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { signInWithGoogle } from "@/src/lib/auth-client";
import type { JoinGateProps } from "@/src/lib/global_types";

const JoinGate = (props: JoinGateProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [statusMessage, setStatusMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const isLoggedIn = !!props.session.userId;

  const getJoinPath = () => {
    if (props.entityType === "ORG") {
      const orgSlug = props.entity.slug;
      return props.kind === "EMAIL_INVITE"
        ? `/app/orgs/${orgSlug}/join/${props.token}`
        : `/app/orgs/${orgSlug}/join-link/${props.token}`;
    }

    if (props.entityType === "EVENT") {
      const orgSlug = (props.entity as any).orgSlug as string;
      const eventSlug = props.entity.slug;
      return props.kind === "EMAIL_INVITE"
        ? `/app/orgs/${orgSlug}/events/${eventSlug}/join/${props.token}`
        : `/app/orgs/${orgSlug}/events/${eventSlug}/join-link/${props.token}`;
    }

    if (props.entityType === "STAFF") {
      const orgSlug = (props.entity as any).orgSlug as string;
      const eventSlug = props.entity.slug;
      return props.kind === "EMAIL_INVITE"
        ? `/app/orgs/${orgSlug}/events/${eventSlug}/eventstaff/join/${props.token}`
        : `/app/orgs/${orgSlug}/events/${eventSlug}/eventstaff/join-link/${props.token}`;
    }

    // TEAM scaffold (future) — adjust routes when you finalize
    if (props.entityType === "TEAM") {
      const orgSlug = (props.entity as any).orgSlug as string;
      const eventSlug = (props.entity as any).eventSlug as string;
      const teamSlug = props.entity.slug;

      return props.kind === "EMAIL_INVITE"
        ? `/app/orgs/${orgSlug}/events/${eventSlug}/teams/${teamSlug}/join/${props.token}`
        : `/app/orgs/${orgSlug}/events/${eventSlug}/teams/${teamSlug}/join-link/${props.token}`;
    }

    return "/";
  };

  const joinPath = getJoinPath();
  const callbackURL = `${props.baseUrl}${joinPath}?autojoin=1`;

  const getStaffRoleLabel = () => {
    if (props.entityType !== "STAFF") return null;

    const role = (props.entity as any).role as string | null | undefined;
    if (!role) return null;

    const pretty = role
      .toString()
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return pretty;
  };

  const staffRoleLabel = getStaffRoleLabel();

  const goToEntity = () => {
    if (props.entityType === "ORG") {
      router.push(`/app/orgs/${props.entity.slug}`);
      return;
    }

    if (props.entityType === "EVENT" || props.entityType === "STAFF") {
      const orgSlug = (props.entity as any).orgSlug as string;
      const eventSlug = props.entity.slug;
      router.push(`/app/orgs/${orgSlug}/events/${eventSlug}`);
      return;
    }

    if (props.entityType === "TEAM") {
      const orgSlug = (props.entity as any).orgSlug as string;
      const eventSlug = (props.entity as any).eventSlug as string;
      const teamSlug = props.entity.slug;
      router.push(`/app/orgs/${orgSlug}/events/${eventSlug}/teams/${teamSlug}`);
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
          props.entityType === "STAFF"
            ? "Joining staff…"
            : props.entityType === "TEAM"
              ? "Joining team…"
              : props.entityType === "EVENT"
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, props.disabledReason, props.isMember]);

  const getErrorCopy = () => {
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
  };

  const headline =
    props.entityType === "STAFF"
      ? `Join staff for ${props.entity.name}`
      : props.entityType === "TEAM"
        ? `Join team: ${props.entity.name}`
        : `Join ${props.entity.name}`;

  const joinButtonLabel =
    props.entityType === "STAFF"
      ? "Join staff"
      : props.entityType === "TEAM"
        ? "Join team"
        : props.entityType === "EVENT"
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

          {props.entityType === "STAFF" && staffRoleLabel ? (
            <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white/80 text-sm">
              Role:{" "}
              <span className="text-white font-semibold">{staffRoleLabel}</span>
            </div>
          ) : null}

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

  const errorCopy = getErrorCopy();

  return (
    <div className="marketing-card relative w-full max-w-xl rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4 border border-white/10 z-10">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="text-white text-xl md:text-2xl font-semibold">
            {headline}
          </div>

          {"description" in props.entity && props.entity.description ? (
            <div className="text-white/70 text-sm md:text-base leading-relaxed">
              {props.entity.description}
            </div>
          ) : (
            <div className="text-white/60 text-sm md:text-base leading-relaxed">
              You’ve been invited to join on Ascend.
            </div>
          )}
        </div>

        {props.entityType === "STAFF" && staffRoleLabel ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white/80 text-sm">
            You’re being invited as{" "}
            <span className="text-white font-semibold">{staffRoleLabel}</span>.
          </div>
        ) : null}

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
