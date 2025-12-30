import React from "react";
import PublicEventTeamCard from "@/src/components/teamComponents/PublicEventTeamCard";
import { PrivateEventTeamCardData } from "@/src/lib/global_types";

const PrivateEventTeams = ({
  orgSlug,
  eventSlug,
  teams,
}: {
  orgSlug: string;
  eventSlug: string;
  teams: PrivateEventTeamCardData[];
}) => {
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-6 md:gap-8">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Event teams
          </h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-3xl">
            Browse teams, see who’s building, and jump into a track-aligned
            squad.
          </p>
        </div>

        {teams.length === 0 ? (
          <div className="w-full rounded-3xl bg-white/4 border border-white/10 px-6 py-6 md:px-8 md:py-8">
            <div className="text-white/80 font-semibold">No teams yet</div>
            <div className="text-white/60 text-sm leading-relaxed">
              Teams will appear here once participants start creating them.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {teams.map((team) => (
              <PublicEventTeamCard
                key={team.id}
                orgSlug={orgSlug}
                eventSlug={eventSlug}
                team={team}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PrivateEventTeams;
