import React from "react";
import type { UserDataSettings } from "@/src/lib/global_types";
import EditUserProfileForm from "./EditUserProfileForm";

const EditUserProfileSection = ({
  userData,
}: {
  userData: UserDataSettings;
}) => {
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-6 md:gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Edit profile
          </h2>
          <div className="text-sm text-white/65">
            Keep your public profile up to date.
          </div>
        </div>

        <EditUserProfileForm userData={userData} />
      </div>
    </section>
  );
};

export default EditUserProfileSection;
