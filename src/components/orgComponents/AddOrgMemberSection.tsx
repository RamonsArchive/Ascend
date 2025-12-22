"use client";
import React, { useState } from "react";
import AddOrgMemberEmailForm from "./AddOrgMemberEmailForm";
import AddOrgMemberLinkForm from "./AddOrgMemberLinkForm";
import { OrgJoinRequest } from "@prisma/client";
import OrgJoinRequests from "./OrgJoinRequests";

const AddOrgMemberSection = ({
  orgId,
  currentUserId,
  joinRequests,
}: {
  orgId: string;
  currentUserId: string;
  joinRequests: OrgJoinRequest[];
}) => {
  const [showJoinRequests, setShowJoinRequests] = useState(false);

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-6 md:gap-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-white">
          Add Member
        </h2>
        <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
          Add a new member to the organization.
        </div>
      </div>
      {showJoinRequests ? (
        <OrgJoinRequests
          orgId={orgId}
          currentUserId={currentUserId}
          joinRequests={joinRequests}
        />
      ) : (
        <>
          <AddOrgMemberEmailForm />
          <AddOrgMemberLinkForm />{" "}
        </>
      )}
    </section>
  );
};

export default AddOrgMemberSection;
