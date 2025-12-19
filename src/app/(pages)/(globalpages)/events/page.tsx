import React from "react";
import EventsHero from "@/src/components/globalComponents/EventsHero";
import EventsExplore from "@/src/components/globalComponents/EventsExplore";
import EventsHowItWorks from "@/src/components/globalComponents/EventsHowItWorks";
import ExploreOrgs from "@/src/components/globalComponents/ExploreOrgs";
import { mockEvents } from "@/src/data/mock-events";
import { mockOrganizations } from "@/src/data/mock-organizations";

const EventsPage = () => {
  // fetch all events on the server here and pass them to the components
  // right now just use the mock events
  const events = mockEvents;
  const orgs = mockOrganizations; // mock orgs
  return (
    <div className="relative w-full">
      <div className="marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <EventsHero />
        <EventsHowItWorks />
        <ExploreOrgs orgs={orgs} />
        <EventsExplore events={events} orgs={orgs} />
      </div>
    </div>
  );
};

export default EventsPage;
