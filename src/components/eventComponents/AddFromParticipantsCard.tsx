import { EventStaffMutations, EventStaffRole } from "@/src/lib/global_types";

import { Candidate } from "@/src/lib/global_types";
import { card, titleText, subtleText } from "@/src/lib/utils";
import CandidateRow from "./CandidateRow";
import InvitesPlaceholder from "./InvitesPlaceholder";
import EmptyState from "./EmptyState";

const AddFromParticipantsCard = ({
  orgId,
  eventId,
  query,
  setQuery,
  addRole,
  setAddRole,
  roleOptions,
  candidates,
  actions,
}: {
  orgId: string;
  eventId: string;
  query: string;
  setQuery: (v: string) => void;
  addRole: EventStaffRole;
  setAddRole: (r: EventStaffRole) => void;
  roleOptions: EventStaffRole[];
  candidates: Candidate[];
  actions: EventStaffMutations;
}) => {
  return (
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
          {roleOptions.map((r) => (
            <option key={r} value={r} className="bg-primary-950">
              Add as {r}
            </option>
          ))}
        </select>

        {candidates.length === 0 ? (
          <EmptyState
            title="No candidates"
            body="Either everyone is already staff or there are no participants yet."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {candidates.slice(0, 10).map((c) => (
              <CandidateRow
                key={c.userId}
                orgId={orgId}
                eventId={eventId}
                candidate={c}
                role={addRole}
                actions={actions}
              />
            ))}

            {candidates.length > 10 ? (
              <div className="text-white/50 text-xs">
                Showing first 10 results. Refine your search to narrow down.
              </div>
            ) : null}
          </div>
        )}
      </div>

      <InvitesPlaceholder />
    </div>
  );
};
export default AddFromParticipantsCard;
