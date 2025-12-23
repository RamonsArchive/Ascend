"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import type { OrgMember } from "@/src/lib/global_types";
import { rolePillClasses } from "@/src/lib/utils";

const PublicMemberCard = ({ member }: { member: OrgMember }) => {
  const initials = useMemo(() => {
    const name = (member.user.name ?? "").trim();
    if (!name) return "M";
    const parts = name.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "M";
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (a + b).toUpperCase();
  }, [member.user.name]);

  return (
    <div className="group w-full rounded-3xl border border-white/10 bg-white/4 hover:bg-white/6 transition-colors duration-200 overflow-hidden hover:border-accent-100">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="relative w-11 h-11 rounded-2xl overflow-hidden border border-white/10 bg-white/5 shrink-0">
              {member.user.image ? (
                <Image
                  src={member.user.image}
                  alt={`${member.user.name} avatar`}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white/70">
                  {initials}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 min-w-0">
              <div className="text-white font-semibold leading-tight truncate">
                {member.user.name}
              </div>
              <div className="text-white/60 text-xs truncate">
                {member.user.email}
              </div>
            </div>
          </div>

          <div
            className={[
              "shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border",
              rolePillClasses(member.role),
            ].join(" ")}
          >
            {member.role}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicMemberCard;
