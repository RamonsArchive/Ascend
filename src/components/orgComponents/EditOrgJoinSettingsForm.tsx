import React from "react";
import { OrgJoinMode } from "@prisma/client";

const EditOrgJoinSettingsForm = ({
  orgId,
  allowJoinRequests,
  joinMode,
}: {
  orgId: string;
  allowJoinRequests: boolean;
  joinMode: OrgJoinMode | null;
}) => {
  return (
    <div>
      <div>
        <label htmlFor="allowJoinRequests">Allow join requests</label>
        <input
          type="checkbox"
          id="allowJoinRequests"
          name="allowJoinRequests"
          checked={allowJoinRequests}
        />
      </div>
      <div>
        <label htmlFor="joinMode">Join mode</label>
        <select id="joinMode" name="joinMode">
          <option value="INVITE_ONLY">Invite only</option>
          <option value="REQUEST_TO_JOIN">Request to join</option>
        </select>
      </div>
    </div>
  );
};

export default EditOrgJoinSettingsForm;
