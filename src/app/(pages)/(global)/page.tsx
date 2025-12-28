import GlobalFeatures from "@/src/components/globalComponents/GlobalFeatures";
import HomeHero from "@/src/components/globalComponents/HomeHero";
import HowItWorks from "@/src/components/globalComponents/HowItWorks";
import QuickValue from "@/src/components/globalComponents/QuickValue";
import Sponsors from "@/src/components/globalComponents/Sponsors";
import FAQ from "@/src/components/globalComponents/FAQ";
import React from "react";

const GlobalHomePage = () => {
  return (
    <div className="relative w-full">
      {/* Full-page marketing background grid + radiation gradient */}
      <div className="marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <HomeHero />
        <QuickValue />
        <GlobalFeatures />
        <HowItWorks />
        <Sponsors />
        <FAQ />
      </div>
    </div>
  );
};

export default GlobalHomePage;
