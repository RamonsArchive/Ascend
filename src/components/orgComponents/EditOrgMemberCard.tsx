"use client";

import React, { useMemo, useState, useActionState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { z } from "zod";
import { useRouter } from "next/navigation";

import type { ActionState } from "@/src/lib/global_types";
import { parseServerActionResponse } from "@/src/lib/utils";
import {
  removeOrgMember,
  updateOrgMemberRole,
} from "@/src/actions/org_members_actions";
import { org_members_data } from "@/src/constants/orgConstants/org_index";

// should be able to edit members role, if I'm admin or owner kick them out,
type Member = {
  id: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  createdAt: string;
  user: { id: string; name: string; email: string; image: string | null };
};

const initialState: ActionState = {
  status: "INITIAL",
  error: "",
  data: null,
};

function roleBadgeClasses(role: Member["role"]) {
  switch (role) {
    case "OWNER":
      return "bg-amber-400/15 text-amber-200 border-amber-400/20";
    case "ADMIN":
      return "bg-sky-400/15 text-sky-200 border-sky-400/20";
    case "MEMBER":
      return "bg-white/5 text-white/70 border-white/10";
    default:
      return "bg-white/5 text-white/70 border-white/10";
  }
}

const EditOrgMemberCard = ({
  orgSlug,
  member,
  currentUserId,
  viewerRole,
}: {
  orgSlug: string;
  member: Member;
  currentUserId: string;
  viewerRole: "OWNER" | "ADMIN";
}) => {
  const router = useRouter();
  const { card } = org_members_data;

  const [statusMessage, setStatusMessage] = useState("");
  const [errors, setErrors] = useState<{ role?: string }>({});

  const [role, setRole] = useState<Member["role"]>(member.role);

  const isSelf = member.userId === currentUserId;
  const canEditThisMember =
    !isSelf && (member.role === "MEMBER" || viewerRole === "OWNER");
  const canRemoveThisMember =
    !isSelf &&
    member.role !== "OWNER" &&
    (viewerRole === "OWNER" || member.role === "MEMBER");

  const avatarFallback = useMemo(() => {
    const n = (member.user.name ?? member.user.email ?? "U").trim();
    return n.slice(0, 1).toUpperCase();
  }, [member.user.name, member.user.email]);

  const submitRole = async (
    _state: ActionState,
    _fd: FormData
  ): Promise<ActionState> => {
    try {
      void _state;
      void _fd;
      setErrors({});

      if (!role) {
        throw new z.ZodError([
          { code: "custom", path: ["role"], message: "Role is required" },
        ]);
      }

      setStatusMessage("Saving…");
      const fd = new FormData();
      fd.set("orgSlug", orgSlug);
      fd.set("memberId", member.id);
      fd.set("role", role);

      const result = await updateOrgMemberRole(initialState, fd);
      if (result.status === "ERROR") {
        setStatusMessage(result.error || "Failed to update role.");
        toast.error("ERROR", { description: result.error });
        return result;
      }

      setStatusMessage("Saved.");
      toast.success("SUCCESS", { description: "Member role updated." });
      router.refresh();
      return result;
    } catch (error) {
      console.error(error);
      setStatusMessage("Please fix the highlighted fields.");

      if (error instanceof z.ZodError) {
        const fieldErrors = z.flattenError(error).fieldErrors as Record<
          string,
          string[]
        >;
        const formattedErrors: Record<string, string> = {};
        Object.keys(fieldErrors).forEach((key) => {
          formattedErrors[key] = fieldErrors[key]?.[0] || "";
        });
        setErrors(formattedErrors);
        toast.error("ERROR", {
          description: Object.values(formattedErrors)
            .filter(Boolean)
            .join(", "),
        });
        return parseServerActionResponse({
          status: "ERROR",
          error: Object.values(formattedErrors).filter(Boolean).join(", "),
          data: null,
        });
      }

      toast.error("ERROR", {
        description: "An error occurred while saving. Please try again.",
      });
      return parseServerActionResponse({
        status: "ERROR",
        error: "An error occurred while saving",
        data: null,
      });
    }
  };

  const [, roleAction, rolePending] = useActionState(submitRole, initialState);

  const removeMemberClick = async () => {
    const ok = window.confirm(`Remove ${member.user.name} from this org?`);
    if (!ok) return;

    try {
      setStatusMessage("Removing…");
      const fd = new FormData();
      fd.set("orgSlug", orgSlug);
      fd.set("memberId", member.id);

      const result = await removeOrgMember(initialState, fd);
      if (result.status === "ERROR") {
        setStatusMessage(result.error || "Failed to remove member.");
        toast.error("ERROR", { description: result.error });
        return;
      }

      setStatusMessage("Removed.");
      toast.success("SUCCESS", { description: "Member removed." });
      router.refresh();
    } catch (e) {
      console.error(e);
      setStatusMessage("Failed to remove member.");
      toast.error("ERROR", { description: "Failed to remove member." });
    }
  };

  return (
    <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 md:gap-6">
          <div className="flex items-start gap-3">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0">
              {member.user.image ? (
                <Image
                  src={member.user.image}
                  alt={`${member.user.name} avatar`}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-white/70">
                  {avatarFallback}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col xs:flex-row xs:items-center gap-2">
                <div className="text-white font-semibold leading-tight">
                  {member.user.name}
                </div>
                <div
                  className={`w-fit px-3 py-1 rounded-full border text-[11px] font-semibold tracking-wide ${roleBadgeClasses(
                    member.role
                  )}`}
                >
                  {member.role}
                </div>
              </div>
              <div className="text-white/60 text-xs break-all">
                {member.user.email}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={removeMemberClick}
            disabled={!canRemoveThisMember}
            className="w-full md:w-auto px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-xs md:text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {card.removeCta}
          </button>
        </div>

        <form action={roleAction} className="flex flex-col gap-6 md:gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs md:text-sm text-white/75">
                {card.roleLabel}
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Member["role"])}
                disabled={!canEditThisMember || member.role === "OWNER"}
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] cursor-pointer"
              >
                {member.role === "OWNER" ? (
                  <option value="OWNER">OWNER</option>
                ) : (
                  ["ADMIN", "MEMBER"].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))
                )}
              </select>
              <div className="text-white/50 text-xs">{card.roleHelp}</div>
              {errors.role ? (
                <p className="text-red-500 text-xs md:text-sm">{errors.role}</p>
              ) : null}
            </div>

            <div className="flex items-end justify-center md:justify-end">
              <button
                type="submit"
                disabled={
                  rolePending || !canEditThisMember || member.role === "OWNER"
                }
                className="w-full md:w-auto px-5 py-3 rounded-2xl cursor-pointer bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {rolePending ? "Saving..." : card.saveCta}
              </button>
            </div>
          </div>
        </form>

        {statusMessage ? (
          <div className="flex items-center justify-center w-full">
            <p className="text-white/90 text-xs md:text-sm text-center px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              {statusMessage}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default EditOrgMemberCard;
