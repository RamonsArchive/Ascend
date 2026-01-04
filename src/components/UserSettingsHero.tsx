import React from "react";
import { formatShortDate } from "@/src/lib/utils";

const UserSettingsHero = ({
  createdAt,
  updatedAt,
}: {
  createdAt: Date;
  updatedAt: Date;
}) => {
  const created = formatShortDate(createdAt);
  const updated = formatShortDate(updatedAt);

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-6 md:gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            Your Account Settings
          </h1>

          <div className="text-xs md:text-sm text-white/55">
            {updated
              ? `Updated ${updated}`
              : created
                ? `Created ${created}`
                : null}
          </div>
        </div>

        <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
          Update your account settings, including your name, email, and profile
          picture.
        </div>
      </div>
    </section>
  );
};

export default UserSettingsHero;
