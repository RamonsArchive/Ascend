import React, { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Event, Organization } from "@prisma/client";

function formatDateRange(startAt: Date | null, endAt: Date | null) {
  if (!startAt && !endAt) return null;
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const start = startAt ? fmt.format(startAt) : null;
  const end = endAt ? fmt.format(endAt) : null;
  if (start && end) return `${start} → ${end}`;
  return start ?? end;
}

const EventCard = ({
  event,
  org,
}: {
  event: Event;
  org?: Organization | null;
}) => {
  const dateRange = useMemo(
    () => formatDateRange(event.startAt ?? null, event.endAt ?? null),
    [event.endAt, event.startAt]
  );

  const badge = useMemo(() => {
    const type =
      event.type === "HACKATHON"
        ? "Hackathon"
        : event.type === "IDEATHON"
          ? "Ideathon"
          : event.type;
    const join =
      event.joinMode === "OPEN"
        ? "Open"
        : event.joinMode === "REQUEST"
          ? "Request"
          : event.joinMode === "INVITE_ONLY"
            ? "Invite-only"
            : event.joinMode;
    return { type, join };
  }, [event.joinMode, event.type]);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group w-full rounded-xl border border-white/10 bg-primary-950/70 hover:bg-primary-950 transition-colors duration-200 overflow-hidden hover:border-accent-100"
    >
      <div className="relative w-full h-[160px] bg-black/40">
        {event.coverKey ? (
          <Image
            src={event.coverKey}
            alt={`${event.name} cover`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover opacity-85 group-hover:opacity-95 transition-opacity duration-200"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-secondary-500/20 via-primary-950 to-primary-950" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-primary-950 via-primary-950/35 to-transparent" />

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-black/40 backdrop-blur-sm text-white/90 border border-white/10">
            {badge.type}
          </div>
          <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-black/40 backdrop-blur-sm text-white/80 border border-white/10">
            {badge.join}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className="text-white font-semibold leading-snug">
          {event.heroTitle || event.name}
        </div>
        {event.heroSubtitle ? (
          <div className="text-white/70 text-sm leading-relaxed line-clamp-2">
            {event.heroSubtitle}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-white/55">
          {org?.name ? <span className="text-white/70">{org.name}</span> : null}
          {dateRange ? <span>{dateRange}</span> : null}
          {event.registrationClosesAt ? (
            <span>
              Reg closes{" "}
              {new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "2-digit",
              }).format(event.registrationClosesAt)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
