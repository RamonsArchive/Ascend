import React from "react";
import type { EventStaffRow } from "@/src/lib/global_types";
import EventStaffCard from "./EventStaffCard";
import { titleText, subtleText, card } from "@/src/lib/utils";

const EventStaffSection = ({ staff }: { staff: EventStaffRow[] }) => {
  const hasStaff = staff.length > 0;

  const sorted = [...staff].sort((a, b) => {
    const ar = a.role === "ADMIN" ? 0 : 1;
    const br = b.role === "ADMIN" ? 0 : 1;
    if (ar !== br) return ar - br;
    const an = (a.user.name ?? a.user.email).toLowerCase();
    const bn = (b.user.name ?? b.user.email).toLowerCase();
    return an.localeCompare(bn);
  });

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-6 md:gap-8">
        <div className="flex flex-col gap-3">
          <h2 className={titleText}>Judging panel & staff</h2>
          <div className={subtleText}>
            The people reviewing submissions and helping run the event.
          </div>
        </div>

        {hasStaff ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {sorted.map((row) => (
              <EventStaffCard key={row.userId} row={row} />
            ))}
          </div>
        ) : (
          <div className={`${card} p-6 md:p-8`}>
            <div className="text-white/80 font-semibold">No staff yet</div>
            <div className="text-white/60 text-sm mt-1">
              Invite judges or staff to help run the event.
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default EventStaffSection;
