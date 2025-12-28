import React from "react";
import PrivateEventHero from "@/src/components/eventComponents/PrivateEventHero";
import EventRules from "@/src/components/eventComponents/EventRules";
import EventTracks from "@/src/components/eventComponents/EventTracks";
import EventRubric from "@/src/components/eventComponents/EventRubric";
import EventAwards from "@/src/components/eventComponents/EventAwards";
import { getCachedSession } from "@/src/lib/cached-auth";

const PrivateEventPage = async ({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) => {
  const session = await getCachedSession();
  return (
    <div className="relative w-full">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <PrivateEventHero />
        <EventRules />
        <EventRubric />
        <EventTracks />
        <EventAwards />
      </div>
    </div>
  );
};

export default PrivateEventPage;
