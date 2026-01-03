"use server";

import { headers } from "next/headers";
import { updateTag } from "next/cache";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { checkRateLimit } from "@/src/lib/rate-limiter";
import { getBaseUrl, parseServerActionResponse } from "@/src/lib/utils";
import type { ActionState } from "@/src/lib/global_types";
import { InviteStatus, EventStaffRole } from "@prisma/client";
import {
  normalizeEmail,
  makeToken,
  parseOptionalInt,
  parseOptionalDateFromMinutes,
} from "@/src/lib/utils";
import { assertEventAdminOrOwnerWithId } from "@/src/actions/event_actions";

// validation (you’ll want staff-specific schemas; names below match your pattern)
import {
  createEventStaffInviteEmailServerSchema,
  createEventStaffInviteLinkServerSchema,
} from "@/src/lib/validation";

// email template (create later, same style as org invite)
import { SendEventStaffEmailInvite } from "@/src/emails/SendEventStaffEmailInvite";

const STAFF_ROLES: EventStaffRole[] = ["ADMIN", "JUDGE", "STAFF"];

function normalizeRole(role: unknown): EventStaffRole | null {
  const r = String(role ?? "")
    .trim()
    .toUpperCase();
  if (STAFF_ROLES.includes(r as EventStaffRole)) return r as EventStaffRole;
  return null;
}

/**
 * 1) Create EVENT STAFF email invite
 * Creates EventStaffInvite, emails a join URL.
 */
export const createEventStaffEmailInvite = async (
  _prev: ActionState,
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

    const isRateLimited = await checkRateLimit("createEventStaffEmailInvite");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const payload = {
      eventId: (formData.get("eventId")?.toString() ?? "").trim(),
      email: (formData.get("email")?.toString() ?? "").trim(),
      role: (formData.get("role")?.toString() ?? "").trim(),
      message: (formData.get("message")?.toString() ?? "").trim() || null,
      minutesToExpire: (
        formData.get("minutesToExpire")?.toString() ?? ""
      ).trim()
        ? (formData.get("minutesToExpire")?.toString() ?? "").trim()
        : null,
    };

    const parsed = createEventStaffInviteEmailServerSchema.safeParse(payload);
    if (!parsed.success) {
      return parseServerActionResponse({
        status: "ERROR",
        error: parsed.error.issues[0]?.message ?? "Invalid fields",
        data: null,
      }) as ActionState;
    }

    const { eventId, email, role, message, minutesToExpire } = parsed.data;

    const normalized = normalizeEmail(email);
    const normalizedRole = normalizeRole(role);
    if (!normalizedRole) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "ROLE_NOT_ALLOWED",
        data: null,
      }) as ActionState;
    }

    const oneWeekFromNow = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    const expiresAt = parseOptionalDateFromMinutes(
      minutesToExpire?.toString() ?? oneWeekFromNow.toISOString(),
    );

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        slug: true,
        orgId: true,
        org: { select: { slug: true, name: true } },
      },
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
      session.user.id,
    );
    if (perms.status === "ERROR") return perms as ActionState;

    // If user exists, block if already staff member
    const existingUser = await prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true },
    });

    if (existingUser) {
      const alreadyStaff = await prisma.eventStaffMembership.findUnique({
        where: { eventId_userId: { eventId, userId: existingUser.id } },
        select: { id: true },
      });
      if (alreadyStaff) {
        return parseServerActionResponse({
          status: "ERROR",
          error: "User is already staff for this event",
          data: null,
        }) as ActionState;
      }
    }

    // Existing pending invite?
    const pending = await prisma.eventStaffInvite.findFirst({
      where: { eventId, email: normalized, status: InviteStatus.PENDING },
      select: { id: true },
    });
    if (pending) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "An invite is already pending for this email",
        data: null,
      }) as ActionState;
    }

    const token = makeToken(24);

    const invite = await prisma.eventStaffInvite.create({
      data: {
        eventId,
        email: normalized,
        role: normalizedRole,
        token,
        status: InviteStatus.PENDING,
        message,
        expiresAt: expiresAt ?? undefined,
        createdByUserId: session.user.id,
      },
      select: { id: true, token: true, expiresAt: true },
    });

    const baseUrl = getBaseUrl();
    const joinUrl = `${baseUrl}/app/orgs/${event.org.slug}/events/${event.slug}/eventstaff/join/${invite.token}`;

    await SendEventStaffEmailInvite({
      toEmail: normalized,
      inviterName: session.user.name ?? null,
      orgName: event.org.name,
      eventName: event.name,
      role: normalizedRole,
      joinUrl,
      message,
      expiresAt: invite.expiresAt ?? null,
    });
    updateTag(`event-staff-email-invites-${eventId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: { inviteId: invite.id },
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to create staff email invite",
      data: null,
    }) as ActionState;
  }
};

/**
 * 2) Create SHAREABLE EVENT STAFF invite link
 * NOTE: This assumes your EventStaffInviteLink has fields similar to EventInviteLink:
 * token, status, maxUses, uses, expiresAt, note, createdByUserId, eventId
 */
export const createEventStaffInviteLink = async (
  _prev: ActionState,
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

    const isRateLimited = await checkRateLimit("createEventStaffInviteLink");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const payload = {
      eventId: (formData.get("eventId")?.toString() ?? "").trim(),
      role: (formData.get("role")?.toString() ?? "").trim(),
      maxUses: (formData.get("maxUses")?.toString() ?? "").trim() || undefined,
      minutesToExpire:
        (formData.get("minutesToExpire")?.toString() ?? "").trim() || undefined,
      note: (formData.get("note")?.toString() ?? "").trim() || undefined,
    };

    const parsed = createEventStaffInviteLinkServerSchema.safeParse(payload);
    if (!parsed.success) {
      return parseServerActionResponse({
        status: "ERROR",
        error: parsed.error.issues[0]?.message ?? "Invalid fields",
        data: null,
      }) as ActionState;
    }

    const { eventId, role, maxUses, minutesToExpire, note } = parsed.data;

    const normalizedRole = normalizeRole(role);
    if (!normalizedRole) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "ROLE_NOT_ALLOWED",
        data: null,
      }) as ActionState;
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        slug: true,
        orgId: true,
        org: { select: { slug: true } },
      },
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
      session.user.id,
    );
    if (perms.status === "ERROR") return perms as ActionState;

    const maxUsesInt = parseOptionalInt(maxUses?.toString() ?? null);

    const oneWeekFromNow = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    const expiresAt = parseOptionalDateFromMinutes(
      minutesToExpire?.toString() ?? oneWeekFromNow.toISOString(),
    );

    const token = makeToken(24);

    const created = await prisma.eventStaffInviteLink.create({
      data: {
        eventId,
        token,
        role: normalizedRole,
        status: InviteStatus.PENDING,
        maxUses: maxUsesInt ?? undefined,
        expiresAt: expiresAt ?? oneWeekFromNow,
        note,
        createdByUserId: session.user.id,
      },
      select: {
        id: true,
        token: true,
        maxUses: true,
        uses: true,
        expiresAt: true,
        role: true,
      },
    });

    const baseUrl = getBaseUrl();
    const shareUrl = `${baseUrl}/app/orgs/${event.org.slug}/events/${event.slug}/eventstaff/join-link/${created.token}`;

    updateTag(`event-staff-invite-links-${eventId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: { linkId: created.id, shareUrl },
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to create staff invite link",
      data: null,
    }) as ActionState;
  }
};

/**
 * 3) Join page data (email invite)
 */
export const fetchEventStaffJoinInvitePageData = async (
  orgSlug: string,
  eventSlug: string,
  token: string,
): Promise<ActionState> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    const event = await prisma.event.findFirst({
      where: { slug: eventSlug, org: { slug: orgSlug } },
      select: {
        id: true,
        name: true,
        slug: true,
        org: { select: { slug: true } },
      },
    });

    if (!event) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "EVENT_NOT_FOUND",
        data: null,
      }) as ActionState;
    }

    const invite = await prisma.eventStaffInvite.findUnique({
      where: { token },
      select: {
        id: true,
        eventId: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
      },
    });

    if (!invite || invite.eventId !== event.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "INVITE_INVALID",
        data: null,
      }) as ActionState;
    }

    const isExpired = !!(
      invite.expiresAt && invite.expiresAt.getTime() < Date.now()
    );
    const isPending = invite.status === InviteStatus.PENDING;

    const sessionEmail = session?.user?.email
      ? normalizeEmail(session.user.email)
      : null;
    const inviteEmail = normalizeEmail(invite.email);
    const emailMismatch = !!(sessionEmail && inviteEmail !== sessionEmail);

    const userId = session?.user?.id ?? null;

    const isStaff =
      !!userId &&
      !!(await prisma.eventStaffMembership.findUnique({
        where: { eventId_userId: { eventId: event.id, userId } },
        select: { id: true },
      }));

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: {
        event: {
          id: event.id,
          name: event.name,
          slug: event.slug,
          orgSlug: event.org.slug,
        },
        invite: {
          email: invite.email,
          role: invite.role,
          status: invite.status,
          expiresAt: invite.expiresAt,
          isExpired,
          isPending,
          emailMismatch,
        },
        isStaff,
        session: {
          userId,
          email: session?.user?.email ?? null,
          name: session?.user?.name ?? null,
        },
      },
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to load staff invite page",
      data: null,
    }) as ActionState;
  }
};

/**
 * 4) Join page data (shareable link)
 */
export const fetchEventStaffJoinLinkPageData = async (
  orgSlug: string,
  eventSlug: string,
  token: string,
): Promise<ActionState> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    const event = await prisma.event.findFirst({
      where: { slug: eventSlug, org: { slug: orgSlug } },
      select: {
        id: true,
        name: true,
        slug: true,
        org: { select: { slug: true } },
      },
    });

    if (!event) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "EVENT_NOT_FOUND",
        data: null,
      }) as ActionState;
    }

    const link = await prisma.eventStaffInviteLink.findUnique({
      where: { token },
      select: {
        id: true,
        eventId: true,
        role: true,
        status: true,
        expiresAt: true,
        maxUses: true,
        uses: true,
      },
    });

    if (!link || link.eventId !== event.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "LINK_INVALID",
        data: null,
      }) as ActionState;
    }

    const isExpired = !!(
      link.expiresAt && link.expiresAt.getTime() < Date.now()
    );
    const isPending = link.status === InviteStatus.PENDING;
    const maxUsesReached =
      link.maxUses != null ? link.uses >= link.maxUses : false;

    const userId = session?.user?.id ?? null;

    const isStaff =
      !!userId &&
      !!(await prisma.eventStaffMembership.findUnique({
        where: { eventId_userId: { eventId: event.id, userId } },
        select: { id: true },
      }));

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: {
        event: {
          id: event.id,
          name: event.name,
          slug: event.slug,
          orgSlug: event.org.slug,
        },
        link: {
          role: link.role,
          status: link.status,
          expiresAt: link.expiresAt,
          maxUses: link.maxUses,
          uses: link.uses,
          isExpired,
          isPending,
          maxUsesReached,
        },
        isStaff,
        session: {
          userId,
          email: session?.user?.email ?? null,
          name: session?.user?.name ?? null,
        },
      },
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to load staff link page",
      data: null,
    }) as ActionState;
  }
};

/**
 * 5) Accept STAFF email invite
 * Creates EventStaffMembership and marks invite ACCEPTED.
 */
export const acceptEventStaffEmailInvite = async (
  token: string,
): Promise<ActionState> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id || !session.user.email) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN",
        data: null,
      }) as ActionState;
    }

    const isRateLimited = await checkRateLimit("acceptEventStaffEmailInvite");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const invite = await prisma.eventStaffInvite.findUnique({
      where: { token },
      select: {
        id: true,
        eventId: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
      },
    });

    if (!invite || invite.status !== InviteStatus.PENDING) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "INVITE_INVALID",
        data: null,
      }) as ActionState;
    }

    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "INVITE_EXPIRED",
        data: null,
      }) as ActionState;
    }

    const userEmail = normalizeEmail(session.user.email);
    if (normalizeEmail(invite.email) !== userEmail) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "EMAIL_MISMATCH",
        data: null,
      }) as ActionState;
    }

    const out = await prisma.$transaction(async (tx) => {
      await tx.eventStaffMembership.upsert({
        where: {
          eventId_userId: { eventId: invite.eventId, userId: session.user.id },
        },
        update: { role: invite.role },
        create: {
          eventId: invite.eventId,
          userId: session.user.id,
          role: invite.role,
        },
        select: { id: true },
      });

      await tx.eventStaffInvite.update({
        where: { id: invite.id },
        data: { status: InviteStatus.ACCEPTED },
      });

      return { eventId: invite.eventId, role: invite.role };
    });

    updateTag(`event-staff-accept-email-invites-${invite.eventId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: out,
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to accept staff email invite",
      data: null,
    }) as ActionState;
  }
};

/**
 * 6) Accept STAFF invite link
 * Creates EventStaffMembership, increments uses.
 */
export const acceptEventStaffInviteLink = async (
  token: string,
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

    const isRateLimited = await checkRateLimit("acceptEventStaffInviteLink");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const link = await prisma.eventStaffInviteLink.findUnique({
      where: { token },
      select: {
        id: true,
        eventId: true,
        role: true,
        status: true,
        expiresAt: true,
        maxUses: true,
        uses: true,
      },
    });

    if (!link || link.status !== InviteStatus.PENDING) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "LINK_INVALID",
        data: null,
      }) as ActionState;
    }

    if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "LINK_EXPIRED",
        data: null,
      }) as ActionState;
    }

    if (link.maxUses != null && link.uses >= link.maxUses) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "LINK_MAX_USES_REACHED",
        data: null,
      }) as ActionState;
    }

    const out = await prisma.$transaction(async (tx) => {
      await tx.eventStaffMembership.upsert({
        where: {
          eventId_userId: { eventId: link.eventId, userId: session.user.id },
        },
        update: { role: link.role },
        create: {
          eventId: link.eventId,
          userId: session.user.id,
          role: link.role,
        },
        select: { id: true },
      });

      await tx.eventStaffInviteLink.update({
        where: { id: link.id },
        data: { uses: { increment: 1 } },
      });

      return { eventId: link.eventId, role: link.role };
    });

    updateTag(`event-staff-accept-invite-links-${link.eventId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: out,
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to accept staff link",
      data: null,
    }) as ActionState;
  }
};
