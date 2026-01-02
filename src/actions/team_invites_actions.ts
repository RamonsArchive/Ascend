"use server";

import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { checkRateLimit } from "@/src/lib/rate-limiter";
import { parseServerActionResponse } from "@/src/lib/utils";
import type { ActionState } from "@/src/lib/global_types";
import {
  JoinRequestStatus,
  TeamAuditAction,
  TeamRole,
  InviteStatus,
} from "@prisma/client";
import { updateTag } from "next/cache";
import {
  normalizeEmail,
  makeToken,
  parseOptionalDateFromMinutes,
} from "@/src/lib/utils";
import { SendInviteToJoinTeamEmail } from "@/src/emails/SendInviteToJoinTeamEmail";
import { SendTeamJoinRequestReceivedEmail } from "../emails/SendTeamJoinRequestReceivedEmail";

export const createTeamJoinRequest = async (
  orgSlug: string,
  eventSlug: string,
  teamId: string,
  message: string | null,
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

    const isRateLimited = await checkRateLimit("createTeamJoinRequest");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const event = await prisma.event.findFirst({
      where: { slug: eventSlug, org: { slug: orgSlug } },
      select: {
        id: true,
        slug: true,
        name: true,
        maxTeamSize: true,
        lockTeamChangesAtStart: true,
        startAt: true,
        allowSelfJoinRequests: true,
      },
    });

    if (!event) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "EVENT_NOT_FOUND",
        data: null,
      }) as ActionState;
    }

    if (!event.allowSelfJoinRequests) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "TEAM_JOIN_REQUESTS_DISABLED",
        data: null,
      }) as ActionState;
    }

    if (
      event.lockTeamChangesAtStart &&
      event.startAt &&
      event.startAt.getTime() <= Date.now()
    ) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "TEAM_CHANGES_LOCKED",
        data: null,
      }) as ActionState;
    }

    const participant = await prisma.eventParticipant.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: session.user.id } },
      select: { id: true },
    });

    if (!participant) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST_BE_EVENT_PARTICIPANT",
        data: null,
      }) as ActionState;
    }

    const team = await prisma.team.findFirst({
      where: { id: teamId, eventId: event.id },
      select: {
        id: true,
        name: true,
        slug: true,
        lookingForMembers: true,
        _count: { select: { members: true } },
      },
    });

    if (!team) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "TEAM_NOT_FOUND",
        data: null,
      }) as ActionState;
    }

    if (!team.lookingForMembers) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "TEAM_NOT_ACCEPTING_MEMBERS",
        data: null,
      }) as ActionState;
    }

    if (team._count.members >= event.maxTeamSize) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "TEAM_FULL",
        data: null,
      }) as ActionState;
    }

    const alreadyOnTeam = await prisma.teamMember.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: session.user.id } },
      select: { id: true },
    });

    if (alreadyOnTeam) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "ALREADY_ON_TEAM",
        data: null,
      }) as ActionState;
    }

    const pending = await prisma.teamJoinRequest.findFirst({
      where: {
        eventId: event.id,
        teamId: team.id,
        userId: session.user.id,
        status: JoinRequestStatus.PENDING,
      },
      select: { id: true },
    });

    if (pending) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "JOIN_REQUEST_ALREADY_PENDING",
        data: null,
      }) as ActionState;
    }

    const created = await prisma.$transaction(async (tx) => {
      const req = await tx.teamJoinRequest.create({
        data: {
          eventId: event.id,
          teamId: team.id,
          userId: session.user.id,
          message: message?.trim() || null,
          status: JoinRequestStatus.PENDING,
        },
        select: { id: true },
      });

      await tx.teamAuditLog.create({
        data: {
          eventId: event.id,
          teamId: team.id,
          actorId: session.user.id,
          action: TeamAuditAction.JOIN_REQUEST_SENT,
          meta: { message: message?.trim() || null },
        },
      });

      return req;
    });

    // Email TEAM LEADERS (not the requester)
    const leaders = await prisma.teamMember.findMany({
      where: { teamId: team.id, role: TeamRole.LEADER },
      select: { user: { select: { email: true, name: true } } },
    });

    const leaderEmails = leaders.map((x) => x.user.email).filter(Boolean);

    // if no leaders, you can skip or notify event admins later
    for (const toEmail of leaderEmails) {
      await SendTeamJoinRequestReceivedEmail({
        toEmail,
        teamName: team.name,
        teamSlug: team.slug,
        eventName: event.name,
        eventSlug: event.slug,
        orgSlug,
        requesterName: session.user.name ?? null,
        requesterEmail: session.user.email,
        message: message?.trim() || null,
      });
    }

    updateTag(`event-members-${event.id}`);
    updateTag(`team-join-requests-${event.id}`);
    updateTag(`team-${team.id}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: created,
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to create join request",
      data: null,
    }) as ActionState;
  }
};

// TODO: create this email template
// import { SendTeamEmailInvite } from "@/src/emails/SendTeamEmailInvite";

export const createTeamEmailInvite = async (
  orgSlug: string,
  eventSlug: string,
  teamId: string,
  email: string,
  message: string | null,
  minutesToExpire: string | null,
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

    const isRateLimited = await checkRateLimit("createTeamEmailInvite");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const normalized = normalizeEmail(email);

    const event = await prisma.event.findFirst({
      where: { slug: eventSlug, org: { slug: orgSlug } },
      select: {
        id: true,
        slug: true,
        name: true,
        maxTeamSize: true,
        lockTeamChangesAtStart: true,
        startAt: true,
      },
    });

    if (!event) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "EVENT_NOT_FOUND",
        data: null,
      }) as ActionState;
    }

    if (
      event.lockTeamChangesAtStart &&
      event.startAt &&
      event.startAt.getTime() <= Date.now()
    ) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "TEAM_CHANGES_LOCKED",
        data: null,
      }) as ActionState;
    }

    const team = await prisma.team.findFirst({
      where: { id: teamId, eventId: event.id },
      select: {
        id: true,
        name: true,
        _count: { select: { members: true } },
      },
    });

    if (!team) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "TEAM_NOT_FOUND",
        data: null,
      }) as ActionState;
    }

    if (team._count.members >= event.maxTeamSize) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "TEAM_FULL",
        data: null,
      }) as ActionState;
    }

    // Must be a TEAM LEADER to invite
    const leader = await prisma.teamMember.findFirst({
      where: {
        teamId: team.id,
        userId: session.user.id,
        role: TeamRole.LEADER,
      },
      select: { id: true },
    });

    if (!leader) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "ONLY_LEADER_CAN_INVITE",
        data: null,
      }) as ActionState;
    }

    // If user exists, block if already on a team in this event
    const existingUser = await prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true },
    });

    if (existingUser) {
      const alreadyOnTeam = await prisma.teamMember.findUnique({
        where: {
          eventId_userId: { eventId: event.id, userId: existingUser.id },
        },
        select: { id: true },
      });
      if (alreadyOnTeam) {
        return parseServerActionResponse({
          status: "ERROR",
          error: "USER_ALREADY_ON_TEAM",
          data: null,
        }) as ActionState;
      }
    }

    // Existing pending invite?
    const pending = await prisma.teamInvite.findFirst({
      where: {
        eventId: event.id,
        teamId: team.id,
        email: normalized,
        status: InviteStatus.PENDING,
      },
      select: { id: true },
    });

    if (pending) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "INVITE_ALREADY_PENDING",
        data: null,
      }) as ActionState;
    }

    const expiresAt = parseOptionalDateFromMinutes(
      minutesToExpire?.toString() ??
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    );

    const token = makeToken(24);

    const invite = await prisma.$transaction(async (tx) => {
      const created = await tx.teamInvite.create({
        data: {
          eventId: event.id,
          teamId: team.id,
          email: normalized,
          token,
          status: InviteStatus.PENDING,
          message: message?.trim() || null,
          createdByUserId: session.user.id,
          expiresAt: expiresAt ?? undefined,
        },
        select: { id: true, token: true, expiresAt: true },
      });

      await tx.teamAuditLog.create({
        data: {
          eventId: event.id,
          teamId: team.id,
          actorId: session.user.id,
          action: TeamAuditAction.INVITE_SENT,
          meta: { email: normalized, message: message?.trim() || null },
        },
      });

      return created;
    });

    // TODO send email
    await SendInviteToJoinTeamEmail({
      toEmail: normalized,
      teamName: team.name,
      eventName: event.name,
      eventSlug: event.slug,
      orgSlug: orgSlug,
      inviterName: session.user.name ?? null,
      token: invite.token,
      message: message?.trim() || null,
      expiresAt: invite.expiresAt ?? null,
    });
    updateTag(`team-invites-${event.id}`);
    updateTag(`team-${team.id}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: {
        inviteId: invite.id,
        token: invite.token,
        expiresAt: invite.expiresAt ?? null,
      },
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to create team invite",
      data: null,
    }) as ActionState;
  }
};
