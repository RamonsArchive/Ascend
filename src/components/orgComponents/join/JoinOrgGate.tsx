"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signInWithGoogle } from "@/src/lib/auth-client";
import { JoinOrgGateProps } from "@/src/lib/global_types";

const JoinOrgGate = (props: JoinOrgGateProps) => {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const isLoggedIn = !!props.session.userId;

  const callbackURL = useMemo(() => {
    const path =
      props.kind === "EMAIL_INVITE"
        ? `/app/orgs/${props.org.slug}/join/${props.token}`
        : `/app/orgs/${props.org.slug}/join-link/${props.token}`;

    return `${props.baseUrl}${path}`;
  }, [props.baseUrl, props.kind, props.org.slug, props.token]);

  const goToOrg = () => {
    router.push(`/app/orgs/${props.org.slug}`);
  };

  const onLogin = async () => {
    setStatusMessage("Redirecting to sign in…");
    try {
      await signInWithGoogle(callbackURL);
    } catch (e) {
      console.error(e);
      toast.error("ERROR", { description: "Failed to start sign-in." });
      setStatusMessage("");
    }
  };

  const onAccept = () => {
    startTransition(async () => {
      try {
        setStatusMessage("Joining organization…");
        const result = await props.acceptAction(props.token);

        if (result.status === "ERROR") {
          toast.error("ERROR", {
            description: result.error || "Failed to join.",
          });
          setStatusMessage(result.error || "Failed to join.");
          return;
        }

        toast.success("SUCCESS", {
          description: "You’ve joined the organization.",
        });
        setStatusMessage("Joined. Redirecting…");
        router.refresh();
        router.push(`/app/orgs/${props.org.slug}`);
      } catch (e) {
        console.error(e);
        toast.error("ERROR", { description: "Failed to join organization." });
        setStatusMessage("Failed to join organization.");
      }
    });
  };

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

  // ✅ already-member UX (button, no auto redirect)
  if (props.isMember && isLoggedIn) {
    return (
      <div className="marketing-card w-full max-w-xl rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4 border border-white/10">
        <div className="flex flex-col gap-4">
          <div className="text-white text-xl md:text-2xl font-semibold">
            You’re already a member
          </div>
          <div className="text-white/70 text-sm md:text-base leading-relaxed">
            You already have access to{" "}
            <span className="text-white font-semibold">{props.org.name}</span>.
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={goToOrg}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90"
            >
              Go to organization
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
    <div className="marketing-card w-full max-w-xl rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4 border border-white/10">
      <div className="flex flex-col gap-5">
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
              You’ve been invited to join this organization on Ascend.
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
              {isPending ? "Joining..." : "Join organization"}
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

export default JoinOrgGate;
