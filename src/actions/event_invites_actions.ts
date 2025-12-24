"use server";

import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { checkRateLimit } from "@/src/lib/rate-limiter";
import { getBaseUrl, parseServerActionResponse } from "@/src/lib/utils";
import type { ActionState } from "@/src/lib/global_types";
import {
  InviteStatus,
  EventJoinMode,
  ParticipantStatus,
  RegistrationRequestStatus,
} from "@prisma/client";
import {
  normalizeEmail,
  makeToken,
  parseOptionalInt,
  parseOptionalDateFromMinutes,
} from "@/src/lib/utils";
import { updateTag } from "next/cache";
import { assertEventAdminOrOwnerWithId } from "@/src/actions/event_actions";
import {
  createEventInviteEmailClientSchema,
  createEventInviteLinkClientSchema,
  EventRegistrationRequestSchema,
  ReviewRegistrationRequestSchema,
} from "@/src/lib/validation";

// TODO: create this email template (same style as SendOrgEmailInvite)
import { SendEventEmailInvite } from "@/src/emails/SendEventEmailInvite";

export const createEventEmailInvite = async (
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

    const isRateLimited = await checkRateLimit("createEventEmailInvite");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const payload = {
      eventId: (formData.get("eventId")?.toString() ?? "").trim(),
      email: (formData.get("email")?.toString() ?? "").trim(),
      message: (formData.get("message")?.toString() ?? "").trim() || null,
      minutesToExpire: (
        formData.get("minutesToExpire")?.toString() ?? ""
      ).trim()
        ? (formData.get("minutesToExpire")?.toString() ?? "").trim()
        : null,
    };

    const parsed = createEventInviteEmailClientSchema.safeParse(payload);
    if (!parsed.success) {
      return parseServerActionResponse({
        status: "ERROR",
        error: parsed.error.issues[0]?.message ?? "Invalid fields",
        data: null,
      }) as ActionState;
    }

    const { eventId, email, message, minutesToExpire } = parsed.data;
    const normalizedEmail = normalizeEmail(email);
    const expiresAt = parseOptionalDateFromMinutes(
      minutesToExpire?.toString() ??
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    );

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        slug: true,
        orgId: true,
        org: { select: { id: true, slug: true, name: true } },
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

    // If user exists, block if already participant
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      const alreadyParticipant = await prisma.eventParticipant.findUnique({
        where: { eventId_userId: { eventId, userId: existingUser.id } },
        select: { id: true },
      });
      if (alreadyParticipant) {
        return parseServerActionResponse({
          status: "ERROR",
          error: "User is already registered for this event",
          data: null,
        }) as ActionState;
      }
    }

    // Existing pending invite?
    const pending = await prisma.eventEmailInvite.findFirst({
      where: { eventId, email: normalizedEmail, status: InviteStatus.PENDING },
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

    const invite = await prisma.eventEmailInvite.create({
      data: {
        eventId,
        email: normalizedEmail,
        token,
        status: InviteStatus.PENDING,
        message,
        expiresAt: expiresAt ?? undefined,
        createdByUserId: session.user.id,
      },
      select: { id: true, token: true, expiresAt: true },
    });

    // send email
    await SendEventEmailInvite({
      toEmail: normalizedEmail,
      inviterName: session.user.name ?? null,
      eventName: event.name,
      eventSlug: event.slug,
      orgSlug: event.org.slug,
      token: invite.token,
      message,
      expiresAt: invite.expiresAt ?? null,
    });

    updateTag(`event-email-invites-${eventId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: { inviteId: invite.id },
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to create event invite",
      data: null,
    }) as ActionState;
  }
};

/**
 * 2) Create SHAREABLE EVENT invite link (participant)
 *
 * FormData:
 * - eventId (required)
 * - maxUses (optional) int
 * - expiresInMinutes (optional) defaults to 7 days
 * - note (optional)
 */
export const createEventInviteLink = async (
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

    const isRateLimited = await checkRateLimit("createEventInviteLink");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const payload = {
      eventId: (formData.get("eventId")?.toString() ?? "").trim(),
      maxUses: (formData.get("maxUses")?.toString() ?? "").trim() || null,
      minutesToExpire:
        (formData.get("minutesToExpire")?.toString() ?? "").trim() || null,
      note: (formData.get("note")?.toString() ?? "").trim() || null,
    };

    const parsed = createEventInviteLinkClientSchema.safeParse(payload);
    if (!parsed.success) {
      return parseServerActionResponse({
        status: "ERROR",
        error: parsed.error.issues[0]?.message ?? "Invalid fields",
        data: null,
      }) as ActionState;
    }

    const { eventId, maxUses, minutesToExpire, note } = parsed.data;

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

    const created = await prisma.eventInviteLink.create({
      data: {
        eventId,
        token,
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
      },
    });

    const baseUrl = getBaseUrl();
    const shareUrl = `${baseUrl}/app/orgs/${event.org.slug}/events/${event.slug}/join-link/${created.token}`;

    updateTag(`event-invite-links-${eventId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: { linkId: created.id, shareUrl },
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to create event invite link",
      data: null,
    }) as ActionState;
  }
};

/**
 * Accept EVENT EMAIL invite:
 * - must be logged in
 * - token must be PENDING + not expired
 * - session.user.email must match invite.email
 * - create EventParticipant (if not already)
 * - mark invite ACCEPTED
 */
export const acceptEventInvite = async (
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

    const isRateLimited = await checkRateLimit("acceptEventInvite");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const invite = await prisma.eventEmailInvite.findUnique({
      where: { token },
      select: {
        id: true,
        eventId: true,
        email: true,
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
      const existing = await tx.eventParticipant.findUnique({
        where: {
          eventId_userId: { eventId: invite.eventId, userId: session.user.id },
        },
        select: { id: true },
      });

      if (!existing) {
        await tx.eventParticipant.create({
          data: {
            eventId: invite.eventId,
            userId: session.user.id,
            status: ParticipantStatus.REGISTERED,
          },
        });
      }

      await tx.eventEmailInvite.update({
        where: { id: invite.id },
        data: { status: InviteStatus.ACCEPTED },
      });

      return { eventId: invite.eventId };
    });

    updateTag(`event-accept-invites-${invite.eventId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: out,
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to accept invite",
      data: null,
    }) as ActionState;
  }
};

/**
 * Accept EVENT SHAREABLE link:
 * - must be logged in
 * - token must be PENDING + not expired
 * - must not exceed maxUses
 * - create EventParticipant
 * - increment uses
 */
export const acceptEventInviteLink = async (
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

    const isRateLimited = await checkRateLimit("acceptEventInviteLink");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const link = await prisma.eventInviteLink.findUnique({
      where: { token },
      select: {
        id: true,
        eventId: true,
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
      const existing = await tx.eventParticipant.findUnique({
        where: {
          eventId_userId: { eventId: link.eventId, userId: session.user.id },
        },
        select: { id: true },
      });

      if (!existing) {
        await tx.eventParticipant.create({
          data: {
            eventId: link.eventId,
            userId: session.user.id,
            status: ParticipantStatus.REGISTERED,
          },
        });
      }

      await tx.eventInviteLink.update({
        where: { id: link.id },
        data: { uses: { increment: 1 } },
      });

      return { eventId: link.eventId };
    });

    updateTag(`event-accept-invite-links-${link.eventId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: out,
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to accept link",
      data: null,
    }) as ActionState;
  }
};

/**
 * 3) Create EVENT registration request (for joinMode=REQUEST)
 *
 * FormData:
 * - orgSlug (required)
 * - eventSlug (required)
 * - message (optional)
 */
export const createEventRegistrationRequest = async (
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

    const isRateLimited = await checkRateLimit(
      "createEventRegistrationRequest",
    );
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const payload = {
      orgSlug: (formData.get("orgSlug")?.toString() ?? "").trim(),
      eventSlug: (formData.get("eventSlug")?.toString() ?? "").trim(),
      message: (formData.get("message")?.toString() ?? "").trim() || null,
    };

    const parsed = EventRegistrationRequestSchema.safeParse(payload);
    if (!parsed.success) {
      return parseServerActionResponse({
        status: "ERROR",
        error: parsed.error.issues[0]?.message ?? "Invalid fields",
        data: null,
      }) as ActionState;
    }

    const { orgSlug, eventSlug, message } = parsed.data;

    const event = await prisma.event.findFirst({
      where: { slug: eventSlug, org: { slug: orgSlug } },
      select: {
        id: true,
        joinMode: true,
      },
    });
    if (!event) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "EVENT_NOT_FOUND",
        data: null,
      }) as ActionState;
    }

    if (event.joinMode !== EventJoinMode.REQUEST) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "REGISTRATION_REQUESTS_DISABLED",
        data: null,
      }) as ActionState;
    }

    // already participant?
    const existing = await prisma.eventParticipant.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: session.user.id } },
      select: { id: true },
    });
    if (existing) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "ALREADY_REGISTERED",
        data: null,
      }) as ActionState;
    }

    try {
      const req = await prisma.eventRegistrationRequest.create({
        data: {
          eventId: event.id,
          userId: session.user.id,
          message,
        },
        select: { id: true },
      });

      updateTag(`event-registration-requests-${event.id}`);

      return parseServerActionResponse({
        status: "SUCCESS",
        error: "",
        data: req,
      }) as ActionState;
    } catch {
      // @@unique(eventId,userId)
      return parseServerActionResponse({
        status: "ERROR",
        error: "REQUEST_ALREADY_EXISTS",
        data: null,
      }) as ActionState;
    }
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to create registration request",
      data: null,
    }) as ActionState;
  }
};

/**
 * 4) Admin reviews registration request (approve/deny)
 *
 * FormData:
 * - eventId
 * - requestId
 * - decision: "APPROVE" | "DENY"
 */
export const reviewEventRegistrationRequest = async (
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

    const isRateLimited = await checkRateLimit(
      "reviewEventRegistrationRequest",
    );
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const payload = {
      eventId: (formData.get("eventId")?.toString() ?? "").trim(),
      requestId: (formData.get("requestId")?.toString() ?? "").trim(),
      decision: (formData.get("decision")?.toString() ?? "").trim(),
    };

    const parsed = ReviewRegistrationRequestSchema.safeParse(payload);
    if (!parsed.success) {
      return parseServerActionResponse({
        status: "ERROR",
        error: parsed.error.issues[0]?.message ?? "Invalid fields",
        data: null,
      }) as ActionState;
    }

    const { eventId, requestId, decision } = parsed.data;

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
      session.user.id,
    );
    if (perms.status === "ERROR") return perms as ActionState;

    const req = await prisma.eventRegistrationRequest.findUnique({
      where: { id: requestId },
      select: { id: true, eventId: true, userId: true, status: true },
    });

    if (!req || req.eventId !== eventId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "REQUEST_NOT_FOUND",
        data: null,
      }) as ActionState;
    }

    if (req.status !== "PENDING") {
      return parseServerActionResponse({
        status: "ERROR",
        error: "REQUEST_ALREADY_REVIEWED",
        data: null,
      }) as ActionState;
    }

    if (decision === "DENY") {
      const updated = await prisma.eventRegistrationRequest.update({
        where: { id: requestId },
        data: {
          status: RegistrationRequestStatus.REJECTED,
          reviewedAt: new Date(),
          reviewedByUserId: session.user.id,
        },
      });

      updateTag(`event-registration-requests-${eventId}`);

      return parseServerActionResponse({
        status: "SUCCESS",
        error: "",
        data: updated,
      }) as ActionState;
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.eventParticipant.findUnique({
        where: { eventId_userId: { eventId, userId: req.userId } },
        select: { id: true },
      });

      if (!existing) {
        await tx.eventParticipant.create({
          data: {
            eventId,
            userId: req.userId,
            status: ParticipantStatus.REGISTERED,
          },
        });
      }

      const updatedReq = await tx.eventRegistrationRequest.update({
        where: { id: requestId },
        data: {
          status: RegistrationRequestStatus.APPROVED,
          reviewedAt: new Date(),
          reviewedByUserId: session.user.id,
        },
      });

      return updatedReq;
    });

    updateTag(`event-registration-requests-${eventId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: result,
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to review registration request",
      data: null,
    }) as ActionState;
  }
};
