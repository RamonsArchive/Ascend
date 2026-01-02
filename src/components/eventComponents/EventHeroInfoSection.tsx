import React from "react";
import type { EventInfoPageData } from "@/src/lib/global_types";
import { pill, formatMaybe } from "@/src/lib/utils";

const EventHeroInfoSection = ({ event }: { event: EventInfoPageData }) => {
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

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-6 md:gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className={pill}>{event.type}</div>
            <div className={pill}>{event.visibility}</div>
            <div className={pill}>{event.joinMode}</div>
            <div className={pill}>{event.status}</div>
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold text-white">
            {event.heroTitle?.trim() || event.name}
          </h1>

          {event.heroSubtitle?.trim() ? (
            <div className="text-white/70 text-sm md:text-base leading-relaxed max-w-4xl">
              {event.heroSubtitle}
            </div>
          ) : null}

          <div className="text-white/55 text-xs md:text-sm">
            Hosted by{" "}
            <span className="text-white/80 font-semibold">
              {event.org.name}
            </span>
          </div>
        </div>

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
                  <div className="text-white/55 text-xs">Submission due</div>
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
                Location
              </div>

              <div className="flex flex-col gap-3">
                <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-4">
                  <div className="text-white/55 text-xs">Where</div>
                  <div className="text-white/80 text-sm">
                    {locationPrimary || "Not set"}
                  </div>

                  {event.locationNotes?.trim() ? (
                    <div className="text-white/60 text-xs leading-relaxed mt-2">
                      {event.locationNotes}
                    </div>
                  ) : null}
                </div>

                {event.locationMapUrl?.trim() ? (
                  <a
                    href={event.locationMapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl bg-white text-primary-950 font-semibold text-sm px-4 py-3 text-center transition-opacity hover:opacity-90"
                  >
                    Open map
                  </a>
                ) : (
                  <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white/55 text-sm text-center">
                    No map link yet
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <div className="text-white/55 text-xs">Tracks</div>
                  <div className="text-white/80 text-sm">
                    {event.tracks.length === 0
                      ? "No tracks yet"
                      : `${event.tracks.length} track${event.tracks.length === 1 ? "" : "s"} • ${tracksPreview.join(", ")}${event.tracks.length > 3 ? "…" : ""}`}
                  </div>

                  <div className="text-white/55 text-xs">Awards</div>
                  <div className="text-white/80 text-sm">
                    {event.awards.length === 0
                      ? "No awards yet"
                      : `${event.awards.length} award${event.awards.length === 1 ? "" : "s"} • ${awardsPreview.join(", ")}${event.awards.length > 3 ? "…" : ""}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventHeroInfoSection;
