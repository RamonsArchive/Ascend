"use server";

import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { checkRateLimit } from "@/src/lib/rate-limiter";
import { parseServerActionResponse } from "@/src/lib/utils";
import type { ActionState, EventStaffRole } from "@/src/lib/global_types";
import { updateTag } from "next/cache";
import {
  assertEventAdminOrOwnerWithId,
  getEventOwnerUserId,
} from "@/src/actions/event_actions"; // use your actual signature

const STAFF_ROLES: EventStaffRole[] = ["ADMIN", "JUDGE", "STAFF"];

function normalizeRole(role: unknown): string {
  return String(role ?? "")
    .trim()
    .toUpperCase();
}

function isStaffRole(role: string): role is EventStaffRole {
  return STAFF_ROLES.includes(role as EventStaffRole);
}

export const addEventStaffMember = async (args: {
  orgId: string;
  eventId: string;
  userId: string;
  role: EventStaffRole;
}): Promise<ActionState> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN",
        data: null,
      }) as ActionState;
    }

    const isRateLimited = await checkRateLimit("addEventStaffMember");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const perms = await assertEventAdminOrOwnerWithId(
      args.orgId,
      args.eventId,
      session.user.id
    );
    if (perms.status === "ERROR") return perms as ActionState;

    const roleStr = normalizeRole(args.role);
    if (!isStaffRole(roleStr)) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "ROLE_NOT_ALLOWED",
        data: null,
      }) as ActionState;
    }

    // ✅ Event owner is “special” (not managed via memberships UI)
    const ownerUserId = await getEventOwnerUserId(args.eventId);
    if (ownerUserId && args.userId === ownerUserId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "CANNOT_MODIFY_EVENT_OWNER_HERE",
        data: null,
      }) as ActionState;
    }

    const membership = await prisma.eventStaffMembership.upsert({
      where: { eventId_userId: { eventId: args.eventId, userId: args.userId } },
      update: { role: roleStr as EventStaffRole },
      create: {
        eventId: args.eventId,
        userId: args.userId,
        role: roleStr as EventStaffRole,
      },
      select: { userId: true, role: true },
    });

    updateTag(`event-staff-${args.eventId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: membership,
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to add staff member",
      data: null,
    }) as ActionState;
  }
};

export const changeEventStaffRole = async (args: {
  orgId: string;
  eventId: string;
  userId: string;
  role: EventStaffRole;
}): Promise<ActionState> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN",
        data: null,
      }) as ActionState;
    }

    const isRateLimited = await checkRateLimit("changeEventStaffRole");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const perms = await assertEventAdminOrOwnerWithId(
      args.orgId,
      args.eventId,
      session.user.id
    );
    if (perms.status === "ERROR") return perms as ActionState;

    const roleStr = normalizeRole(args.role);
    if (!isStaffRole(roleStr)) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "ROLE_NOT_ALLOWED",
        data: null,
      }) as ActionState;
    }

    const ownerUserId = await getEventOwnerUserId(args.eventId);
    if (ownerUserId && args.userId === ownerUserId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "CANNOT_MODIFY_EVENT_OWNER_HERE",
        data: null,
      }) as ActionState;
    }

    const existing = await prisma.eventStaffMembership.findUnique({
      where: { eventId_userId: { eventId: args.eventId, userId: args.userId } },
      select: { role: true },
    });

    if (!existing) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "STAFF_NOT_FOUND",
        data: null,
      }) as ActionState;
    }

    // ✅ don’t allow “no admins left”
    if (existing.role === "ADMIN" && roleStr !== "ADMIN") {
      const adminCount = await prisma.eventStaffMembership.count({
        where: { eventId: args.eventId, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return parseServerActionResponse({
          status: "ERROR",
          error: "MUST_HAVE_AT_LEAST_ONE_ADMIN",
          data: null,
        }) as ActionState;
      }
    }

    const updated = await prisma.eventStaffMembership.update({
      where: { eventId_userId: { eventId: args.eventId, userId: args.userId } },
      data: { role: roleStr as EventStaffRole },
      select: { userId: true, role: true },
    });

    updateTag(`event-staff-${args.eventId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: updated,
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to change staff role",
      data: null,
    }) as ActionState;
  }
};

export const removeEventStaffMember = async (args: {
  orgId: string;
  eventId: string;
  userId: string;
}): Promise<ActionState> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN",
        data: null,
      }) as ActionState;
    }

    const isRateLimited = await checkRateLimit("removeEventStaffMember");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const perms = await assertEventAdminOrOwnerWithId(
      args.orgId,
      args.eventId,
      session.user.id
    );
    if (perms.status === "ERROR") return perms as ActionState;

    const ownerUserId = await getEventOwnerUserId(args.eventId);
    if (ownerUserId && args.userId === ownerUserId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "CANNOT_MODIFY_EVENT_OWNER_HERE",
        data: null,
      }) as ActionState;
    }

    const existing = await prisma.eventStaffMembership.findUnique({
      where: { eventId_userId: { eventId: args.eventId, userId: args.userId } },
      select: { role: true },
    });

    if (!existing) {
      return parseServerActionResponse({
        status: "SUCCESS",
        error: "",
        data: { removed: false },
      }) as ActionState;
    }

    if (existing.role === "ADMIN") {
      const adminCount = await prisma.eventStaffMembership.count({
        where: { eventId: args.eventId, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return parseServerActionResponse({
          status: "ERROR",
          error: "MUST_HAVE_AT_LEAST_ONE_ADMIN",
          data: null,
        }) as ActionState;
      }
    }

    await prisma.eventStaffMembership.delete({
      where: { eventId_userId: { eventId: args.eventId, userId: args.userId } },
    });

    updateTag(`event-staff-${args.eventId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: { removed: true },
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to remove staff member",
      data: null,
    }) as ActionState;
  }
};
