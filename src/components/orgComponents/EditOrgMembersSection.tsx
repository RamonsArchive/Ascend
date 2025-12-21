import { OrgMembership } from "@prisma/client";
import React from "react";
import EditOrgMemberCard from "./EditOrgMemberCard";

const EditOrgMembersSection = ({ members }: { members: OrgMembership[] }) => {
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-10 md:gap-12">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Members
          </h2>
        </div>
        <div className="flex flex-col gap-6 md:gap-8">
          {members.map((member) => (
            <EditOrgMemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default EditOrgMembersSection;
