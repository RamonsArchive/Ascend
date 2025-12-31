"use client";

import React from "react";
import Image from "next/image";
import type { EventStaffRow } from "@/src/lib/global_types";

const EventStaffCard = ({ row }: { row: EventStaffRow }) => {
  const name = row.user.name?.trim() || "Staff member";
  const email = row.user.email;
  const role = row.role;

  const fallback = (name || email || "U").trim().slice(0, 1).toUpperCase();

  return (
    <div className="group w-full rounded-3xl border border-white/10 bg-white/4 hover:bg-white/6 transition-colors duration-200 overflow-hidden hover:border-accent-100">
      <div className="flex flex-col gap-4 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-white/5 shrink-0">
            {row.user.image ? (
              <Image
                src={row.user.image}
                alt={`${name} avatar`}
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-white/70">
                {fallback}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-white font-semibold leading-tight truncate">
                {name}
              </div>

              <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/70 text-[11px] font-semibold">
                {role}
              </div>
            </div>

            <div className="text-white/60 text-sm break-all">{email}</div>
          </div>
        </div>

        <div className="text-white/65 text-sm leading-relaxed">
          {role === "ADMIN"
            ? "Event staff with admin permissions."
            : "Event staff member supporting the event."}
        </div>
      </div>
    </div>
  );
};

export default EventStaffCard;
