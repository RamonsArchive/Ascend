import React from "react";
import type {
  EventInfoPageData,
  RubricCategoryDraft,
} from "@/src/lib/global_types";
import {
  eventJoinModeLabel,
  eventPillClasses,
  eventStatusLabel,
  eventVisibilityLabel,
  formatMaybe,
} from "@/src/lib/utils";

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

const EventHeroInfoSection = ({
  event,
  rubricCategories,
}: {
  event: EventInfoPageData;
  rubricCategories: RubricCategoryDraft[];
}) => {
  const locationPrimary =
    event.locationName?.trim() || event.locationAddress?.trim() || null;

  const tracksPreview = event.tracks
    .slice(0, 3)
    .map((t) => t.name)
    .filter(Boolean);
  const awardsPreview = event.awards
    .slice(0, 3)
    .map((a) => a.name)
    .filter(Boolean);

  const statusText = eventStatusLabel(event.status);
  const visibilityText = eventVisibilityLabel(event.visibility);
  const joinText = eventJoinModeLabel(event.joinMode);

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-6 md:gap-8">
        <div className="w-full rounded-3xl overflow-hidden border border-white/10 bg-primary-950/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          {/* colorful header shell */}
          <div className="relative">
            {/* background color layers */}
            <div className="absolute inset-0 bg-linear-to-br from-emerald-900/15 via-sky-900/10 to-amber-900/10" />
            <div className="absolute inset-0 bg-linear-to-t from-primary-950 via-primary-950/35 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_62%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.06),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.05),transparent_60%)]" />
            {/* content */}
            <div className="relative flex flex-col p-5 md:p-7 gap-6 md:gap-8 min-h-[220px] md:min-h-[260px]">
              {/* top row: pills + hosted */}
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

                <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/70 text-[11px] font-semibold">
                  Hosted by{" "}
                  <span className="text-white/85">{event.org.name}</span>
                </div>
              </div>

              {/* spacer pushes title below “tabs” area */}
              <div className="flex-1" />

              {/* title block */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl md:text-4xl font-semibold text-white leading-tight">
                      {event.heroTitle?.trim() || event.name}
                    </h1>

                    {/* subtle accent chip */}
                    <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/70 text-[11px] font-semibold">
                      {event.tracks.length} tracks • {event.awards.length}{" "}
                      awards
                    </div>
                  </div>

                  {/* “accent underline glow” */}
                  <div className="h-px w-full bg-linear-to-r from-emerald-400/30 via-sky-400/25 to-transparent" />
                </div>

                {event.heroSubtitle?.trim() ? (
                  <div className="text-white/70 text-sm md:text-base leading-relaxed max-w-4xl">
                    {event.heroSubtitle}
                  </div>
                ) : (
                  <div className="text-white/70 text-sm md:text-base leading-relaxed max-w-4xl">
                    Everything participants need: timeline, location, tracks,
                    awards, plus clear rules and rubric below.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* info grid */}
          <div className="p-5 md:p-7">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              {/* Counts */}
              <div className="rounded-3xl bg-white/4 border border-white/10 px-6 py-6 md:px-8 md:py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div className="flex flex-col gap-4">
                  <div className="text-white font-semibold text-lg md:text-xl">
                    At a glance
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-4">
                      <div className="text-white/55 text-xs">Members</div>
                      <div className="text-white font-semibold text-lg">
                        {event._count.members}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-4">
                      <div className="text-white/55 text-xs">Teams</div>
                      <div className="text-white font-semibold text-lg">
                        {event._count.teams}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-4">
                      <div className="text-white/55 text-xs">Submissions</div>
                      <div className="text-white font-semibold text-lg">
                        {event._count.submissions}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-4">
                      <div className="text-white/55 text-xs">Staff</div>
                      <div className="text-white font-semibold text-lg">
                        {event._count.staff}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="rounded-3xl bg-white/4 border border-white/10 px-6 py-6 md:px-8 md:py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div className="flex flex-col gap-4">
                  <div className="text-white font-semibold text-lg md:text-xl">
                    Timeline
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-4">
                      <div className="text-white/55 text-xs">
                        Registration opens
                      </div>
                      <div className="text-white/80 text-sm">
                        {formatMaybe(event.registrationOpensAt)}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-4">
                      <div className="text-white/55 text-xs">
                        Registration closes
                      </div>
                      <div className="text-white/80 text-sm">
                        {formatMaybe(event.registrationClosesAt)}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-4">
                      <div className="text-white/55 text-xs">Event window</div>
                      <div className="text-white/80 text-sm">
                        {formatMaybe(event.startAt)}{" "}
                        <span className="text-white/40">→</span>{" "}
                        {formatMaybe(event.endAt)}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-4">
                      <div className="text-white/55 text-xs">
                        Submission due
                      </div>
                      <div className="text-white/80 text-sm">
                        {formatMaybe(event.submitDueAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location + Preview */}
              <div className="rounded-3xl bg-white/4 border border-white/10 px-6 py-6 md:px-8 md:py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div className="flex flex-col gap-4">
                  <div className="text-white font-semibold text-lg md:text-xl">
                    Location & focus
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-4">
                      <div className="text-white/55 text-xs">Where</div>
                      <div className="text-white/80 text-sm">
                        {locationPrimary || "Not set"}
                      </div>

                      {event.locationNotes?.trim() ? (
                        <div className="text-white/60 text-xs leading-relaxed pt-2">
                          {event.locationNotes}
                        </div>
                      ) : null}
                    </div>

                    {event.locationMapUrl?.trim() ? (
                      <a
                        href={event.locationMapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-100 font-semibold text-sm px-4 py-3 text-center hover:bg-emerald-400/15 transition-colors"
                      >
                        Open map
                      </a>
                    ) : (
                      <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white/55 text-sm text-center">
                        No map link yet
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <div className="text-white/55 text-xs">
                        Rubric categories
                      </div>
                      <div className="text-white/80 text-sm">
                        {rubricCategories.length === 0
                          ? "No rubric categories yet"
                          : `${rubricCategories.length} rubric category${
                              rubricCategories.length === 1 ? "" : "s"
                            } • ${rubricCategories.map((c) => c.name).join(", ")}${
                              rubricCategories.length > 3 ? "…" : ""
                            }`}
                      </div>

                      <div className="text-white/55 text-xs">Tracks</div>
                      <div className="text-white/80 text-sm">
                        {event.tracks.length === 0
                          ? "No tracks yet"
                          : `${event.tracks.length} track${
                              event.tracks.length === 1 ? "" : "s"
                            } • ${tracksPreview.join(", ")}${
                              event.tracks.length > 3 ? "…" : ""
                            }`}
                      </div>

                      <div className="text-white/55 text-xs">Awards</div>
                      <div className="text-white/80 text-sm">
                        {event.awards.length === 0
                          ? "No awards yet"
                          : `${event.awards.length} award${
                              event.awards.length === 1 ? "" : "s"
                            } • ${awardsPreview.join(", ")}${
                              event.awards.length > 3 ? "…" : ""
                            }`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-white/10" />
        </div>
      </div>
    </section>
  );
};

export default EventHeroInfoSection;
