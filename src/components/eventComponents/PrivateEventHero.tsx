import React from "react";
import Link from "next/link";
import Image from "next/image";

import type { EventCompleteData } from "@/src/lib/global_types";
import {
  formatDateRange,
  formatShortDate,
  eventJoinModeLabel,
  eventPillClasses,
  eventStatusLabel,
  eventVisibilityLabel,
} from "@/src/lib/utils";
import { s3KeyToPublicUrl } from "@/src/lib/s3-client";

const StatPill = ({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) => {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="text-xs text-white/60">{label}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
};

const Pill = ({
  kind,
  value,
  label,
}: {
  kind: "STATUS" | "VISIBILITY" | "JOIN";
  value: string;
  label: string;
}) => {
  return (
    <div
      className={`px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${eventPillClasses(
        kind,
        value
      )}`}
    >
      {label}
    </div>
  );
};

const PrivateEventHero = ({
  orgSlug,
  event,
}: {
  orgSlug: string;
  event: EventCompleteData;
}) => {
  const coverUrl = event.coverKey
    ? (s3KeyToPublicUrl(event.coverKey) as string)
    : null;

  const dateRange = formatDateRange(event.startAt ?? null, event.endAt ?? null);

  const regOpens = formatShortDate(event.registrationOpensAt ?? null);
  const regCloses = formatShortDate(event.registrationClosesAt ?? null);
  const submitDue = formatShortDate(event.submitDueAt ?? null);

  const address = (event.locationAddress || "").trim();

  const statusText = eventStatusLabel(event.status);
  const visibilityText = eventVisibilityLabel(event.visibility);
  const joinText = eventJoinModeLabel(event.joinMode);

  const orgHref = `/app/orgs/${orgSlug}`;
  const eventHomeHref = `/app/orgs/${orgSlug}/events/${event.slug}`;
  const eventSettingsHref = `/app/orgs/${orgSlug}/events/${event.slug}/settings`;

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-6 md:gap-8">
        <div className="w-full rounded-3xl overflow-hidden border border-white/10 bg-primary-950/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          {/* Cover */}
          <div className="relative w-full min-h-[180px] md:min-h-[210px] bg-black/40">
            {/* image / background */}
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={`${event.name} cover`}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 1200px"
                className="object-cover opacity-90"
              />
            ) : (
              <div className="absolute inset-0 bg-linear-to-br from-secondary-500/20 via-primary-950 to-primary-950" />
            )}

            {/* overlays */}
            <div className="absolute inset-0 bg-linear-to-t from-primary-950 via-primary-950/35 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />

            {/* ✅ ONE parent overlay that controls spacing */}
            <div className="relative flex flex-col min-h-[210px] md:min-h-[280px] p-5 md:p-7 gap-6 md:gap-8">
              {/* top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Pill kind="STATUS" value={event.status} label={statusText} />
                  <Pill
                    kind="VISIBILITY"
                    value={event.visibility}
                    label={visibilityText}
                  />
                  <Pill kind="JOIN" value={event.joinMode} label={joinText} />
                </div>

                <Link
                  href={orgHref}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm text-white/90 border border-white/10 hover:bg-white/15 transition-colors"
                >
                  {event.org?.name ?? "Organization"} →
                </Link>
              </div>

              {/* ✅ spacer pushes title section down WITHOUT overlap */}
              <div className="flex-1" />

              {/* bottom title */}
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-4xl font-semibold text-white leading-tight">
                  {event.heroTitle || event.name}
                </h1>

                {event.heroSubtitle ? (
                  <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-3xl">
                    {event.heroSubtitle}
                  </div>
                ) : (
                  <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-3xl">
                    Manage tracks, awards, teams, and submissions — plus staff +
                    member overview.
                  </div>
                )}

                <div className="pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    {(event.startAt || event.endAt) && dateRange ? (
                      <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                        <div className="text-[11px] md:text-xs text-white/55">
                          Event dates
                        </div>
                        <div className="pt-1 text-sm md:text-base text-white/80 font-semibold leading-snug">
                          {dateRange}
                        </div>
                        <div className="pt-1 text-xs text-white/55">
                          Start:{" "}
                          {formatShortDate(event.startAt ?? null) || "TBD"} ·
                          End: {formatShortDate(event.endAt ?? null) || "TBD"}
                        </div>
                      </div>
                    ) : null}

                    {regOpens || regCloses || submitDue ? (
                      <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                        <div className="text-[11px] md:text-xs text-white/55">
                          Registration
                        </div>

                        <div className="pt-1 flex flex-col gap-1 text-sm text-white/75">
                          {regOpens ? (
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="text-white/55 text-xs">
                                Opens
                              </span>
                              <span className="text-white/85 font-semibold">
                                {regOpens}
                              </span>
                            </div>
                          ) : null}

                          {regCloses ? (
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="text-white/55 text-xs">
                                Closes
                              </span>
                              <span className="text-white/85 font-semibold">
                                {regCloses}
                              </span>
                            </div>
                          ) : null}

                          {submitDue ? (
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="text-white/55 text-xs">
                                Submission due
                              </span>
                              <span className="text-white/85 font-semibold">
                                {submitDue}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {address ? (
                      <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                        <div className="text-[11px] md:text-xs text-white/55">
                          Location
                        </div>
                        <div className="pt-1 text-sm md:text-base text-white/80 font-semibold leading-snug wrap-break-words">
                          {address}
                        </div>
                        {event.locationName ? (
                          <div className="pt-1 text-xs text-white/55 wrap-break-words">
                            {event.locationName}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 md:p-7">
            <div className="flex flex-col gap-6 md:gap-7">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <StatPill label="Teams" value={event._count?.teams ?? 0} />
                <StatPill
                  label="Submissions"
                  value={event._count?.submissions ?? 0}
                />
                <StatPill label="Staff" value={event._count?.staff ?? 0} />
                <StatPill label="Members" value={event._count?.members ?? 0} />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs md:text-sm text-white/60">
                  Event slug:{" "}
                  <span className="text-white/80 font-semibold">
                    {event.slug}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Link
                    href={eventHomeHref}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 text-center"
                  >
                    Open event home
                  </Link>

                  <Link
                    href={eventSettingsHref}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/85 font-semibold text-sm md:text-base hover:bg-white/10 transition-colors text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  >
                    Settings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-white/10" />
      </div>
    </section>
  );
};

export default PrivateEventHero;
