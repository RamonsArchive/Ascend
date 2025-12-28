import React from "react";
import type { PublicEventListItem } from "@/src/lib/global_types";
import PublicEventCard from "../PublicEventCard";

const PublicEventTimeStateSection = ({
  title,
  subtitle,
  items,
  orgSlug,
}: {
  title: string;
  subtitle?: string;
  items: PublicEventListItem[];
  orgSlug: string;
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="text-white text-lg md:text-xl font-semibold">
          {title}
        </div>
        {subtitle ? (
          <div className="text-white/65 text-sm leading-relaxed">
            {subtitle}
          </div>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white/70 text-sm">
          No events in this section.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((e) => (
            <PublicEventCard key={e.id} event={e} orgSlug={orgSlug} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicEventTimeStateSection;
