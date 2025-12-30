import React from "react";
import { TrackDraft } from "@/src/lib/global_types";

const PrivateEventTracks = ({ tracks }: { tracks: TrackDraft[] }) => {
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-6 md:gap-8">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Event tracks
          </h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-3xl">
            Choose a track to focus your build and help judges compare projects
            in similar areas.
          </p>
        </div>

        {tracks.length === 0 ? (
          <div className="w-full rounded-3xl bg-white/4 border border-white/10 px-6 py-6 md:px-8 md:py-8">
            <div className="text-white/80 font-semibold">No tracks yet</div>
            <div className="text-white/60 text-sm leading-relaxed">
              Tracks will appear here once they’re added in event settings.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {tracks.map((t) => (
              <div
                key={t.clientId}
                className="w-full rounded-3xl bg-white/4 border border-white/10 px-6 py-6 md:px-8 md:py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-white font-semibold text-lg">
                      {t.name}
                    </div>
                    <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/70 text-[11px] font-semibold">
                      Track
                    </div>
                  </div>

                  {t.blurb ? (
                    <div className="text-white/70 text-sm leading-relaxed">
                      {t.blurb}
                    </div>
                  ) : (
                    <div className="text-white/55 text-sm leading-relaxed">
                      No description provided.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PrivateEventTracks;
