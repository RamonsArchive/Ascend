import EventsHero from "@/src/components/globalComponents/EventsHero";
import EventsExplore from "@/src/components/globalComponents/EventsExplore";
import EventsHowItWorks from "@/src/components/globalComponents/EventsHowItWorks";
import React from "react";

const EventsPage = () => {
  return (
    <div className="relative w-full">
      <div className="marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <EventsHero />
        <EventsHowItWorks />
        <EventsExplore />
      </div>
    </div>
  );
};

export default EventsPage;
