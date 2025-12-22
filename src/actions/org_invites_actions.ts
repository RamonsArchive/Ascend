"use server";
import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { checkRateLimit } from "@/src/lib/rate-limiter";
import { parseServerActionResponse } from "@/src/lib/utils";
import type { ActionState } from "@/src/lib/global_types";
import {
  OrgRole,
  InviteStatus,
  JoinRequestStatus,
  OrgJoinMode,
} from "@prisma/client";
import { SendOrgEmailInvite } from "@/src/emails/SendOrgEmailInvite";
import { assertOrgAdminOrOwnerWithId } from "@/src/actions/org_actions";
import {
  normalizeEmail,
  makeToken,
  parseOptionalInt,
  parseOptionalDateFromMinutes,
} from "@/src/lib/utils";

/**
 * 1) Email invite: admin enters email => we create OrgInvite + send email
 *
 * FormData:
 * - orgId (required)
 * - email (required)
 * - message (optional)
 * - expiresInMinutes (optional) e.g. "10080" (7 days)
 */
export const createOrgEmailInvite = async (
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

    const isRateLimited = await checkRateLimit("createOrgEmailInvite");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const orgId = (formData.get("orgId")?.toString() ?? "").trim();
    const emailRaw = (formData.get("email")?.toString() ?? "").trim();
    const message = (formData.get("message")?.toString() ?? "").trim() || null;
    const expiresAt = parseOptionalDateFromMinutes(
      formData.get("expiresInMinutes")?.toString() ?? null
    );

    if (!orgId || !emailRaw) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Missing orgId or email",
        data: null,
      }) as ActionState;
    }

    const perms = await assertOrgAdminOrOwnerWithId(orgId, session.user.id);
    if (perms.status === "ERROR") return perms as ActionState;

    const normalizedEmail = normalizeEmail(emailRaw);

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, slug: true },
    });
    if (!org) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "ORG_NOT_FOUND",
        data: null,
      }) as ActionState;
    }

    // Already a member? If user exists, check membership by userId.
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true },
    });

    if (existingUser) {
      const alreadyMember = await prisma.orgMembership.findUnique({
        where: { orgId_userId: { orgId, userId: existingUser.id } },
        select: { id: true },
      });
      if (alreadyMember) {
        return parseServerActionResponse({
          status: "ERROR",
          error: "User is already a member",
          data: null,
        }) as ActionState;
      }
    }

    // Existing pending invite for same email?
    const pending = await prisma.orgInvite.findFirst({
      where: {
        orgId,
        email: normalizedEmail,
        status: InviteStatus.PENDING,
      },
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

    const invite = await prisma.orgInvite.create({
      data: {
        orgId,
        email: normalizedEmail,
        token,
        status: InviteStatus.PENDING,
        role: OrgRole.MEMBER, // keep it MEMBER; promote after
        message,
        expiresAt: expiresAt ?? undefined,
        createdByUserId: session.user.id,
      },
      select: { id: true, token: true, expiresAt: true },
    });

    // send email
    await SendOrgEmailInvite({
      toEmail: normalizedEmail,
      orgName: org.name,
      orgSlug: org.slug,
      inviterName: session.user.name ?? null,
      token: invite.token,
      message,
      expiresAt: invite.expiresAt ?? null,
    });

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: { inviteId: invite.id },
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to create invite",
      data: null,
    }) as ActionState;
  }
};

/**
 * 2) Shareable invite link: create link with role MEMBER, maxUses, expiresAt
 *
 * FormData:
 * - orgId (required)
 * - maxUses (optional) int
 * - expiresInMinutes (optional)
 * - note (optional)
 */
export const createOrgInviteLink = async (
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

    const isRateLimited = await checkRateLimit("createOrgInviteLink");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const orgId = (formData.get("orgId")?.toString() ?? "").trim();
    const maxUses = parseOptionalInt(
      formData.get("maxUses")?.toString() ?? null
    );
    const expiresAt = parseOptionalDateFromMinutes(
      formData.get("expiresInMinutes")?.toString() ?? null
    );
    const note = (formData.get("note")?.toString() ?? "").trim() || null;

    if (!orgId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Missing orgId",
        data: null,
      }) as ActionState;
    }

    const perms = await assertOrgAdminOrOwnerWithId(orgId, session.user.id);
    if (perms.status === "ERROR") return perms as ActionState;

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, slug: true },
    });
    if (!org) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "ORG_NOT_FOUND",
        data: null,
      }) as ActionState;
    }

    const token = makeToken(24);

    const created = await prisma.orgInviteLink.create({
      data: {
        orgId,
        token,
        role: OrgRole.MEMBER,
        status: InviteStatus.PENDING,
        maxUses: maxUses ?? undefined,
        expiresAt: expiresAt ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 1 week from now by default
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

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

    const shareUrl = `${baseUrl}/app/orgs/${org.slug}/join-link/${created.token}`;

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: { linkId: created.id, shareUrl },
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to create invite link",
      data: null,
    }) as ActionState;
  }
};

/**
 * Accept EMAIL invite:
 * - must be logged in
 * - token must be PENDING + not expired
 * - session.user.email must match invite.email (case-insensitive)
 * - create OrgMembership (if not already)
 * - mark invite ACCEPTED
 */
export const acceptOrgInvite = async (token: string): Promise<ActionState> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id || !session.user.email) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN",
        data: null,
      }) as ActionState;
    }

    const isRateLimited = await checkRateLimit("acceptOrgInvite");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const invite = await prisma.orgInvite.findUnique({
      where: { token },
      select: {
        id: true,
        orgId: true,
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

    const created = await prisma.$transaction(async (tx) => {
      // create membership if not exists
      const existing = await tx.orgMembership.findUnique({
        where: {
          orgId_userId: { orgId: invite.orgId, userId: session.user.id },
        },
        select: { id: true },
      });

      if (!existing) {
        await tx.orgMembership.create({
          data: {
            orgId: invite.orgId,
            userId: session.user.id,
            role: invite.role,
          },
        });
      }

      await tx.orgInvite.update({
        where: { id: invite.id },
        data: { status: InviteStatus.ACCEPTED },
      });

      return { orgId: invite.orgId };
    });

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: created,
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
 * Accept SHAREABLE link:
 * - must be logged in
 * - token must be PENDING + not expired
 * - must not exceed maxUses
 * - join as MEMBER
 */
export const acceptOrgInviteLink = async (
  token: string
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

    const isRateLimited = await checkRateLimit("acceptOrgInviteLink");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const link = await prisma.orgInviteLink.findUnique({
      where: { token },
      select: {
        id: true,
        orgId: true,
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

    if (
      link.maxUses !== null &&
      link.maxUses !== undefined &&
      link.uses >= link.maxUses
    ) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "LINK_MAX_USES_REACHED",
        data: null,
      }) as ActionState;
    }

    const out = await prisma.$transaction(async (tx) => {
      // already member?
      const existing = await tx.orgMembership.findUnique({
        where: { orgId_userId: { orgId: link.orgId, userId: session.user.id } },
        select: { id: true },
      });

      if (!existing) {
        await tx.orgMembership.create({
          data: { orgId: link.orgId, userId: session.user.id, role: link.role },
        });
      }

      await tx.orgInviteLink.update({
        where: { id: link.id },
        data: { uses: { increment: 1 } },
      });

      return { orgId: link.orgId };
    });

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
 * 3) Join request: for orgs with joinMode=REQUEST and allowJoinRequests=true
 *
 * FormData:
 * - orgSlug (required) OR orgId (choose one pattern; slug is nicer on public pages)
 * - message (optional)
 */
export const createOrgJoinRequest = async (
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

    const isRateLimited = await checkRateLimit("createOrgJoinRequest");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const orgSlug = (formData.get("orgSlug")?.toString() ?? "").trim();
    const message = (formData.get("message")?.toString() ?? "").trim() || null;

    if (!orgSlug) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Missing orgSlug",
        data: null,
      }) as ActionState;
    }

    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true, joinMode: true, allowJoinRequests: true },
    });
    if (!org)
      return parseServerActionResponse({
        status: "ERROR",
        error: "ORG_NOT_FOUND",
        data: null,
      }) as ActionState;

    if (!(org.joinMode === OrgJoinMode.REQUEST && org.allowJoinRequests)) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "JOIN_REQUESTS_DISABLED",
        data: null,
      }) as ActionState;
    }

    // already member?
    const existingMember = await prisma.orgMembership.findUnique({
      where: { orgId_userId: { orgId: org.id, userId: session.user.id } },
      select: { id: true },
    });
    if (existingMember) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "ALREADY_MEMBER",
        data: null,
      }) as ActionState;
    }

    try {
      const req = await prisma.orgJoinRequest.create({
        data: {
          orgId: org.id,
          userId: session.user.id,
          message,
          status: JoinRequestStatus.PENDING,
        },
        select: { id: true },
      });

      return parseServerActionResponse({
        status: "SUCCESS",
        error: "",
        data: req,
      }) as ActionState;
    } catch (e: any) {
      // @@unique(orgId,userId)
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
      error: "Failed to create join request",
      data: null,
    }) as ActionState;
  }
};

/**
 * Admin reviews join request (approve/deny)
 *
 * FormData:
 * - orgId
 * - requestId
 * - decision: "APPROVE" | "DENY"
 */
export const reviewOrgJoinRequest = async (
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

    const isRateLimited = await checkRateLimit("reviewOrgJoinRequest");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const orgId = (formData.get("orgId")?.toString() ?? "").trim();
    const requestId = (formData.get("requestId")?.toString() ?? "").trim();
    const decision = (formData.get("decision")?.toString() ?? "").trim();

    if (!orgId || !requestId || !decision) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Missing fields",
        data: null,
      }) as ActionState;
    }

    const perms = await assertOrgAdminOrOwnerWithId(orgId, session.user.id);
    if (perms.status === "ERROR") return perms as ActionState;

    const req = await prisma.orgJoinRequest.findUnique({
      where: { id: requestId },
      select: { id: true, orgId: true, userId: true, status: true },
    });
    if (!req || req.orgId !== orgId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "REQUEST_NOT_FOUND",
        data: null,
      }) as ActionState;
    }
    if (req.status !== JoinRequestStatus.PENDING) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "REQUEST_ALREADY_REVIEWED",
        data: null,
      }) as ActionState;
    }

    if (decision === "DENY") {
      const updated = await prisma.orgJoinRequest.update({
        where: { id: requestId },
        data: { status: JoinRequestStatus.DECLINED },
      });
      return parseServerActionResponse({
        status: "SUCCESS",
        error: "",
        data: updated,
      }) as ActionState;
    }

    if (decision !== "APPROVE") {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Invalid decision",
        data: null,
      }) as ActionState;
    }

    const result = await prisma.$transaction(async (tx) => {
      // create membership if not exists
      const existing = await tx.orgMembership.findUnique({
        where: { orgId_userId: { orgId, userId: req.userId } },
        select: { id: true },
      });
      if (!existing) {
        await tx.orgMembership.create({
          data: { orgId, userId: req.userId, role: OrgRole.MEMBER },
        });
      }

      const updatedReq = await tx.orgJoinRequest.update({
        where: { id: requestId },
        data: { status: JoinRequestStatus.ACCEPTED },
      });

      return updatedReq;
    });

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: result,
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to review join request",
      data: null,
    }) as ActionState;
  }
};

export const fetchOrgJoinRequests = async (
  orgId: string,
  userId: string
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
    const isRateLimited = await checkRateLimit("fetchOrgJoinRequests");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const hasPermissions = await assertOrgAdminOrOwnerWithId(orgId, userId);
    if (hasPermissions.status === "ERROR") return hasPermissions as ActionState;

    const joinRequests = await prisma.orgJoinRequest.findMany({
      where: { orgId },
      select: {
        id: true,
        userId: true,
        message: true,
        status: true,
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
      data: joinRequests,
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to fetch join requests",
      data: null,
    }) as ActionState;
  }
};
