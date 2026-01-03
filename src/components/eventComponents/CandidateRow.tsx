import {
  Candidate,
  EventStaffMutations,
  EventStaffRole,
} from "@/src/lib/global_types";
import { useState } from "react";
import { inner } from "@/src/lib/utils";
import { toast } from "sonner";

const CandidateRow = ({
  orgId,
  eventId,
  candidate,
  role,
  actions,
}: {
  orgId: string;
  eventId: string;
  candidate: Candidate;
  role: EventStaffRole;
  actions: EventStaffMutations;
}) => {
  const [isWorking, setIsWorking] = useState(false);

  return (
    <div className={`flex flex-col ${inner} p-4 gap-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="text-white font-semibold text-sm">
            {candidate.name ?? "Unnamed user"}
          </div>
          <div className="text-white/60 text-xs">{candidate.email}</div>
          <div className="text-white/50 text-[11px]">
            Source: {candidate.source === "TEAM" ? "Team member" : "Unassigned"}
          </div>
        </div>

        <button
          className="px-4 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          disabled={isWorking}
          onClick={async () => {
            setIsWorking(true);
            const res = await actions.add({
              orgId,
              eventId,
              userId: candidate.userId,
              role,
            });
            console.log(res);
            if (res.status === "ERROR") {
              toast.error("ERROR", {
                description: res.error || "Failed to add staff member.",
              });
              setIsWorking(false);
              return;
            }
            toast.success("SUCCESS", {
              description: "Staff member added successfully.",
            });
            setIsWorking(false);
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
};
export default CandidateRow;
