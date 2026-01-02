"use server";

import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { checkRateLimit } from "@/src/lib/rate-limiter";
import { parseServerActionResponse } from "@/src/lib/utils";
import type { ActionState } from "@/src/lib/global_types";
import { updateTag } from "next/cache";

export const setLookingForTeam = async (
  orgSlug: string,
  eventSlug: string,
  lookingForTeam: boolean
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

    const isRateLimited = await checkRateLimit("setLookingForTeam");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const event = await prisma.event.findFirst({
      where: { slug: eventSlug, org: { slug: orgSlug } },
      select: { id: true },
    });

    if (!event) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "EVENT_NOT_FOUND",
        data: null,
      }) as ActionState;
    }

    // must be participant
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

    // if already on a team, force false
    const onTeam = await prisma.teamMember.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: session.user.id } },
      select: { id: true },
    });

    const finalValue = onTeam ? false : !!lookingForTeam;

    await prisma.eventParticipant.update({
      where: { eventId_userId: { eventId: event.id, userId: session.user.id } },
      data: { lookingForTeam: finalValue },
    });

    updateTag(`event-members-${event.id}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: { lookingForTeam: finalValue },
    }) as ActionState;
  } catch (e) {
    console.error(e);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to update lookingForTeam",
      data: null,
    }) as ActionState;
  }
};
