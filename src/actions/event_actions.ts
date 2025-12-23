import { prisma } from "../lib/prisma";
import { parseServerActionResponse } from "../lib/utils";
import type { ActionState, EventNavData } from "../lib/global_types";
import { checkRateLimit } from "../lib/rate-limiter";
import { isOrgOwner } from "./org_actions";

export const fetchEventData = async (
  orgSlug: string,
  eventSlug: string,
): Promise<ActionState> => {
  try {
    const isRateLimited = await checkRateLimit("fetchEventData");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    });

    if (!org?.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Organization not found",
        data: null,
      }) as ActionState;
    }

    const event = await prisma.event.findUnique({
      where: {
        orgId_slug: { orgId: org.id, slug: eventSlug }, // ✅ matches @@unique([orgId, slug])
      },
      select: {
        id: true,
        orgId: true,
        name: true,
        slug: true,
        status: true,
      },
    });

    if (!event) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Event not found",
        data: null,
      }) as ActionState;
    }

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: event satisfies EventNavData,
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to fetch event data",
      data: null,
    }) as ActionState;
  }
};

export const assertEventAdminOrOwner = async (
  orgSlug: string,
  eventSlug: string,
  userId: string,
): Promise<ActionState> => {
  try {
    const isRateLimited = await checkRateLimit("assertEventAdminOrOwner");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const eventRes = await fetchEventData(orgSlug, eventSlug);
    if (eventRes.status === "ERROR" || !eventRes.data) return eventRes;

    const event = eventRes.data as EventNavData;

    // ✅ Org OWNER override
    const orgOwnerResult = await isOrgOwner(event.orgId, userId);
    if (orgOwnerResult.status === "SUCCESS" && orgOwnerResult.data) {
      return parseServerActionResponse({
        status: "SUCCESS",
        error: "",
        data: { orgId: event.orgId, eventId: event.id, source: "ORG_OWNER" },
      }) as ActionState;
    }

    const staffMembership = await prisma.eventStaffMembership.findUnique({
      where: { eventId_userId: { eventId: event.id, userId } },
      select: { role: true },
    });

    if (!staffMembership) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "NOT_AUTHORIZED",
        data: null,
      }) as ActionState;
    }

    // EventStaffRole.ADMIN is the only “event owner/admin” role in your schema.
    // (Org OWNER does not automatically imply event ADMIN unless you model that separately.)
    if (staffMembership.role !== "ADMIN") {
      return parseServerActionResponse({
        status: "ERROR",
        error: "NOT_AUTHORIZED",
        data: null,
      }) as ActionState;
    }

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: {
        orgId: event.orgId,
        eventId: event.id,
        userRole: staffMembership.role,
      },
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to check permissions",
      data: null,
    }) as ActionState;
  }
};

export const assertEventAdminOrOwnerWithId = async (
  orgId: string,
  eventId: string,
  userId: string,
): Promise<ActionState> => {
  try {
    const isRateLimited = await checkRateLimit("assertEventAdminOrOwnerWithId");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    // ✅ Org OWNER override
    const orgOwnerResult = await isOrgOwner(orgId, userId);
    if (orgOwnerResult.status === "SUCCESS" && orgOwnerResult.data) {
      return parseServerActionResponse({
        status: "SUCCESS",
        error: "",
        data: { orgId, eventId, source: "ORG_OWNER" },
      }) as ActionState;
    }
    const staffMembership = await prisma.eventStaffMembership.findUnique({
      where: { eventId_userId: { eventId, userId } },
      select: { role: true },
    });

    if (!staffMembership || staffMembership.role !== "ADMIN") {
      return parseServerActionResponse({
        status: "ERROR",
        error: "NOT_AUTHORIZED",
        data: null,
      }) as ActionState;
    }

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: { orgId, eventId, userRole: staffMembership.role },
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to check permissions",
      data: null,
    }) as ActionState;
  }
};
