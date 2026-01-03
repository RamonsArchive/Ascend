import { inner } from "@/src/lib/utils";
import React from "react";

const InvitesPlaceholder = () => {
  return (
    <div className={`flex flex-col ${inner} p-4 gap-2`}>
      <div className="text-white/80 font-semibold text-sm">Invites (next)</div>
      <div className="text-white/60 text-xs leading-relaxed">
        Add: invite-by-email, invite link creation, and join requests here.
      </div>
    </div>
  );
};

export default InvitesPlaceholder;
