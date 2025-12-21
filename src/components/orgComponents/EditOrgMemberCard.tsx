import { OrgMembership } from "@prisma/client";
import React from "react";

// should be able to edit members role, if I'm admin or owner kick them out,
const EditOrgMemberCard = ({ member }: { member: OrgMembership }) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-white font-semibold leading-tight">
        {member.user.name}
      </div>
    </div>
  );
};

export default EditOrgMemberCard;
