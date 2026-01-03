"use client";

import React, { useState } from "react";
import type {
  EventMembersData,
  EventStaffData,
  EventStaffRole,
} from "@/src/lib/global_types";
import { uniqBy } from "@/src/lib/utils";
import type { Candidate } from "@/src/lib/global_types";
import RolePill from "@/src/components/RolePill";

const card =
  "rounded-3xl bg-white/4 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";

const inner =
  "rounded-2xl bg-white/5 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";

const subtleText = "text-white/60 text-xs";
const titleText = "text-white font-semibold text-lg md:text-xl";

/**
 * Event staff roles are NOT the same as OrgMember roles,
 * but your existing roleBadgeClasses already matches your frosted aesthetic.
 * We'll map staff roles -> closest palette.
 */

const DEFAULT_ROLE: EventStaffRole = "STAFF" as EventStaffRole;

const EventStaffSettings = ({
  eventId,
  staffData,
  membersData,
  roleOptions,
  onAddStaff,
  onChangeRole,
  onRemoveStaff,
}: {
  eventId: string;
  staffData: EventStaffData;
  membersData: EventMembersData | null;
  roleOptions?: EventStaffRole[];
  onAddStaff?: (args: {
    eventId: string;
    userId: string;
    role: EventStaffRole;
  }) => Promise<void>;
  onChangeRole?: (args: {
    eventId: string;
    userId: string;
    role: EventStaffRole;
  }) => Promise<void>;
  onRemoveStaff?: (args: { eventId: string; userId: string }) => Promise<void>;
}) => {
  const [query, setQuery] = useState("");
  const [addRole, setAddRole] = useState<EventStaffRole>(DEFAULT_ROLE);
  console.log("staffData", staffData);
  console.log("membersData", membersData);

  // ===== derived: staff ids =====
  const staffUserIds = new Set<string>();
  for (const s of staffData.staff) staffUserIds.add(s.userId);

  // ===== derived: candidates (participants that are NOT already staff) =====
  let candidates: Candidate[] = [];
  if (membersData) {
    const fromTeams: Candidate[] = [];
    for (const t of membersData.teams) {
      for (const m of t.members) {
        fromTeams.push({
          userId: m.userId,
          name: m.user.name,
          email: m.user.email,
          image: m.user.image,
          source: "TEAM",
        });
      }
    }

    const fromUnassigned: Candidate[] = membersData.unassigned.map((u) => ({
      userId: u.userId,
      name: u.user.name,
      email: u.user.email,
      image: u.user.image,
      source: "UNASSIGNED",
    }));

    const all = uniqBy([...fromTeams, ...fromUnassigned], (c) => c.userId);
    candidates = all.filter((c) => !staffUserIds.has(c.userId));
  }

  // ===== derived: filtered candidates =====
  const q = query.trim().toLowerCase();
  const filteredCandidates =
    q.length === 0
      ? candidates
      : candidates.filter((c) => {
          const n = (c.name || "").toLowerCase();
          const e = (c.email || "").toLowerCase();
          return n.includes(q) || e.includes(q);
        });

  // ===== derived: role options =====
  let inferredRoleOptions: EventStaffRole[] = [];
  if (roleOptions && roleOptions.length > 0) {
    inferredRoleOptions = roleOptions;
  } else {
    const existing = new Set<string>();
    for (const s of staffData.staff) existing.add((s.role || "").toUpperCase());
    const defaults = ["ADMIN", "JUDGE", "STAFF"] as EventStaffRole[];
    for (const d of defaults) existing.add(d);
    inferredRoleOptions = Array.from(existing) as EventStaffRole[];
  }

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-6 md:gap-8">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Judging panel & staff
          </h2>
          <div className="text-white/60 text-sm leading-relaxed max-w-3xl">
            Staff roles control who can manage settings, review submissions, and
            publish results. Participants stay in the Members tab.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {/* Current staff */}
          <div className={`flex flex-col ${card} p-6 md:p-8 gap-4`}>
            <div className="flex flex-col gap-1">
              <div className={titleText}>Current staff</div>
              <div className={subtleText}>
                Admins & judges for this event. ({staffData.staff.length})
              </div>
            </div>

            {staffData.staff.length === 0 ? (
              <div className={`${inner} p-4 flex flex-col gap-1`}>
                <div className="text-white/80 font-semibold">No staff yet</div>
                <div className="text-white/60 text-sm leading-relaxed">
                  Add staff from participants or invite by email/link.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {staffData.staff.map((s) => (
                  <div
                    key={s.userId}
                    className={`flex flex-col ${inner} p-4 gap-3`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="text-white font-semibold text-sm">
                          {s.user.name ?? "Unnamed user"}
                        </div>
                        <div className="text-white/60 text-xs">
                          {s.user.email}
                        </div>
                      </div>

                      <RolePill role={s.role} />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 text-sm outline-none"
                        value={s.role}
                        onChange={async (e) => {
                          const nextRole = e.target.value as EventStaffRole;
                          if (!onChangeRole) return;
                          await onChangeRole({
                            eventId,
                            userId: s.userId,
                            role: nextRole,
                          });
                        }}
                      >
                        {inferredRoleOptions.map((r) => (
                          <option key={r} value={r} className="bg-primary-950">
                            {r}
                          </option>
                        ))}
                      </select>

                      <button
                        className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 text-sm font-semibold hover:bg-white/10 transition-colors"
                        onClick={async () => {
                          if (!onRemoveStaff) return;
                          await onRemoveStaff({ eventId, userId: s.userId });
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add from participants */}
          <div className={`flex flex-col ${card} p-6 md:p-8 gap-4`}>
            <div className="flex flex-col gap-1">
              <div className={titleText}>Add from participants</div>
              <div className={subtleText}>
                Promote an existing participant to judge/admin without leaving
                settings.
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 text-sm outline-none"
              />

              <select
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 text-sm outline-none"
                value={addRole}
                onChange={(e) => setAddRole(e.target.value as EventStaffRole)}
              >
                {inferredRoleOptions.map((r) => (
                  <option key={r} value={r} className="bg-primary-950">
                    Add as {r}
                  </option>
                ))}
              </select>

              {filteredCandidates.length === 0 ? (
                <div className={`${inner} p-4 flex flex-col gap-1`}>
                  <div className="text-white/80 font-semibold">
                    No candidates
                  </div>
                  <div className="text-white/60 text-sm leading-relaxed">
                    Either everyone is already staff or there are no
                    participants yet.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredCandidates.slice(0, 10).map((c) => (
                    <div
                      key={c.userId}
                      className={`flex flex-col ${inner} p-4 gap-3`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <div className="text-white font-semibold text-sm">
                            {c.name ?? "Unnamed user"}
                          </div>
                          <div className="text-white/60 text-xs">{c.email}</div>
                          <div className="text-white/50 text-[11px]">
                            Source:{" "}
                            {c.source === "TEAM" ? "Team member" : "Unassigned"}
                          </div>
                        </div>

                        <button
                          className="px-4 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm hover:opacity-90 transition-opacity"
                          onClick={async () => {
                            if (!onAddStaff) return;
                            await onAddStaff({
                              eventId,
                              userId: c.userId,
                              role: addRole,
                            });
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredCandidates.length > 10 ? (
                    <div className="text-white/50 text-xs">
                      Showing first 10 results. Refine your search to narrow
                      down.
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Invites placeholder */}
            <div className={`flex flex-col ${inner} p-4 gap-2`}>
              <div className="text-white/80 font-semibold text-sm">
                Invites (next)
              </div>
              <div className="text-white/60 text-xs leading-relaxed">
                Add: invite-by-email, invite link creation, and join requests
                here.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventStaffSettings;
