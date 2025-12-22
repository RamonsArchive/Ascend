import React from "react";
import OrgJoinRequestCard from "./OrgJoinRequestCard";
import { OrgJoinRequest } from "@prisma/client";
import { updateOrgJoinSettings } from "@/actions/org_actions";

const OrgJoinRequests = ({
  orgId,
  currentUserId,
  joinRequests,
}: {
  orgId: string;
  currentUserId: string;
  joinRequests: OrgJoinRequest[];
}) => {
  return (
    <div>
      {joinRequests.map((joinRequest) => (
        <OrgJoinRequestCard key={joinRequest.id} joinRequest={joinRequest} />
      ))}
    </div>
  );
};

export default OrgJoinRequests;
