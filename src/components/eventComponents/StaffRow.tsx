import { EventStaffMutations, EventStaffRole } from "@/src/lib/global_types";
import { useState } from "react";
import RolePill from "../RolePill";
import { toast } from "sonner";

const inner =
  "rounded-2xl bg-white/5 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";

const StaffRow = ({
  orgId,
  eventId,
  userId,
  name,
  email,
  role,
  roleOptions,
  actions,
}: {
  orgId: string;
  eventId: string;
  userId: string;
  name: string | null;
  email: string;
  role: EventStaffRole;
  roleOptions: EventStaffRole[];
  actions: EventStaffMutations;
}) => {
  const [isWorking, setIsWorking] = useState(false);

  return (
    <div className={`flex flex-col ${inner} p-4 gap-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="text-white font-semibold text-sm">
            {name ?? "Unnamed user"}
          </div>
          <div className="text-white/60 text-xs">{email}</div>
        </div>

        <RolePill role={role} />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <select
          className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 text-sm outline-none disabled:opacity-60"
          value={role}
          disabled={isWorking}
          onChange={async (e) => {
            const nextRole = e.target.value as EventStaffRole;
            setIsWorking(true);
            const res = await actions.changeRole({
              orgId,
              eventId,
              userId,
              role: nextRole,
            });
            console.log(res);
            if (res.status === "ERROR") {
              toast.error("ERROR", {
                description: res.error || "Failed to change role.",
              });
              setIsWorking(false);
              return;
            }
            toast.success("SUCCESS", {
              description: "Role changed successfully.",
            });
            setIsWorking(false);
          }}
        >
          {roleOptions.map((r) => (
            <option key={r} value={r} className="bg-primary-950">
              {r}
            </option>
          ))}
        </select>

        <button
          className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 text-sm font-semibold hover:bg-white/10 transition-colors disabled:opacity-60"
          disabled={isWorking}
          onClick={async () => {
            setIsWorking(true);
            const res = await actions.remove({ orgId, eventId, userId });
            console.log(res);
            if (res.status === "ERROR") {
              toast.error("ERROR", {
                description: res.error || "Failed to change role.",
              });
              setIsWorking(false);
              return;
            }
            toast.success("SUCCESS", {
              description: "Staff member removed successfully.",
            });
            setIsWorking(false);
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export default StaffRow;
