"use server";

import { headers } from "next/headers";
import { OrgRole } from "@prisma/client";

import type { ActionState } from "@/src/lib/global_types";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { checkRateLimit } from "@/src/lib/rate-limiter";
import { parseServerActionResponse } from "@/src/lib/utils";
import { isAdminOrOwnerOfOrg, fetchOrgData } from "@/src/actions/org_actions";

export const fetchOrgMembers = async (
  orgSlug: string
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
    const isRateLimited = await checkRateLimit("fetchOrgMembers");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const org = await fetchOrgData(orgSlug);
    if (org.status === "ERROR" || !org.data) return org as ActionState;
    const orgId = (org.data as { id: string }).id;

    const hasPermissions = await isAdminOrOwnerOfOrg(orgId, session.user.id);
    if (hasPermissions.status === "ERROR") return hasPermissions;

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

async function assertOrgAdminOrOwner(orgSlug: string, userId: string) {
  const org = await fetchOrgData(orgSlug);
  if (org.status === "ERROR" || !org.data) throw new Error("ORG_NOT_FOUND");
  const orgId = (org.data as { id: string }).id;

  const membership = await prisma.orgMembership.findUnique({
    where: { orgId_userId: { orgId, userId } },
    select: { role: true },
  });
  if (!membership) throw new Error("NOT_AUTHORIZED");
  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    throw new Error("NOT_AUTHORIZED");
  }
  return { orgId, actorRole: membership.role };
}

export const updateOrgMemberRole = async (
  _prevState: ActionState,
  formData: FormData
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

    const orgSlug = (formData.get("orgSlug")?.toString() ?? "").trim();
    const memberId = (formData.get("memberId")?.toString() ?? "").trim();
    const nextRoleRaw = (formData.get("role")?.toString() ?? "").trim();

    if (!orgSlug || !memberId || !nextRoleRaw) {
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

    const { orgId, actorRole } = await assertOrgAdminOrOwner(
      orgSlug,
      session.user.id
    );

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
    if (target.role === "OWNER" && actorRole !== "OWNER") {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Only OWNER can edit an OWNER",
        data: null,
      }) as ActionState;
    }
    if (target.role === "ADMIN" && actorRole !== "OWNER") {
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
  formData: FormData
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

    const orgSlug = (formData.get("orgSlug")?.toString() ?? "").trim();
    const memberId = (formData.get("memberId")?.toString() ?? "").trim();

    if (!orgSlug || !memberId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Missing orgSlug or memberId",
        data: null,
      }) as ActionState;
    }

    const { orgId, actorRole } = await assertOrgAdminOrOwner(
      orgSlug,
      session.user.id
    );

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

    if (target.userId === session.user.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "You can't remove yourself",
        data: null,
      }) as ActionState;
    }

    if (target.role === "OWNER") {
      return parseServerActionResponse({
        status: "ERROR",
        error: "You can't remove the OWNER",
        data: null,
      }) as ActionState;
    }

    // Admin can't remove Admin by default; OWNER can.
    if (actorRole !== "OWNER" && target.role === "ADMIN") {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Only OWNER can remove an ADMIN",
        data: null,
      }) as ActionState;
    }

    await prisma.orgMembership.delete({ where: { id: memberId } });

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: { memberId },
    }) as ActionState;
  } catch (error) {
    console.error(error);
    const msg =
      error instanceof Error && error.message === "NOT_AUTHORIZED"
        ? "NOT_AUTHORIZED"
        : error instanceof Error && error.message === "ORG_NOT_FOUND"
          ? "Organization not found"
          : "Failed to remove member";
    return parseServerActionResponse({
      status: "ERROR",
      error: msg,
      data: null,
    }) as ActionState;
  }
};
