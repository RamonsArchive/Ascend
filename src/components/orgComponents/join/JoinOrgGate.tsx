"use client";

import React, { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { signInWithGoogle } from "@/src/lib/auth-client";
import type { ActionState, JoinOrgGateProps } from "@/src/lib/global_types";
import { humanizeJoinError } from "@/src/lib/utils";

export default function JoinOrgGate(props: JoinOrgGateProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const isLoggedIn = !!props.session.userId;

  const canAttemptJoin = useMemo(() => {
    return !props.disabledReason;
  }, [props.disabledReason]);

  const callbackURL = useMemo(() => {
    // return to the join page after OAuth
    // assumes these pages are under /app/orgs/... like your routes
    const base = typeof window === "undefined" ? "" : window.location.origin;
    const path =
      props.kind === "EMAIL_INVITE"
        ? `/app/orgs/${props.org.slug}/join/${props.token}`
        : `/app/orgs/${props.org.slug}/join-link/${props.token}`;
    return `${base}${path}`;
  }, [props.kind, props.org.slug, props.token]);

  const onLogin = async () => {
    try {
      setStatus("Redirecting to sign in…");
      await signInWithGoogle(callbackURL);
    } catch (e) {
      console.error(e);
      setStatus("");
      toast.error("ERROR", { description: "Failed to start sign in." });
    }
  };

  const onJoin = () => {
    if (!isLoggedIn) return onLogin();
    if (!canAttemptJoin) {
      toast.error("ERROR", {
        description: humanizeJoinError(props.disabledReason!),
      });
      return;
    }

    setStatus("Joining organization…");

    startTransition(async () => {
      const res = await props.acceptAction(props.token);

      if (res.status === "ERROR") {
        setStatus("");
        toast.error("ERROR", {
          description: humanizeJoinError(res.error || ""),
        });
        return;
      }

      toast.success("SUCCESS", {
        description: "You’ve joined the organization.",
      });
      setStatus("Redirecting…");
      router.replace(`/app/orgs/${props.org.slug}`);
      router.refresh();
    });
  };

  return (
    <div className="w-full max-w-xl">
      <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4 border border-white/10">
        <div className="flex flex-col gap-5 md:gap-6">
          <div className="flex flex-col gap-2">
            <div className="text-white text-xl md:text-2xl font-semibold">
              Join {props.org.name}
            </div>
            {props.org.description ? (
              <div className="text-white/70 text-sm md:text-base leading-relaxed">
                {props.org.description}
              </div>
            ) : (
              <div className="text-white/60 text-sm md:text-base leading-relaxed">
                You’ve been invited to join this organization.
              </div>
            )}
          </div>

          {props.kind === "EMAIL_INVITE" && props.inviteEmail ? (
            <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white/75 text-sm">
              This invite was sent to:{" "}
              <span className="text-white">{props.inviteEmail}</span>
            </div>
          ) : null}

          {!isLoggedIn ? (
            <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white/75 text-sm">
              You’ll need to sign in to join.
            </div>
          ) : (
            <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white/75 text-sm">
              Signed in as:{" "}
              <span className="text-white">
                {props.session.email ?? "Unknown"}
              </span>
            </div>
          )}

          {props.disabledReason ? (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-200 text-sm">
              {humanizeJoinError(props.disabledReason)}
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onJoin}
              disabled={isPending}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {!isLoggedIn
                ? "Sign in to join"
                : isPending
                  ? "Joining..."
                  : "Join organization"}
            </button>

            <button
              type="button"
              onClick={() => router.replace(`/app/orgs/${props.org.slug}`)}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-sm md:text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            >
              View org
            </button>
          </div>

          {status ? (
            <div className="flex items-center justify-center w-full">
              <p className="text-white/90 text-xs md:text-sm text-center px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                {status}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
