"use server";

import { headers } from "next/headers";
import { OrgMembership, OrgRole } from "@prisma/client";

import type { ActionState } from "@/src/lib/global_types";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { checkRateLimit } from "@/src/lib/rate-limiter";
import { parseServerActionResponse } from "@/src/lib/utils";
import { assertOrgAdminOrOwnerWithId } from "./org_actions";
import { updateTag } from "next/cache";

export const fetchOrgMembers = async (orgId: string): Promise<ActionState> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN",
        data: null,
      }) as ActionState;
    }
    const isRateLimited = await checkRateLimit("fetchOrgMembers");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const members = await prisma.orgMembership.findMany({
      where: { orgId },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        userId: true,
        role: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: members,
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to fetch org members",
      data: null,
    }) as ActionState;
  }
};

export const updateOrgMemberRole = async (
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN",
        data: null,
      }) as ActionState;
    }

    const isRateLimited = await checkRateLimit("updateOrgMemberRole");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const orgId = (formData.get("orgId")?.toString() ?? "").trim();
    const memberId = (formData.get("memberId")?.toString() ?? "").trim();
    const nextRoleRaw = (formData.get("role")?.toString() ?? "").trim();

    if (!orgId || !memberId || !nextRoleRaw) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Missing orgSlug, memberId, or role",
        data: null,
      }) as ActionState;
    }

    const allowedRoles = new Set<string>(["OWNER", "ADMIN", "MEMBER"]);
    if (!allowedRoles.has(nextRoleRaw)) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Invalid role",
        data: null,
      }) as ActionState;
    }

    const hasPermissions = await assertOrgAdminOrOwnerWithId(
      orgId,
      session.user.id,
    );
    console.log("hasPermissions", hasPermissions);

    if (hasPermissions.status === "ERROR") return hasPermissions as ActionState;
    const { userRole } = hasPermissions.data as {
      userRole: OrgRole;
    };
    const target = await prisma.orgMembership.findUnique({
      where: { id: memberId },
      select: { id: true, orgId: true, userId: true, role: true },
    });
    if (!target || target.orgId !== orgId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Member not found",
        data: null,
      }) as ActionState;
    }

    // Guardrails:
    // - Never allow setting OWNER via this action (ownership transfer is special).
    // - Never allow non-OWNER to edit an OWNER.
    // - Never allow changing your own role (keeps access stable).
    if (nextRoleRaw === "OWNER") {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Cannot transfer ownership here",
        data: null,
      }) as ActionState;
    }
    if (target.userId === session.user.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "You can't change your own role",
        data: null,
      }) as ActionState;
    }
    if (target.role === "OWNER" && userRole !== "OWNER") {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Only OWNER can edit an OWNER",
        data: null,
      }) as ActionState;
    }
    if (target.role === "ADMIN" && userRole !== "OWNER") {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Only OWNER can edit an ADMIN",
        data: null,
      }) as ActionState;
    }

    const updated = await prisma.orgMembership.update({
      where: { id: memberId },
      data: { role: nextRoleRaw as OrgRole },
    });

    updateTag(`org-members-role-${orgId}`);
    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: updated,
    }) as ActionState;
  } catch (error) {
    console.error(error);
    const msg =
      error instanceof Error && error.message === "NOT_AUTHORIZED"
        ? "NOT_AUTHORIZED"
        : error instanceof Error && error.message === "ORG_NOT_FOUND"
          ? "Organization not found"
          : "Failed to update member role";
    return parseServerActionResponse({
      status: "ERROR",
      error: msg,
      data: null,
    }) as ActionState;
  }
};

export const removeOrgMember = async (
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN",
        data: null,
      }) as ActionState;
    }

    const isRateLimited = await checkRateLimit("removeOrgMember");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const orgId = (formData.get("orgId")?.toString() ?? "").trim();
    const memberId = (formData.get("memberId")?.toString() ?? "").trim();

    if (!orgId || !memberId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Missing orgId or memberId",
        data: null,
      }) as ActionState;
    }

    const perms = await assertOrgAdminOrOwnerWithId(orgId, session.user.id);
    if (perms.status === "ERROR") return perms as ActionState;

    const { userRole } = perms.data as { userRole: OrgRole };

    const target = await prisma.orgMembership.findUnique({
      where: { id: memberId },
      select: { id: true, orgId: true, userId: true, role: true },
    });

    if (!target || target.orgId !== orgId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Member not found",
        data: null,
      }) as ActionState;
    }

    // can't remove yourself
    if (target.userId === session.user.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "You can't remove yourself",
        data: null,
      }) as ActionState;
    }

    // never remove OWNER here (do ownership transfer flow)
    if (target.role === "OWNER") {
      return parseServerActionResponse({
        status: "ERROR",
        error: "You can't remove the OWNER",
        data: null,
      }) as ActionState;
    }

    // ADMIN can only remove MEMBERS
    if (userRole === "ADMIN" && target.role !== "MEMBER") {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Only OWNER can remove an ADMIN",
        data: null,
      }) as ActionState;
    }

    await prisma.orgMembership.delete({ where: { id: memberId } });

    updateTag(`org-members-remove-${orgId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: { memberId },
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to remove member",
      data: null,
    }) as ActionState;
  }
};
