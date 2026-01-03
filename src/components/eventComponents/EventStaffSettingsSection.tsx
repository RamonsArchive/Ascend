"use client";

import React, { useMemo, useState } from "react";
import type {
  EventMembersData,
  EventStaffData,
  EventStaffRole,
} from "@/src/lib/global_types";

import EventStaffSettings from "./EventStaffSettings"; // your existing staff manage UI (we’ll tweak role options)
import EventStaffInvitePanel from "./EventStaffInvitePanel";

const card =
  "rounded-3xl bg-white/4 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";

const tabsPill =
  "rounded-2xl bg-white/5 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] p-1 flex gap-1";

const tabBtn = (active: boolean) =>
  `px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
    active ? "bg-white text-primary-950" : "text-white/80 hover:bg-white/10"
  }`;

type ViewMode = "INVITES" | "STAFF";

const DEFAULT_STAFF_ROLES: EventStaffRole[] = [
  "ADMIN",
  "JUDGE",
  "STAFF",
] as EventStaffRole[];

const EventStaffSettingsSection = ({
  orgSlug,
  eventSlug,
  eventId,
  staffData,
  membersData,
  roleOptions,
}: {
  orgSlug: string;
  eventSlug: string;
  eventId: string;
  staffData: EventStaffData;
  membersData: EventMembersData | null;
  roleOptions?: EventStaffRole[];
}) => {
  const [view, setView] = useState<ViewMode>("INVITES");

  const roles = useMemo(() => {
    if (roleOptions?.length) return roleOptions;
    return DEFAULT_STAFF_ROLES;
  }, [roleOptions]);

  const cards = useMemo(
    () => [
      {
        key: "header",
        render: () => (
          <div className={`${card} p-6 md:p-8 flex flex-col gap-4`}>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl md:text-3xl font-semibold text-white">
                Event staff
              </h2>
              <p className="text-white/60 text-sm leading-relaxed max-w-3xl">
                Manage judges & staff for this event. Staff access is separate
                from participants.
              </p>
            </div>

            <div className={tabsPill}>
              <button
                className={tabBtn(view === "INVITES")}
                onClick={() => setView("INVITES")}
              >
                Invite staff
              </button>
              <button
                className={tabBtn(view === "STAFF")}
                onClick={() => setView("STAFF")}
              >
                Manage staff
              </button>
            </div>
          </div>
        ),
      },
      {
        key: "body",
        render: () =>
          view === "INVITES" ? (
            <EventStaffInvitePanel
              orgSlug={orgSlug}
              eventSlug={eventSlug}
              eventId={eventId}
              roleOptions={roles}
            />
          ) : (
            <EventStaffSettings
              eventId={eventId}
              staffData={staffData}
              membersData={membersData}
              roleOptions={roles}
            />
          ),
      },
    ],
    [view, orgSlug, eventSlug, eventId, roles, staffData, membersData]
  );

  return (
    <section className="w-full flex justify-center">
      <div className="w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 flex flex-col gap-5 md:gap-6">
        {cards.map((c) => (
          <React.Fragment key={c.key}>{c.render()}</React.Fragment>
        ))}
      </div>
    </section>
  );
};

export default EventStaffSettingsSection;
