import React from "react";

const OrgSponsorsPage = () => {
  return (
    <div className="relative w-full">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <section className="flex flex-col items-center justify-center w-full">
          <div className="flex flex-col w-full max-w-5xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-4">
            <div className="text-white text-2xl font-semibold">Sponsors</div>
            <div className="text-white/70 text-sm leading-relaxed">
              Coming soon: sponsor directory and tier management.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default OrgSponsorsPage;
