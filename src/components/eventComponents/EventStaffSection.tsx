import React from "react";
import type { EventStaffData } from "@/src/lib/global_types";
import EventStaffCard from "./EventStaffCard";
import { staffRolePillClasses } from "@/src/lib/utils";

const EventStaffSection = ({ staff }: { staff: EventStaffData }) => {
  const rows = staff?.staff ?? [];
  const hasStaff = rows.length > 0;

  // lightweight ordering: ADMIN first, then the rest (no heavy transforms)
  const sorted = [...rows].sort((a, b) => {
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
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Judging panel & staff
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
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
          <div className="w-full rounded-3xl border border-white/10 bg-white/4 p-6 md:p-8">
            <div className="text-white/70">No staff has been added yet.</div>
          </div>
        )}
      </div>
    </section>
  );
};

export default EventStaffSection;
export const RolePill = ({ role }: { role: string }) => {
  return (
    <div
      className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${staffRolePillClasses(
        role
      )}`}
    >
      {role}
    </div>
  );
};
