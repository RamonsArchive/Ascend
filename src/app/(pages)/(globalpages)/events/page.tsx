import React from "react";
import EventsHero from "@/src/components/globalComponents/EventsHero";
import EventsExplore from "@/src/components/globalComponents/EventsExplore";
import EventsHowItWorks from "@/src/components/globalComponents/EventsHowItWorks";
import ExploreOrgs from "@/src/components/globalComponents/ExploreOrgs";
import { fetchAllEvents } from "@/src/actions/event_actions";
import { fetchAllOrganizations } from "@/src/actions/org_actions";
import { OrgListItem, PublicEventListItem } from "@/src/lib/global_types";

const EventsPage = async () => {
  // fetch all events on the server here and pass them to the components
  // right now just use the mock events
  const eventsRes = await fetchAllEvents(12);
  const orgsRes = await fetchAllOrganizations();

  const events =
    eventsRes.status === "SUCCESS"
      ? (eventsRes.data as PublicEventListItem[])
      : [];

  const orgs =
    orgsRes.status === "SUCCESS" ? (orgsRes.data as OrgListItem[]) : [];
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
