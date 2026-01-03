import React from "react";
import type { EventStaffRow } from "@/src/lib/global_types";
import { card, inner, staffRolePillClasses } from "@/src/lib/utils";

const staffRoleLabel = (role: string) => {
  const r = (role || "").toUpperCase();
  if (r === "OWNER") return "Owner";
  if (r === "ADMIN") return "Admin";
  if (r === "JUDGE") return "Judge";
  return "Staff";
};

const initials = (nameOrEmail: string) => {
  const s = (nameOrEmail || "").trim();
  if (!s) return "?";

  const parts = s.includes("@")
    ? s.split("@")[0].split(/[.\s_-]+/)
    : s.split(/\s+/);

  const a = (parts[0]?.[0] ?? "").toUpperCase();
  const b = (parts[1]?.[0] ?? "").toUpperCase();
  return a + b || a || "?";
};

const EventStaffCard = ({ row }: { row: EventStaffRow }) => {
  const displayName = row.user.name?.trim() || row.user.email;
  const email = row.user.email;

  return (
    <div className={`${card} p-5 md:p-6 hover:bg-white/6 transition-colors`}>
      <div className="flex items-start gap-4">
        <div
          className={`${inner} h-11 w-11 md:h-12 md:w-12 flex items-center justify-center shrink-0 text-white/90 font-semibold`}
          aria-hidden
        >
          {initials(displayName)}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-white font-semibold leading-snug line-clamp-2">
                {displayName}
              </div>
            </div>

            <div
              className={`px-3 py-1 rounded-full border text-[11px] font-semibold tracking-wide whitespace-nowrap ${staffRolePillClasses(
                row.role
              )}`}
              title={row.role}
            >
              {staffRoleLabel(row.role)}
            </div>
          </div>

          <div className="text-white/60 text-xs md:text-sm truncate">
            {email}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventStaffCard;
