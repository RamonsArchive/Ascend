"use server";

import { ActionState } from "../lib/global_types";
import { parseServerActionResponse } from "../lib/utils";
import { prisma } from "../lib/prisma";
import { checkRateLimit } from "../lib/rate-limiter";
import { auth } from "../lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import {
  updateUserProfileServerSchema,
  deleteUserAccountServerSchema,
} from "@/src/lib/validation";
import { deleteS3ObjectIfExists } from "@/src/actions/s3_actions";
import { finalizeUserImageFromTmp } from "@/src/lib/s3-upload";
import { updateTag } from "next/cache";

async function requireSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  return session.user.id;
}

export const assertValidUser = async (): Promise<ActionState> => {
  try {
    const isRateLimited = await checkRateLimit("assertValidUser");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const userId = await requireSessionUser();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "User not found",
        data: null,
      }) as ActionState;
    }

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: user,
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to assert valid user",
      data: null,
    }) as ActionState;
  }
};

export const fetchUserDataSettings = async (): Promise<ActionState> => {
  try {
    const isRateLimited = await checkRateLimit("fetchUserDataSettings");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const userId = await requireSessionUser();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        username: true,
        headline: true,
        bioRich: true,
        bioText: true,
        profilePicKey: true,
        bannerKey: true,
        location: true,
        websiteUrl: true,
        linkedinUrl: true,
        discord: true,
        youtubeUrl: true,
        githubUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "User not found",
        data: null,
      }) as ActionState;
    }

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: user,
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to fetch user data settings",
      data: null,
    }) as ActionState;
  }
};

export const updateUserProfile = async (
  _state: ActionState,
  fd: FormData
): Promise<ActionState> => {
  try {
    const isRateLimited = await checkRateLimit("updateUserProfile");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const userId = await requireSessionUser();

    const raw = Object.fromEntries(fd.entries());
    const parsed = await updateUserProfileServerSchema.parseAsync(raw);

    // Load current keys so we can delete old ones if replaced/removed
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePicKey: true, bannerKey: true },
    });
    if (!current) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "User not found",
        data: null,
      }) as ActionState;
    }

    let nextProfilePicKey: string | null = current.profilePicKey ?? null;
    let nextBannerKey: string | null = current.bannerKey ?? null;

    // Finalize new uploads if present
    if (parsed.profilePicTmpKey) {
      nextProfilePicKey = await finalizeUserImageFromTmp({
        userId,
        kind: "profile",
        tmpKey: parsed.profilePicTmpKey,
      });
      // best-effort delete old
      await deleteS3ObjectIfExists(current.profilePicKey);
    }

    if (parsed.bannerTmpKey) {
      nextBannerKey = await finalizeUserImageFromTmp({
        userId,
        kind: "banner",
        tmpKey: parsed.bannerTmpKey,
      });
      await deleteS3ObjectIfExists(current.bannerKey);
    }

    if (parsed.removeProfilePic) {
      await deleteS3ObjectIfExists(current.profilePicKey);
      nextProfilePicKey = null;
    }
    if (parsed.removeBanner) {
      await deleteS3ObjectIfExists(current.bannerKey);
      nextBannerKey = null;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: parsed.name ?? undefined,
        username: parsed.username ?? null,
        headline: parsed.headline ?? null,

        // store both
        bioText: parsed.bioMarkdown ?? null,
        bioRich: parsed.bioRich ?? null,

        location: parsed.location ?? null,
        websiteUrl: parsed.websiteUrl ?? null,
        linkedinUrl: parsed.linkedinUrl ?? null,
        discord: parsed.discord ?? null,
        youtubeUrl: parsed.youtubeUrl ?? null,
        githubUrl: parsed.githubUrl ?? null,

        profilePicKey: nextProfilePicKey,
        bannerKey: nextBannerKey,
      },
      select: { id: true },
    });

    updateTag(`user-${userId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: updated,
    }) as ActionState;
  } catch (error) {
    console.error(error);

    if (error instanceof z.ZodError) {
      const fieldErrors = z.flattenError(error).fieldErrors as Record<
        string,
        string[]
      >;
      const msg = Object.values(fieldErrors).flat().filter(Boolean).join(", ");

      return parseServerActionResponse({
        status: "ERROR",
        error: msg || "Invalid input",
        data: fieldErrors,
      }) as ActionState;
    }

    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to update profile",
      data: null,
    }) as ActionState;
  }
};

export const deleteUserAccount = async (
  _state: ActionState,
  fd: FormData
): Promise<ActionState> => {
  try {
    const isRateLimited = await checkRateLimit("deleteUserAccount");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const userId = await requireSessionUser();
    const raw = Object.fromEntries(fd.entries());
    const parsed = await deleteUserAccountServerSchema.parseAsync(raw);

    // optional safety: require exact email confirmation
    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, profilePicKey: true, bannerKey: true },
    });
    if (!me) throw new Error("USER_NOT_FOUND");

    if (parsed.confirmEmail && me.email && parsed.confirmEmail !== me.email) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Email confirmation does not match.",
        data: null,
      }) as ActionState;
    }

    // delete assets best-effort
    await deleteS3ObjectIfExists(me.profilePicKey);
    await deleteS3ObjectIfExists(me.bannerKey);

    // NOTE: you may need cascade cleanup depending on your schema
    await prisma.user.delete({ where: { id: userId } });

    updateTag(`user-${userId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: { ok: true },
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to delete account",
      data: null,
    }) as ActionState;
  }
};
