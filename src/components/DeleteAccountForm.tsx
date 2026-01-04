"use client";

import React, { useActionState, useState } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/src/lib/global_types";
import { parseServerActionResponse } from "@/src/lib/utils";
import { deleteUserAccount } from "@/src/actions/user_actions";

const initialState: ActionState = { status: "INITIAL", error: "", data: null };

const DeleteAccountForm = ({ userEmail }: { userEmail: string | null }) => {
  const [confirmEmail, setConfirmEmail] = useState("");

  const submit = async (
    _state: ActionState,
    _fd: FormData
  ): Promise<ActionState> => {
    try {
      void _state;
      void _fd;

      const fd = new FormData();
      if (confirmEmail) fd.set("confirmEmail", confirmEmail);

      const res = await deleteUserAccount(initialState, fd);
      if (res.status === "ERROR") {
        toast.error("ERROR", {
          description: res.error || "Failed to delete account.",
        });
        return res;
      }

      toast.success("SUCCESS", { description: "Account deleted." });
      // you may redirect on server after delete (recommended)
      return res;
    } catch (e) {
      console.error(e);
      toast.error("ERROR", { description: "Failed to delete account." });
      return parseServerActionResponse({
        status: "ERROR",
        error: "Failed to delete account",
        data: null,
      });
    }
  };

  const [, formAction, isPending] = useActionState(submit, initialState);

  return (
    <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4 border border-red-500/20">
      <div className="flex flex-col gap-4">
        <div className="text-white text-xl font-semibold">Delete account</div>
        <div className="text-white/70 text-sm">
          This is permanent. Your user record will be removed.
        </div>

        {userEmail ? (
          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-white/75">
              Type your email to confirm
            </label>
            <input
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={userEmail}
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            />
          </div>
        ) : null}

        <form action={formAction} className="flex">
          <button
            type="submit"
            disabled={
              isPending || (userEmail ? confirmEmail.length === 0 : false)
            }
            className="w-full px-5 py-3 rounded-2xl cursor-pointer bg-red-500/90 hover:bg-red-500 text-white font-semibold text-sm md:text-base transition-colors disabled:opacity-60"
          >
            {isPending ? "Deleting..." : "Delete my account"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DeleteAccountForm;
