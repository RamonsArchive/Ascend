"use client";

import React, { useState } from "react";

import AddOrgMemberEmailForm from "./AddOrgMemberEmailForm";
import AddOrgMemberLinkForm from "./AddOrgMemberLinkForm";
import OrgJoinRequests from "./OrgJoinRequests";
import type { OrgJoinRequestWithUser } from "@/src/lib/global_types";

const AddOrgMemberSection = ({
  orgId,
  joinRequests,
}: {
  orgId: string;
  joinRequests: OrgJoinRequestWithUser[];
}) => {
  const [showJoinRequests, setShowJoinRequests] = useState(false);

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-10 md:gap-12">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Add member
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            Invite by email, create a shareable invite link, or review
            membership requests.
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowJoinRequests(false)}
              className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-semibold text-sm md:text-base transition-colors text-center ${
                !showJoinRequests
                  ? "bg-white text-primary-950 hover:opacity-90"
                  : "bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
              }`}
            >
              Invite & link
            </button>

            <button
              type="button"
              onClick={() => setShowJoinRequests(true)}
              className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-semibold text-sm md:text-base transition-colors text-center ${
                showJoinRequests
                  ? "bg-white text-primary-950 hover:opacity-90"
                  : "bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
              }`}
            >
              Membership requests ({joinRequests.length})
            </button>
          </div>
        </div>

        {showJoinRequests ? (
          <OrgJoinRequests orgId={orgId} joinRequests={joinRequests} />
        ) : (
          <div className="flex flex-col gap-6 md:gap-8">
            <AddOrgMemberEmailForm orgId={orgId} />
            <AddOrgMemberLinkForm orgId={orgId} />
          </div>
        )}
      </div>
    </section>
  );
};

export default AddOrgMemberSection;
