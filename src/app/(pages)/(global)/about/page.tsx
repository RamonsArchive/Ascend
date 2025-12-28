import React from "react";
import AboutHero from "@/src/components/globalComponents/AboutHero";
import AboutMission from "@/src/components/globalComponents/AboutMission";
import AboutFounder from "@/src/components/globalComponents/AboutFounder";
import AboutImpact from "@/src/components/globalComponents/AboutImpact";
import AboutValuesStats from "@/src/components/globalComponents/AboutValuesStats";
import AboutInitiatives from "@/src/components/globalComponents/AboutInitiatives";

const AboutPage = () => {
  return (
    <div className="relative w-full">
      <div className="marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <AboutHero />
        <AboutMission />
        <AboutFounder />
        <AboutImpact />
        <AboutValuesStats />
        <AboutInitiatives />
      </div>
    </div>
  );
};

export default AboutPage;
