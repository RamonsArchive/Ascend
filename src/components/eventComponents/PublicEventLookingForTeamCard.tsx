"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

const PublicEventLookingForTeamCard = ({
  orgSlug,
  eventSlug,
  member,
}: {
  orgSlug: string;
  eventSlug: string;
  member: {
    id: string;
    userId: string;
    lookingForTeam: boolean;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  };
}) => {
  const displayName = member.user.name?.trim() || "Participant";

  // If you have a profile page later, link there; for now link to event page
  const href = `/app/orgs/${orgSlug}/events/${eventSlug}`;

  const fallback = displayName.slice(0, 1).toUpperCase();

  return (
    <Link
      href={href}
      className="w-full rounded-3xl bg-white/4 border border-white/10 px-6 py-6 md:px-8 md:py-8 hover:bg-white/6 hover:border-accent-100 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
    >
      <div className="flex items-center gap-4">
        <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
          {member.user.image ? (
            <Image
              src={member.user.image}
              alt="avatar"
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-white/70">
              {fallback}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div className="text-white font-semibold">{displayName}</div>
          <div className="text-white/60 text-xs">Looking for a team</div>
        </div>
      </div>
    </Link>
  );
};

export default PublicEventLookingForTeamCard;
