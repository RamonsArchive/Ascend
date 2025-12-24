import { prisma } from "../lib/prisma";
import {
  parseServerActionResponse,
  parseDate,
  safeDate,
  slugify,
} from "@/src/lib/utils";
import type {
  ActionState,
  EventNavData,
  PublicEventListItem,
  EventCompleteData,
} from "../lib/global_types";
import { checkRateLimit } from "../lib/rate-limiter";
import { isOrgOwner } from "./org_actions";
import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";
import { finalizeEventImageFromTmp } from "@/src/lib/s3-upload";
import { z } from "zod";
import { EventType, EventVisibility, EventJoinMode } from "@prisma/client";
import { updateTag } from "next/cache";
import {
  updateEventDetailsServerSchema,
  updateEventTeamSettingsClientSchema,
} from "@/src/lib/validation";
export const fetchAllEvents = async (
  limit: number = 12
): Promise<ActionState> => {
  try {
    const isRateLimited = await checkRateLimit("fetchAllEvents");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        slug: true,
        name: true,
        heroTitle: true,
        heroSubtitle: true,
        type: true,
        joinMode: true,
        startAt: true,
        endAt: true,
        createdAt: true, // ✅ add this
        registrationClosesAt: true,
        coverKey: true,
        orgId: true,
        org: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoKey: true,
          },
        },
      },
    });

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: events satisfies PublicEventListItem[],
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to fetch all events",
      data: null,
    }) as ActionState;
  }
};

export const fetchEventData = async (
  orgSlug: string,
  eventSlug: string
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
  userId: string
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
  userId: string
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

export const fetchAllOrgEvents = async (orgSlug: string) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN TO FETCH ALL ORG EVENTS",
        data: null,
      }) as ActionState;
    }

    const isRateLimited = await checkRateLimit("fetchAllOrgEvents");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const events = await prisma.event.findMany({
      where: { org: { slug: orgSlug } },
      orderBy: { createdAt: "desc" },
    });

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: events,
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to fetch all org events",
      data: null,
    }) as ActionState;
  }
};

export const fetchEventCompleteData = async (
  orgSlug: string,
  eventSlug: string
): Promise<ActionState> => {
  try {
    const isRateLimited = await checkRateLimit("fetchEventCompleteData");
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
      where: { orgId_slug: { orgId: org.id, slug: eventSlug } },
      select: {
        id: true,
        orgId: true,
        name: true,
        slug: true,
        status: true,

        type: true,
        visibility: true,
        joinMode: true,

        heroTitle: true,
        heroSubtitle: true,

        registrationOpensAt: true,
        registrationClosesAt: true,
        startAt: true,
        endAt: true,
        submitDueAt: true,

        maxTeamSize: true,
        allowSelfJoinRequests: true,
        lockTeamChangesAtStart: true,
        requireImages: true,
        requireVideoDemo: true,

        coverKey: true,

        org: {
          select: { id: true, name: true, slug: true, logoKey: true },
        },

        _count: {
          select: {
            teams: true,
            submissions: true,
            staffMemberships: true,
            participants: true, // if your participant model name differs, update this
          },
        },
      },
    });

    if (!event) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Event not found",
        data: null,
      }) as ActionState;
    }

    const data: EventCompleteData = {
      ...event,
      _count: {
        teams: event._count.teams,
        submissions: event._count.submissions,
        staff: event._count.staffMemberships,
        members: event._count.participants,
      },
    };

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data,
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

export const updateEventDetails = async (
  _state: ActionState,
  fd: FormData
): Promise<ActionState> => {
  try {
    void _state;

    const isRateLimited = await checkRateLimit("updateEventDetails");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id ?? "";
    if (!userId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Not authenticated",
        data: null,
      }) as ActionState;
    }

    const raw = {
      orgId: String(fd.get("orgId") ?? ""),
      eventId: String(fd.get("eventId") ?? ""),
      name: String(fd.get("name") ?? ""),
      slug: String(fd.get("slug") ?? ""),

      heroTitle: fd.get("heroTitle") ? String(fd.get("heroTitle")) : undefined,
      heroSubtitle: fd.get("heroSubtitle")
        ? String(fd.get("heroSubtitle"))
        : undefined,

      type: String(fd.get("type") ?? ""),
      visibility: String(fd.get("visibility") ?? ""),
      joinMode: String(fd.get("joinMode") ?? ""),

      registrationOpensAt: fd.get("registrationOpensAt")
        ? String(fd.get("registrationOpensAt"))
        : undefined,
      registrationClosesAt: fd.get("registrationClosesAt")
        ? String(fd.get("registrationClosesAt"))
        : undefined,
      startAt: fd.get("startAt") ? String(fd.get("startAt")) : undefined,
      endAt: fd.get("endAt") ? String(fd.get("endAt")) : undefined,
      submitDueAt: fd.get("submitDueAt")
        ? String(fd.get("submitDueAt"))
        : undefined,

      maxTeamSize: Number(fd.get("maxTeamSize") ?? 5),

      allowSelfJoinRequests:
        String(fd.get("allowSelfJoinRequests") ?? "0") === "1",
      lockTeamChangesAtStart:
        String(fd.get("lockTeamChangesAtStart") ?? "0") === "1",
      requireImages: String(fd.get("requireImages") ?? "0") === "1",
      requireVideoDemo: String(fd.get("requireVideoDemo") ?? "0") === "1",

      coverTmpKey: fd.get("coverTmpKey")
        ? String(fd.get("coverTmpKey"))
        : undefined,
      removeCover: String(fd.get("removeCover") ?? "0") === "1",
    };

    // normalize slug if user left it blank
    if (!raw.slug) raw.slug = slugify(raw.name);

    const parsed = updateEventDetailsServerSchema.parse(raw);

    const perm = await assertEventAdminOrOwnerWithId(
      parsed.orgId,
      parsed.eventId,
      userId
    );
    if (perm.status === "ERROR") return perm as ActionState;

    // enforce unique slug within org
    const existing = await prisma.event.findFirst({
      where: {
        orgId: parsed.orgId,
        slug: parsed.slug,
        NOT: { id: parsed.eventId },
      },
      select: { id: true },
    });
    if (existing) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Another event in this org already uses that slug.",
        data: null,
      }) as ActionState;
    }

    const regOpen = safeDate(parseDate(parsed.registrationOpensAt));
    const regClose = safeDate(parseDate(parsed.registrationClosesAt));
    const startAt = safeDate(parseDate(parsed.startAt));
    const endAt = safeDate(parseDate(parsed.endAt));
    const submitDueAt = safeDate(parseDate(parsed.submitDueAt));

    if (regOpen && regClose && regOpen > regClose) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Registration close must be after open.",
        data: null,
      }) as ActionState;
    }
    if (startAt && endAt && startAt > endAt) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Event end must be after start.",
        data: null,
      }) as ActionState;
    }

    let nextCoverKey: string | null | undefined = undefined;

    if (parsed.removeCover) {
      nextCoverKey = null;
    } else if (parsed.coverTmpKey) {
      const finalKey = await finalizeEventImageFromTmp({
        eventId: parsed.eventId,
        kind: "cover",
        tmpKey: parsed.coverTmpKey,
      });
      nextCoverKey = finalKey;
    }

    const updated = await prisma.event.update({
      where: { id: parsed.eventId },
      data: {
        name: parsed.name,
        slug: parsed.slug,
        heroTitle: parsed.heroTitle ?? "",
        heroSubtitle: parsed.heroSubtitle ?? null,
        type: parsed.type as EventType,
        visibility: parsed.visibility as EventVisibility,
        joinMode: parsed.joinMode as EventJoinMode,
        registrationOpensAt: regOpen,
        registrationClosesAt: regClose,
        startAt,
        endAt,
        submitDueAt,
        maxTeamSize: parsed.maxTeamSize,
        allowSelfJoinRequests: parsed.allowSelfJoinRequests,
        lockTeamChangesAtStart: parsed.lockTeamChangesAtStart,
        requireImages: parsed.requireImages,
        requireVideoDemo: parsed.requireVideoDemo,
        ...(nextCoverKey !== undefined ? { coverKey: nextCoverKey } : {}),
      },
      select: { id: true, slug: true, name: true },
    });

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: updated,
    }) as ActionState;
  } catch (error) {
    console.error(error);

    if (error instanceof z.ZodError) {
      const msg = Object.values(z.flattenError(error).fieldErrors)
        .flat()
        .filter(Boolean)
        .join(", ");
      return parseServerActionResponse({
        status: "ERROR",
        error: msg || "Invalid form fields",
        data: null,
      }) as ActionState;
    }

    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to update event details",
      data: null,
    }) as ActionState;
  }
};

/** INVITES (link + email) **/

export const updateEventTeamSettings = async (
  _prev: ActionState,
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

    const isRateLimited = await checkRateLimit("updateEventTeamSettings");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const payload = {
      eventId: (formData.get("eventId")?.toString() ?? "").trim(),
      maxTeamSize: formData.get("maxTeamSize")?.toString() ?? "",
      lockTeamChangesAtStart:
        formData.get("lockTeamChangesAtStart")?.toString() ?? "false",
      allowSelfJoinRequests:
        formData.get("allowSelfJoinRequests")?.toString() ?? "false",
    };

    const parsed =
      await updateEventTeamSettingsClientSchema.safeParseAsync(payload);
    if (!parsed.success) {
      return parseServerActionResponse({
        status: "ERROR",
        error: parsed.error.issues[0]?.message ?? "Invalid fields",
        data: null,
      }) as ActionState;
    }

    const {
      eventId,
      maxTeamSize,
      lockTeamChangesAtStart,
      allowSelfJoinRequests,
    } = parsed.data;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, orgId: true },
    });

    if (!event) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "EVENT_NOT_FOUND",
        data: null,
      }) as ActionState;
    }

    const perms = await assertEventAdminOrOwnerWithId(
      event.orgId,
      event.id,
      session.user.id
    );
    if (perms.status === "ERROR") return perms as ActionState;

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        maxTeamSize,
        lockTeamChangesAtStart,
        allowSelfJoinRequests,
      },
      select: {
        id: true,
        maxTeamSize: true,
        lockTeamChangesAtStart: true,
        allowSelfJoinRequests: true,
      },
    });

    updateTag(`event-${eventId}`);
    updateTag(`event-team-settings-${eventId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: updated,
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to update team settings",
      data: null,
    }) as ActionState;
  }
};
