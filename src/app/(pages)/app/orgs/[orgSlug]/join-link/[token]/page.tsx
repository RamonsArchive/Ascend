import React from "react";
import JoinOrgGate from "@/src/components/orgComponents/join/JoinOrgGate";
import { acceptOrgInviteLink } from "@/src/actions/org_invites_actions"; // <-- wherever you put it
import { fetchOrgJoinLinkPageData } from "@/src/actions/org_invites_actions";

const JoinOrgLinkPage = async ({
  params,
}: {
  params: Promise<{ orgSlug: string; token: string }>;
}) => {
  const { orgSlug, token } = await params;

  const pageData = await fetchOrgJoinLinkPageData(orgSlug, token);
  if (pageData.status === "ERROR") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-5">
        <div className="marketing-card w-full max-w-xl rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4 border border-white/10">
          <div className="text-white text-xl font-semibold">
            Invite link error
          </div>
          <div className="text-white/70 mt-2">{pageData.error}</div>
        </div>
      </div>
    );
  }

  const data = pageData.data as any;

  const disabledReason = !data.link
    ? "LINK_INVALID"
    : data.link.isExpired
      ? "LINK_EXPIRED"
      : !data.link.isPending
        ? "LINK_NOT_PENDING"
        : data.link.maxUsesReached
          ? "LINK_MAX_USES_REACHED"
          : null;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-5 py-10">
      <JoinOrgGate
        kind="INVITE_LINK"
        org={data.org}
        session={data.session}
        token={token}
        disabledReason={disabledReason}
        acceptAction={acceptOrgInviteLink}
      />
    </div>
  );
};

export default JoinOrgLinkPage;
