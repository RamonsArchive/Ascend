import React from "react";
import AddOrgSponsorForm from "./AddOrgSponsorForm";

const AddOrgSponsorSection = ({ orgId }: { orgId: string }) => {
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-6 md:gap-8">
        <AddOrgSponsorForm orgId={orgId} />
      </div>
    </section>
  );
};

export default AddOrgSponsorSection;
