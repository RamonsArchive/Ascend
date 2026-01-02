"use server";
import { prisma } from "../lib/prisma";
import {
  parseServerActionResponse,
  parseDate,
  safeDate,
  slugify,
  getMarkdownFromRich,
} from "@/src/lib/utils";
import type {
  ActionState,
  EventNavData,
  PublicEventListItem,
  EventCompleteData,
  TrackDraft,
  AwardDraft,
} from "../lib/global_types";
import { checkRateLimit } from "../lib/rate-limiter";
import { assertOrgOwnerSlug, isOrgOwner } from "./org_actions";
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
import {
  removeEventTeamClientSchema,
  removeEventTeamMemberClientSchema,
  removeEventParticipantClientSchema,
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
      data: event as EventNavData,
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

export const assertEventAdminOrOwnerWithIdAndSlug = async (
  orgId: string,
  eventSlug: string,
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
        data: { orgId, eventSlug, source: "ORG_OWNER" },
      }) as ActionState;
    }
    const staffMembership = await prisma.eventStaffMembership.findFirst({
      where: {
        userId,
        event: { orgId, slug: eventSlug },
      },
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
      data: { orgId, eventSlug, userRole: staffMembership.role },
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
  orgId: string,
  eventSlug: string
): Promise<ActionState> => {
  try {
    const isRateLimited = await checkRateLimit("fetchEventCompleteData");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const event = await prisma.event.findUnique({
      where: { orgId_slug: { orgId: orgId, slug: eventSlug } },
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
        rulesRich: true,
        rubricRich: true,
        locationAddress: true,
        locationName: true,
        locationNotes: true,
        locationMapUrl: true,

        maxTeamSize: true,
        allowSelfJoinRequests: true,
        lockTeamChangesAtStart: true,
        requireImages: true,
        requireVideoDemo: true,

        coverKey: true,

        org: {
          select: { id: true, name: true, slug: true, logoKey: true },
        },

        tracks: {
          select: {
            id: true,
            name: true,
            blurb: true,
            order: true,
          },
        },
        awards: {
          select: {
            id: true,
            name: true,
            blurb: true,
            allowMultipleWinners: true,
            order: true,
          },
        },

        sponsors: {
          select: {
            id: true,
            eventId: true,
            sponsorId: true,
            tier: true,
            isActive: true,
            displayName: true,
            blurb: true,
            order: true,
            logoKey: true,
            sponsor: {
              select: {
                id: true,
                name: true,
                slug: true,
                websiteKey: true,
                description: true,
                logoKey: true,
                coverKey: true,
              },
            },
          },
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
      rulesMarkdown: getMarkdownFromRich(event.rulesRich),
      rubricMarkdown: getMarkdownFromRich(event.rubricRich),
      tracks: event.tracks.map((track) => ({
        clientId: track.id,
        name: track.name,
        blurb: track.blurb ?? "",
        order: track.order.toString(),
      })),
      awards: event.awards.map((award) => ({
        clientId: award.id,
        name: award.name,
        blurb: award.blurb ?? "",
        allowMultipleWinners: award.allowMultipleWinners,
        order: award.order.toString(),
      })),
      sponsors: event.sponsors.map((sponsor) => ({
        ...sponsor,
        kind: "EVENT",
        eventId: sponsor.eventId,
      })),
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

export const fetchEventStaffData = async (orgId: string, eventSlug: string) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN TO FETCH EVENT STAFF DATA",
        data: null,
      }) as ActionState;
    }
    const isRateLimited = await checkRateLimit("fetchEventStaffData");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const staff = await prisma.eventStaffMembership.findMany({
      where: { event: { orgId: orgId, slug: eventSlug } },
      select: {
        userId: true,
        role: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });
    if (!staff) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Event staff not found",
        data: null,
      }) as ActionState;
    }
    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: staff,
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to fetch event staff data",
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

export const fetchEventMembersData = async (
  orgId: string,
  eventSlug: string
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

    const isRateLimited = await checkRateLimit("fetchEventMembersAdminData");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const teams = await prisma.team.findMany({
      where: { event: { orgId: orgId, slug: eventSlug } },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        eventId: true,
        name: true,
        track: {
          select: {
            id: true,
            name: true,
          },
        },
        lookingForMembers: true,
        createdAt: true,
        members: {
          orderBy: { role: "asc" }, // LEADER first if enum orders that way; else sort client-side
          select: {
            id: true,
            userId: true,
            role: true,
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    });

    const unassigned = await prisma.eventParticipant.findMany({
      where: {
        event: { orgId, slug: eventSlug },
        user: {
          teamMembers: {
            none: {
              team: { event: { orgId, slug: eventSlug } },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        userId: true,
        status: true,
        lookingForTeam: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: {
        event: { orgId: orgId, slug: eventSlug },
        teams: teams.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
        })),
        unassigned,
      },
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to load members",
      data: null,
    }) as ActionState;
  }
};

export const removeEventTeam = async (
  orgSlug: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id)
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN",
        data: null,
      }) as ActionState;

    const isRateLimited = await checkRateLimit("removeEventTeam");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const parsed = await removeEventTeamClientSchema.parseAsync({
      eventId: formData.get("eventId")?.toString() ?? "",
      teamId: formData.get("teamId")?.toString() ?? "",
    });

    const perms = await assertEventAdminOrOwnerWithId(
      orgSlug,
      parsed.eventId,
      session.user.id
    );
    if (perms.status === "ERROR") return perms as ActionState;

    // deleting team cascades TeamMember via onDelete: Cascade on TeamMember.team relation
    await prisma.team.delete({ where: { id: parsed.teamId } });

    updateTag(`event-members-${parsed.eventId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: { teamId: parsed.teamId },
    }) as ActionState;
  } catch (e) {
    console.error(e);
    if (e instanceof z.ZodError) {
      const msg = Object.values(z.flattenError(e).fieldErrors)
        .flat()
        .filter(Boolean)
        .join(", ");
      return parseServerActionResponse({
        status: "ERROR",
        error: msg || "Invalid input",
        data: null,
      }) as ActionState;
    }
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to delete team",
      data: null,
    }) as ActionState;
  }
};

export const removeEventTeamMember = async (
  orgSlug: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id)
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN",
        data: null,
      }) as ActionState;

    const isRateLimited = await checkRateLimit("removeEventTeamMember");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const parsed = await removeEventTeamMemberClientSchema.parseAsync({
      eventId: formData.get("eventId")?.toString() ?? "",
      teamMemberId: formData.get("teamMemberId")?.toString() ?? "",
    });

    const perms = await assertEventAdminOrOwnerWithId(
      orgSlug,
      parsed.eventId,
      session.user.id
    );
    if (perms.status === "ERROR") return perms as ActionState;

    await prisma.teamMember.delete({ where: { id: parsed.teamMemberId } });

    updateTag(`event-members-${parsed.eventId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: { teamMemberId: parsed.teamMemberId },
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to remove member from team",
      data: null,
    }) as ActionState;
  }
};

export const removeEventParticipant = async (
  orgSlug: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id)
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN",
        data: null,
      }) as ActionState;

    const isRateLimited = await checkRateLimit("removeEventParticipant");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const parsed = await removeEventParticipantClientSchema.parseAsync({
      eventId: formData.get("eventId")?.toString() ?? "",
      participantId: formData.get("participantId")?.toString() ?? "",
    });

    const perms = await assertEventAdminOrOwner(
      orgSlug,
      parsed.eventId,
      session.user.id
    );
    if (perms.status === "ERROR") return perms as ActionState;

    // also remove any TeamMember rows for that user in this event
    const participant = await prisma.eventParticipant.findUnique({
      where: { id: parsed.participantId },
      select: { userId: true, eventId: true },
    });
    if (!participant || participant.eventId !== parsed.eventId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "PARTICIPANT_NOT_FOUND",
        data: null,
      }) as ActionState;
    }

    await prisma.$transaction(async (tx) => {
      await tx.teamMember.deleteMany({
        where: { eventId: parsed.eventId, userId: participant.userId },
      });
      await tx.eventParticipant.delete({ where: { id: parsed.participantId } });
    });

    updateTag(`event-members-${parsed.eventId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: { participantId: parsed.participantId },
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to remove participant",
      data: null,
    }) as ActionState;
  }
};

export const fetchEventTracks = async (
  orgSlug: string,
  eventSlug: string
): Promise<ActionState> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN TO FETCH EVENT TRACKS",
        data: null,
      }) as ActionState;
    }
    const perms = await assertEventAdminOrOwner(
      orgSlug,
      eventSlug,
      session.user.id
    );
    if (perms.status === "ERROR") return perms as ActionState;

    const tracks = await prisma.eventTrack.findMany({
      where: { event: { org: { slug: orgSlug }, slug: eventSlug } },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        blurb: true,
        order: true,
      },
    });

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: tracks,
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to fetch event tracks",
      data: null,
    }) as ActionState;
  }
};

export const fetchEventAwards = async (
  orgSlug: string,
  eventSlug: string
): Promise<ActionState> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN TO FETCH EVENT AWARDS",
        data: null,
      }) as ActionState;
    }
    const perms = await assertEventAdminOrOwner(
      orgSlug,
      eventSlug,
      session.user.id
    );
    if (perms.status === "ERROR") return perms as ActionState;

    const awards = await prisma.eventAward.findMany({
      where: { event: { org: { slug: orgSlug }, slug: eventSlug } },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        blurb: true,
        allowMultipleWinners: true,
        order: true,
      },
    });

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: awards,
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to fetch event awards",
      data: null,
    }) as ActionState;
  }
};

export const updateEventTracks = async (
  eventId: string,
  orgId: string,
  tracks: TrackDraft[]
): Promise<ActionState> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN TO UPDATE EVENT TRACKS",
        data: null,
      }) as ActionState;
    }
    const isRateLimited = await checkRateLimit("updateEventTracks");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const perms = await assertEventAdminOrOwnerWithId(
      orgId,
      eventId,
      session.user.id
    );
    if (perms.status === "ERROR") return perms as ActionState;

    await prisma.eventTrack.deleteMany({ where: { eventId } });
    await prisma.eventTrack.createMany({
      data: tracks.map((track) => ({
        eventId,
        name: track.name,
        blurb: track.blurb ?? "",
        order: parseInt(track.order),
      })),
    });

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: { tracks },
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to update event tracks",
      data: null,
    }) as ActionState;
  }
};

export const updateEventAwards = async (
  eventId: string,
  orgId: string,
  awards: AwardDraft[]
): Promise<ActionState> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN TO UPDATE EVENT AWARDS",
        data: null,
      }) as ActionState;
    }
    const isRateLimited = await checkRateLimit("updateEventAwards");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const perms = await assertEventAdminOrOwnerWithId(
      orgId,
      eventId,
      session.user.id
    );
    if (perms.status === "ERROR") return perms as ActionState;

    await prisma.eventAward.deleteMany({ where: { eventId } });
    await prisma.eventAward.createMany({
      data: awards.map((award) => ({
        eventId,
        name: award.name,
        blurb: award.blurb ?? "",
        allowMultipleWinners: award.allowMultipleWinners,
        order: parseInt(award.order),
      })),
    });

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: { awards },
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to update event awards",
      data: null,
    }) as ActionState;
  }
};

export const deleteEvent = async (
  orgSlug: string,
  eventId: string
): Promise<ActionState> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN TO DELETE EVENT",
        data: null,
      }) as ActionState;
    }
    const isRateLimited = await checkRateLimit("deleteEvent");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const perms = await assertOrgOwnerSlug(orgSlug, session.user.id);
    if (perms.status === "ERROR") return perms as ActionState;

    await prisma.event.delete({
      where: {
        id: eventId,
        org: { slug: orgSlug }, // ✅ ensures correct org
      },
    });

    updateTag(`event-${eventId}`);
    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: { eventId },
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to delete event",
      data: null,
    }) as ActionState;
  }
};
