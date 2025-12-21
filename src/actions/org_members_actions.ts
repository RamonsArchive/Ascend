"use server";

import { checkRateLimit } from "../lib/rate-limiter";
import { parseServerActionResponse } from "../lib/utils";
import { auth } from "../lib/auth";
import type { ActionState } from "../lib/global_types";
import { newOrgServerFormSchema } from "../lib/validation";
import { prisma } from "../lib/prisma";
import { headers } from "next/headers";
import crypto from "crypto";
import { finalizeOrgImageFromTmp, OrgAssetKind } from "../lib/s3-upload";
import { isAdminOrOwnerOfOrg } from "./org_actions";
import { OrgMembership } from "@prisma/client";

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

    const hasPremissions = await isAdminOrOwnerOfOrg(orgSlug, session.user.id);
    if (hasPremissions.status === "ERROR") return hasPremissions;

    const members = await prisma.orgMembership.findMany({
      /// make sure I get orgrole
      where: { org: { slug: orgSlug } },
      select: {
        userId: true,
        role: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
            updatedAt: true,
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
