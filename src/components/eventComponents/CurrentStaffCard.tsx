import {
  EventStaffData,
  EventStaffMutations,
  EventStaffRole,
} from "@/src/lib/global_types";
import { card, titleText, subtleText } from "@/src/lib/utils";
import StaffRow from "./StaffRow";

const EmptyState = ({ title, body }: { title: string; body: string }) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-white font-semibold text-sm">{title}</div>
      <div className="text-white/60 text-xs">{body}</div>
    </div>
  );
};

const CurrentStaffCard = ({
  orgId,
  eventId,
  staffData,
  roleOptions,
  actions,
}: {
  orgId: string;
  eventId: string;
  staffData: EventStaffData;
  roleOptions: EventStaffRole[];
  actions: EventStaffMutations;
}) => {
  return (
    <div className={`flex flex-col ${card} p-6 md:p-8 gap-4`}>
      <div className="flex flex-col gap-1">
        <div className={titleText}>Current staff</div>
        <div className={subtleText}>
          Admins & judges for this event. ({staffData.staff.length})
        </div>
      </div>

      {staffData.staff.length === 0 ? (
        <EmptyState
          title="No staff yet"
          body="Add staff from participants or invite by email/link."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {staffData.staff.map((s) => (
            <StaffRow
              key={s.userId}
              orgId={orgId}
              eventId={eventId}
              userId={s.userId}
              name={s.user.name}
              email={s.user.email}
              role={s.role}
              roleOptions={roleOptions}
              actions={actions}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CurrentStaffCard;
