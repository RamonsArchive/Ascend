import React from "react";
import JoinOrgGate from "@/src/components/orgComponents/join/JoinOrgGate";
import { acceptOrgInvite } from "@/src/actions/org_invites_actions"; // <-- wherever you put it
import { fetchOrgJoinInvitePageData } from "@/src/actions/org_invites_actions";
import { baseUrl } from "@/src/lib/utils";
const JoinOrgPage = async ({
  params,
}: {
  params: Promise<{ orgSlug: string; token: string }>;
}) => {
  const { orgSlug, token } = await params;

  const pageData = await fetchOrgJoinInvitePageData(orgSlug, token);
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
        : null;

  return (
    <div className="relative w-full min-h-[calc(100vh-48px)]">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />

      <div className="relative flex items-center justify-center px-5 py-10">
        <JoinOrgGate
          baseUrl={baseUrl}
          kind="EMAIL_INVITE"
          org={data.org}
          inviteEmail={data.invite.email}
          session={data.session}
          isMember={data.isMember}
          token={token}
          disabledReason={disabledReason}
          acceptAction={acceptOrgInvite}
        />
      </div>
    </div>
  );
};

export default JoinOrgPage;
