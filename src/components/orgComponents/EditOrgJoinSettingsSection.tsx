import React from "react";
import EditOrgJoinSettingsForm from "./EditOrgJoinSettingsForm";
import { OrgJoinMode } from "@prisma/client";

const EditOrgJoinSettingsSection = ({
  orgId,
  allowJoinRequests,
  joinMode,
}: {
  orgId: string;
  allowJoinRequests: boolean;
  joinMode: OrgJoinMode;
}) => {
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-10 md:gap-12">
        <h2 className="text-2xl md:text-3xl font-semibold text-white">
          Join settings
        </h2>
        <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
          Manage the join settings for the organization.
        </div>
      </div>
      <EditOrgJoinSettingsForm
        orgId={orgId}
        allowJoinRequests={allowJoinRequests}
        joinMode={joinMode}
      />
    </section>
  );
};

export default EditOrgJoinSettingsSection;
