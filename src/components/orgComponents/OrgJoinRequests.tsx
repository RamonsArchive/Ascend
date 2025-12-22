"use client";

import React, { useMemo, useState } from "react";
import OrgJoinRequestCard from "./OrgJoinRequestCard";
import type { OrgJoinRequestWithUser } from "@/src/lib/global_types";

const OrgJoinRequests = ({
  orgId,
  joinRequests,
}: {
  orgId: string;
  joinRequests: OrgJoinRequestWithUser[];
}) => {
  const [filter, setFilter] = useState<
    "ALL" | "PENDING" | "ACCEPTED" | "DECLINED"
  >("PENDING");

  const counts = useMemo(() => {
    const c = {
      ALL: joinRequests.length,
      PENDING: 0,
      ACCEPTED: 0,
      DECLINED: 0,
    };
    for (const jr of joinRequests) {
      if (jr.status === "PENDING") c.PENDING++;
      if (jr.status === "ACCEPTED") c.ACCEPTED++;
      if (jr.status === "DECLINED") c.DECLINED++;
    }
    return c;
  }, [joinRequests]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return joinRequests;
    return joinRequests.filter((j) => j.status === filter);
  }, [joinRequests, filter]);

  if (joinRequests.length === 0) {
    return (
      <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
        <div className="flex flex-col gap-2">
          <div className="text-white font-semibold">No membership requests</div>
          <div className="text-white/70 text-sm leading-relaxed">
            When users request access, they’ll show up here for review.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="text-white font-semibold">
                Membership requests
              </div>
              <div className="text-white/70 text-sm">
                Review and approve or decline access requests.
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setFilter("PENDING")}
                className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-semibold transition-colors ${
                  filter === "PENDING"
                    ? "bg-white text-primary-950 hover:opacity-90"
                    : "bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
                }`}
              >
                Pending ({counts.PENDING})
              </button>
              <button
                type="button"
                onClick={() => setFilter("ALL")}
                className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-semibold transition-colors ${
                  filter === "ALL"
                    ? "bg-white text-primary-950 hover:opacity-90"
                    : "bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
                }`}
              >
                All ({counts.ALL})
              </button>
              <button
                type="button"
                onClick={() => setFilter("ACCEPTED")}
                className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-semibold transition-colors ${
                  filter === "ACCEPTED"
                    ? "bg-white text-primary-950 hover:opacity-90"
                    : "bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
                }`}
              >
                Approved ({counts.ACCEPTED})
              </button>
              <button
                type="button"
                onClick={() => setFilter("DECLINED")}
                className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-semibold transition-colors ${
                  filter === "DECLINED"
                    ? "bg-white text-primary-950 hover:opacity-90"
                    : "bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
                }`}
              >
                Declined ({counts.DECLINED})
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-4">
              <div className="text-white/80 text-sm font-semibold">
                Nothing here
              </div>
              <div className="text-white/60 text-xs md:text-sm leading-relaxed">
                No requests match this filter.
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-6 md:gap-8">
        {filtered.map((jr) => (
          <OrgJoinRequestCard key={jr.id} orgId={orgId} joinRequest={jr} />
        ))}
      </div>
    </div>
  );
};

export default OrgJoinRequests;
