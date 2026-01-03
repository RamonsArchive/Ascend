"use client";

import React, { useMemo, useState } from "react";
import type { EventStaffRole } from "@/src/lib/global_types";

import EventStaffInviteLinkForm from "./EventStaffInviteLinkForm";
import EventStaffEmailInviteForm from "./EventStaffEmailInviteForm";

const card =
  "rounded-3xl bg-white/4 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";

const inner =
  "rounded-2xl bg-white/5 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";

type InviteMode = "LINK" | "EMAIL";

const EventStaffInvitePanel = ({
  eventId,
  roleOptions,
}: {
  eventId: string;
  roleOptions: EventStaffRole[];
}) => {
  const [mode, setMode] = useState<InviteMode>("LINK");

  const cards = [
    {
      key: "switcher",
      render: () => (
        <div className={`${card} p-6 md:p-8 flex flex-col gap-4`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="text-white font-semibold text-lg md:text-xl">
                Invite staff
              </div>
              <div className="text-white/60 text-sm leading-relaxed">
                Send an invite by email or generate a shareable staff invite
                link.
              </div>
            </div>

            <div className={`${inner} p-1 flex gap-1`}>
              <button
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  mode === "LINK"
                    ? "bg-white text-primary-950"
                    : "text-white/80 hover:bg-white/10"
                }`}
                onClick={() => setMode("LINK")}
              >
                Link
              </button>
              <button
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  mode === "EMAIL"
                    ? "bg-white text-primary-950"
                    : "text-white/80 hover:bg-white/10"
                }`}
                onClick={() => setMode("EMAIL")}
              >
                Email
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "form",
      render: () =>
        mode === "LINK" ? (
          <EventStaffInviteLinkForm
            eventId={eventId}
            roleOptions={roleOptions}
          />
        ) : (
          <EventStaffEmailInviteForm
            eventId={eventId}
            roleOptions={roleOptions}
          />
        ),
    },
  ];

  return (
    <>
      {cards.map((c) => (
        <React.Fragment key={c.key}>{c.render()}</React.Fragment>
      ))}
    </>
  );
};

export default EventStaffInvitePanel;
