"use client";

import React, { useMemo, useState } from "react";

import EditOrgMemberCard from "@/src/components/orgComponents/EditOrgMemberCard";
import { org_members_data } from "@/src/constants/orgConstants/org_index";
import { OrgRole, Member } from "@/src/lib/global_types";

const EditOrgMembersSection = ({
  orgId,
  members,
  currentUserId,
  viewerRole,
}: {
  orgId: string;
  members: Member[];
  currentUserId: string;
  viewerRole: OrgRole;
}) => {
  const { section, filters } = org_members_data;
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState(filters.roleAll);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      const matchesRole =
        roleFilter === filters.roleAll ? true : m.role === roleFilter;

      const matchesQuery = q
        ? (m.user.name ?? "").toLowerCase().includes(q) ||
          (m.user.email ?? "").toLowerCase().includes(q)
        : true;

      return matchesRole && matchesQuery;
    });
  }, [members, query, roleFilter, filters.roleAll]);

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-10 md:gap-12">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            {section.title}
          </h2>
          <div className="text-white/70 text-sm md:text-base leading-relaxed max-w-4xl">
            {section.description}
          </div>
        </div>

        <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
          <div className="flex flex-col gap-6 md:gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs md:text-sm text-white/75">
                  {filters.searchLabel}
                </label>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={filters.searchPlaceholder}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs md:text-sm text-white/75">
                  {filters.roleLabel}
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                >
                  {[filters.roleAll, "OWNER", "ADMIN", "MEMBER"].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-white/60 text-xs md:text-sm">
              Showing{" "}
              <span className="text-white/90 font-semibold">
                {filtered.length}
              </span>{" "}
              of{" "}
              <span className="text-white/90 font-semibold">
                {members.length}
              </span>{" "}
              members
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 md:gap-8">
          {filtered.map((member) => (
            <EditOrgMemberCard
              key={member.id}
              orgId={orgId}
              member={member}
              currentUserId={currentUserId}
              viewerRole={viewerRole}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default EditOrgMembersSection;
