import React from "react";
import JoinGate from "@/src/components/JoinGate";
import {
  acceptEventEmailInvite,
  fetchEventJoinInvitePageData,
} from "@/src/actions/event_invites_actions";
import { baseUrl } from "@/src/lib/utils";

const EventJoinPage = async ({
  params,
}: {
  params: Promise<{ orgSlug: string; eventSlug: string; token: string }>;
}) => {
  const { orgSlug, eventSlug, token } = await params;

  const pageData = await fetchEventJoinInvitePageData(
    orgSlug,
    eventSlug,
    token,
  );
  if (pageData.status === "ERROR") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-5">
        <div className="marketing-card w-full max-w-xl rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4 border border-white/10">
          <div className="text-white text-xl font-semibold">Invite error</div>
          <div className="text-white/70 mt-2">{pageData.error}</div>
        </div>
      </div>
    );
  }

  const data = pageData.data as any;

  const disabledReason = !data.invite
    ? "INVITE_INVALID"
    : data.invite.isExpired
      ? "INVITE_EXPIRED"
      : !data.invite.isPending
        ? "INVITE_NOT_PENDING"
        : data.invite.emailMismatch
          ? "EMAIL_MISMATCH"
          : null;

  return (
    <div className="relative w-full min-h-[calc(100vh-48px)]">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />

      <div className="relative flex items-center justify-center px-5 py-10">
        <JoinGate
          baseUrl={baseUrl}
          kind="EMAIL_INVITE"
          entityType="EVENT"
          entity={data.event}
          inviteEmail={data.invite.email}
          session={data.session}
          isMember={data.isParticipant}
          token={token}
          disabledReason={disabledReason}
          acceptAction={acceptEventEmailInvite}
        />
      </div>
    </div>
  );
};

export default EventJoinPage;
