import React from "react";
import { staffRolePillClasses } from "@/src/lib/utils";

export const RolePill = ({ role }: { role: string }) => {
  return (
    <div
      className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${staffRolePillClasses(
        role
      )}`}
    >
      {role}
    </div>
  );
};

export default RolePill;
