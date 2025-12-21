import React from "react";
import EditOrgForm from "./EditOrgForm";
import { edit_org_data } from "@/src/constants/orgConstants/org_index";
import { Organization } from "@prisma/client";

const EditOrgFormSection = ({
  isLoggedIn,
  path,
  orgId,
  initialOrg,
}: {
  isLoggedIn: boolean;
  path: string;
  orgId: string;
  initialOrg: Organization;
}) => {
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-8 md:gap-10">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            {edit_org_data.formSection.title}
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            {edit_org_data.formSection.description}
          </div>
        </div>

        <EditOrgForm
          submitLabel={edit_org_data.cta.label}
          isLoggedIn={isLoggedIn}
          path={path}
          orgId={orgId}
          initialOrg={initialOrg}
        />
      </div>
    </section>
  );
};

export default EditOrgFormSection;
