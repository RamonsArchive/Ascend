"use client";

import React, { useMemo, useState } from "react";
import type { OrgMember } from "@/src/lib/global_types";
import PublicMemberCard from "@/src/components/PublicMemberCard";

const ROLE_ALL = "ALL" as const;
type RoleFilter = typeof ROLE_ALL | "OWNER" | "ADMIN" | "MEMBER";

const PublicOrgMembersSection = ({ members }: { members: OrgMember[] }) => {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>(ROLE_ALL);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return members.filter((m) => {
      const matchesRole =
        roleFilter === ROLE_ALL ? true : m.role === roleFilter;

      // Public version: you likely only have userId + role on OrgMembership.
      // Search supports userId (safe + available) until you add user include/name.
      const matchesQuery = q
        ? (m.user.name ?? "").toLowerCase().includes(q) ||
          (m.user.email ?? "").toLowerCase().includes(q)
        : true;

      return matchesRole && matchesQuery;
    });
  }, [members, query, roleFilter]);

  // Show top 50 for now (you can paginate later)
  const visible = useMemo(() => filtered.slice(0, 50), [filtered]);

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-10 md:gap-12">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Members
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            Browse our members. Search is limited to user IDs for now.
          </div>
        </div>

        {/* Filters */}
        <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
          <div className="flex flex-col gap-6 md:gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs md:text-sm text-white/75">
                  Search
                </label>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs md:text-sm text-white/75">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                >
                  {[ROLE_ALL, "OWNER", "ADMIN", "MEMBER"].map((r) => (
                    <option key={r} value={r} className="bg-primary-950">
                      {r === ROLE_ALL ? "All roles" : r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-white/60 text-xs md:text-sm">
              Showing{" "}
              <span className="text-white/90 font-semibold">
                {Math.min(visible.length, 50)}
              </span>{" "}
              of{" "}
              <span className="text-white/90 font-semibold">
                {filtered.length}
              </span>{" "}
              matches <span className="text-white/70">(max 50 displayed)</span>
            </div>
          </div>
        </div>

        {/* Cards */}
        {visible.length === 0 ? (
          <div className="w-full rounded-3xl border border-white/10 bg-white/4 px-6 py-6 text-white/70 text-sm">
            No members match this filter.
          </div>
        ) : (
          <div className="flex flex-col gap-6 md:gap-8">
            {visible.map((member) => (
              <PublicMemberCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PublicOrgMembersSection;
