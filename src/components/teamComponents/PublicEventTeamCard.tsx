"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

const PublicEventTeamCard = ({
  orgSlug,
  eventSlug,
  team,
}: {
  orgSlug: string;
  eventSlug: string;
  team: {
    id: string;
    slug: string;
    name: string;
    lookingForMembers: boolean;
    track: { id: string; name: string } | null;
    members: Array<{
      id: string;
      role: "LEADER" | "MEMBER";
      user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
      };
    }>;
  };
}) => {
  const memberCount = team.members.length;
  const preview = team.members.slice(0, 6);

  const href = `/app/orgs/${orgSlug}/events/${eventSlug}/teams/${team.slug}`;

  return (
    <Link
      href={href}
      className="group w-full rounded-3xl bg-white/4 border border-white/10 px-6 py-6 md:px-8 md:py-8 hover:bg-white/6 hover:border-accent-100 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="text-white font-semibold text-lg md:text-xl leading-tight group-hover:opacity-90 transition-opacity">
              {team.name}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {team.track ? (
                <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/70 text-[11px] font-semibold">
                  {team.track.name}
                </div>
              ) : null}

              <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/70 text-[11px] font-semibold">
                {memberCount} member{memberCount === 1 ? "" : "s"}
              </div>

              {team.lookingForMembers ? (
                <div className="px-3 py-1 rounded-full border border-accent-400/20 bg-accent-500/10 text-accent-200 text-[11px] font-semibold">
                  Looking for members
                </div>
              ) : null}
            </div>
          </div>

          <div className="text-white/40 text-xs">View</div>
        </div>

        {/* team “square” with member squares inside */}
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="grid grid-cols-6 gap-2">
            {preview.map((m) => {
              const fallback = (m.user.name ?? m.user.email ?? "U")
                .trim()
                .slice(0, 1)
                .toUpperCase();

              return (
                <div
                  key={m.id}
                  className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-white/5"
                  title={m.user.name ?? m.user.email}
                >
                  {m.user.image ? (
                    <Image
                      src={m.user.image}
                      alt="avatar"
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-white/70">
                      {fallback}
                    </div>
                  )}

                  <div className="absolute bottom-1 left-1 px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-[10px] text-white/80">
                    {m.role}
                  </div>
                </div>
              );
            })}

            {team.members.length > preview.length ? (
              <div className="aspect-square rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-xs text-white/70">
                +{team.members.length - preview.length}
              </div>
            ) : null}

            {preview.length < 6
              ? Array.from({ length: 6 - preview.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="aspect-square rounded-xl border border-white/10 bg-white/3"
                  />
                ))
              : null}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PublicEventTeamCard;
