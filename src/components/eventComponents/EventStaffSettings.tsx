"use client";

import React, { useState } from "react";
import { toast } from "sonner";

import type {
  ActionState,
  Candidate,
  EventMembersData,
  EventStaffData,
  EventStaffMutations,
  EventStaffRole,
} from "@/src/lib/global_types";

import { uniqBy } from "@/src/lib/utils";
import CurrentStaffCard from "./CurrentStaffCard";
import AddFromParticipantsCard from "./AddFromParticipantsCard";

const DEFAULT_ROLE: EventStaffRole = "STAFF";

function normalizeRoleOptions(
  staffData: EventStaffData,
  roleOptions?: EventStaffRole[],
): EventStaffRole[] {
  if (roleOptions && roleOptions.length > 0) return roleOptions;

  const existing = new Set<string>();
  for (const s of staffData.staff)
    existing.add(String(s.role || "").toUpperCase());

  const defaults: EventStaffRole[] = ["ADMIN", "JUDGE", "STAFF"];
  for (const d of defaults) existing.add(d);

  return Array.from(existing) as EventStaffRole[];
}

function buildCandidates(
  staffData: EventStaffData,
  membersData: EventMembersData | null,
) {
  const staffUserIds = new Set<string>();
  for (const s of staffData.staff) staffUserIds.add(s.userId);

  let candidates: Candidate[] = [];
  if (!membersData) return candidates;

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

  return candidates;
}

function filterCandidates(candidates: Candidate[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return candidates;

  return candidates.filter((c) => {
    const n = (c.name || "").toLowerCase();
    const e = (c.email || "").toLowerCase();
    return n.includes(q) || e.includes(q);
  });
}

function toastFromAction(res: ActionState, fallback: string) {
  if (res.status === "ERROR") {
    toast.error("ERROR", { description: res.error || fallback });
    return false;
  }
  toast.success("SUCCESS", { description: "Updated." });
  return true;
}

export type EventStaffSettingsProps = {
  orgId: string;
  eventId: string;
  staffData: EventStaffData;
  membersData: EventMembersData | null;
  roleOptions?: EventStaffRole[];
  actions: EventStaffMutations;
};

const EventStaffSettings = ({
  orgId,
  eventId,
  staffData,
  membersData,
  roleOptions,
  actions,
}: EventStaffSettingsProps) => {
  const [query, setQuery] = useState("");
  const [addRole, setAddRole] = useState<EventStaffRole>(DEFAULT_ROLE);

  const inferredRoleOptions = normalizeRoleOptions(staffData, roleOptions);
  const candidates = buildCandidates(staffData, membersData);
  const filteredCandidates = filterCandidates(candidates, query);

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full px-5 py-10 md:py-14 gap-6 md:gap-8">
        <Header />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          <CurrentStaffCard
            orgId={orgId}
            eventId={eventId}
            staffData={staffData}
            roleOptions={inferredRoleOptions}
            actions={actions}
          />

          <AddFromParticipantsCard
            orgId={orgId}
            eventId={eventId}
            query={query}
            setQuery={setQuery}
            addRole={addRole}
            setAddRole={setAddRole}
            roleOptions={inferredRoleOptions}
            candidates={filteredCandidates}
            actions={actions}
          />
        </div>
      </div>
    </section>
  );
};

export default EventStaffSettings;

function Header() {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-2xl md:text-3xl font-semibold text-white">
        Judging panel & staff
      </h2>
      <div className="text-white/60 text-sm leading-relaxed max-w-3xl">
        Staff roles control who can manage settings, review submissions, and
        publish results. Participants stay in the Members tab.
      </div>
    </div>
  );
}
