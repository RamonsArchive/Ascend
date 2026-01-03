import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCachedSession } from "@/src/lib/cached-auth";
import { fetchOrgId } from "@/src/actions/org_actions";
import {
  fetchEventInfoData,
  fetchEventRubricCategoriesData,
} from "@/src/actions/event_actions";

import type {
  EventInfoPageData,
  RubricCategoryDraft,
} from "@/src/lib/global_types";

import EventHeroInfoSection from "@/src/components/eventComponents/EventHeroInfoSection";
import PrivateEventInfo from "@/src/components/eventComponents/PrivateEventInfo";
import PrivateEventTracks from "@/src/components/eventComponents/PrivateEventTracks";
import PrivateEventAwards from "@/src/components/eventComponents/PrivateEventAwards";
import PublicEventRubricCategoriesSection from "@/src/components/eventComponents/PublicEventRubricCategoriesSection";

const PrivateEventInfoPage = async ({
  params,
}: {
  params: Promise<{ orgSlug: string; eventSlug: string }>;
}) => {
  const { orgSlug, eventSlug } = await params;

  const session = await getCachedSession();
  const userId = session?.user?.id ?? "";
  if (!userId) {
    redirect(`/login?next=/app/orgs/${orgSlug}/events/${eventSlug}/info`);
  }

  const orgIdRes = await fetchOrgId(orgSlug);
  if (orgIdRes.status === "ERROR" || !orgIdRes.data) {
    return (
      <div className="relative w-full">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
          <div className="text-white text-xl font-semibold">Error</div>
          <div className="text-white/70 text-sm leading-relaxed">
            Failed to fetch organization id.
          </div>
          <Link
            href={`/orgs/${orgSlug}`}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 text-center"
          >
            Back to org dashboard
          </Link>
        </div>
      </div>
    );
  }

  const orgId = orgIdRes.data as string;

  let infoRes = null;
  let rubricCategoriesRes = null;
  [infoRes, rubricCategoriesRes] = await Promise.all([
    fetchEventInfoData(orgId, eventSlug),
    fetchEventRubricCategoriesData(orgId, eventSlug),
  ]);
  if (infoRes.status === "ERROR" || !infoRes.data) {
    return (
      <div className="relative w-full">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
          <div className="text-white text-xl font-semibold">Error</div>
          <div className="text-white/70 text-sm leading-relaxed">
            Failed to fetch event info.
          </div>
          <Link
            href={`/app/orgs/${orgSlug}/events/${eventSlug}`}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 text-center"
          >
            Back to event
          </Link>
        </div>
      </div>
    );
  }

  const event = infoRes.data as EventInfoPageData;
  const rubricCategories =
    (rubricCategoriesRes.data as RubricCategoryDraft[]) ?? [];
  return (
    <div className="relative w-full">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <EventHeroInfoSection
          event={event}
          rubricCategories={rubricCategories}
        />
        <PrivateEventInfo
          rulesMarkdown={event.rulesMarkdown}
          rubricMarkdown={event.rubricMarkdown}
        />
        <PublicEventRubricCategoriesSection
          rubricCategories={rubricCategories}
        />
        <PrivateEventTracks tracks={event.tracks} />
        <PrivateEventAwards awards={event.awards} />
      </div>
    </div>
  );
};

export default PrivateEventInfoPage;
