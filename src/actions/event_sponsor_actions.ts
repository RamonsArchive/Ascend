"use server";

import { headers } from "next/headers";
import { updateTag } from "next/cache";

import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { checkRateLimit } from "../lib/rate-limiter";
import { parseServerActionResponse, allowedTiers } from "../lib/utils";

import type { ActionState } from "../lib/global_types";
import type { SponsorTier } from "@prisma/client";

import { assertEventAdminOrOwnerWithId } from "./event_actions";
import { finalizeSponsorImageFromTmp } from "@/src/lib/s3-upload";
import { deleteS3ObjectIfExists } from "@/src/actions/s3_actions";

function requireLogin(session: any): session is { user: { id: string } } {
  return Boolean(session?.user?.id);
}

/**
 * Add an existing global sponsor to an event (creates EventSponsor join row).
 * Expects FormData:
 *  - orgId, eventId, sponsorId
 *  - tier, isActive, order, displayName, blurb
 *  - logoKey (tmp, optional)
 */
export async function addExistingSponsorToEvent(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!requireLogin(session)) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN",
        data: null,
      }) as ActionState;
    }

    const rl = await checkRateLimit("addExistingSponsorToEvent");
    if (rl.status === "ERROR") return rl as ActionState;

    const orgId = (formData.get("orgId")?.toString() ?? "").trim();
    const eventId = (formData.get("eventId")?.toString() ?? "").trim();
    const sponsorId = (formData.get("sponsorId")?.toString() ?? "").trim();

    const tier = (formData.get("tier")?.toString() ?? "COMMUNITY").trim();
    const isActive =
      (formData.get("isActive")?.toString() ?? "true") === "true";
    const order =
      Number((formData.get("order")?.toString() ?? "0").trim()) || 0;

    const displayName = (formData.get("displayName")?.toString() ?? "").trim();
    const blurb = (formData.get("blurb")?.toString() ?? "").trim();

    const logoTmpKey =
      (formData.get("logoKey")?.toString() ?? "").trim() || undefined;

    if (!orgId || !eventId || !sponsorId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Missing orgId, eventId, or sponsorId",
        data: null,
      }) as ActionState;
    }

    if (!allowedTiers.has(tier as SponsorTier)) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Invalid sponsor tier",
        data: null,
      }) as ActionState;
    }

    // ✅ Permission check AND ensures event belongs to orgId
    const hasPerm = await assertEventAdminOrOwnerWithId(
      orgId,
      eventId,
      session.user.id
    );
    if (hasPerm.status === "ERROR") return hasPerm as ActionState;

    let finalLogoKey: string | null = null;
    if (logoTmpKey) {
      finalLogoKey = await finalizeSponsorImageFromTmp({
        sponsorId,
        kind: "logo",
        tmpKey: logoTmpKey,
      });
    }

    try {
      const created = await prisma.eventSponsor.create({
        data: {
          eventId,
          sponsorId,
          tier: tier as SponsorTier,
          isActive,
          order: Math.max(0, order),
          displayName: displayName || null,
          blurb: blurb || null,
          logoKey: finalLogoKey,
          // websiteKey: you can set this too if you want (see note below)
        },
      });

      updateTag(`event-sponsors-${eventId}`);
      return parseServerActionResponse({
        status: "SUCCESS",
        error: "",
        data: created,
      }) as ActionState;
    } catch (e: any) {
      if (e?.code === "P2002") {
        return parseServerActionResponse({
          status: "ERROR",
          error: "Sponsor is already added to this event.",
          data: null,
        }) as ActionState;
      }
      throw e;
    }
  } catch (error) {
    console.error(error);
    const msg =
      error instanceof Error && error.message === "NOT_AUTHORIZED"
        ? "NOT_AUTHORIZED"
        : "Failed to add existing sponsor to event";

    return parseServerActionResponse({
      status: "ERROR",
      error: msg,
      data: null,
    }) as ActionState;
  }
}

/**
 * Update EventSponsor join row.
 * Expects FormData:
 *  - orgId, eventId, eventSponsorId
 *  - tier, isActive, order, displayName, blurb
 *  - logoKey (tmp optional)
 *  - removeLogo ("true" optional)
 */
export async function updateEventSponsor(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!requireLogin(session)) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN",
        data: null,
      }) as ActionState;
    }

    const rl = await checkRateLimit("updateEventSponsor");
    if (rl.status === "ERROR") return rl as ActionState;

    const orgId = (formData.get("orgId")?.toString() ?? "").trim();
    const eventId = (formData.get("eventId")?.toString() ?? "").trim();
    const eventSponsorId = (
      formData.get("eventSponsorId")?.toString() ?? ""
    ).trim();

    const tier = (formData.get("tier")?.toString() ?? "COMMUNITY").trim();
    const isActive =
      (formData.get("isActive")?.toString() ?? "true") === "true";
    const order =
      Number((formData.get("order")?.toString() ?? "0").trim()) || 0;

    const displayName = (formData.get("displayName")?.toString() ?? "").trim();
    const blurb = (formData.get("blurb")?.toString() ?? "").trim();

    const logoTmpKey =
      (formData.get("logoKey")?.toString() ?? "").trim() || undefined;
    const removeLogo =
      (formData.get("removeLogo")?.toString() ?? "") === "true";

    if (!orgId || !eventId || !eventSponsorId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Missing orgId, eventId, or eventSponsorId",
        data: null,
      }) as ActionState;
    }

    if (!allowedTiers.has(tier as SponsorTier)) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Invalid sponsor tier",
        data: null,
      }) as ActionState;
    }

    // ✅ Permission check AND ensures event belongs to orgId
    const hasPerm = await assertEventAdminOrOwnerWithId(
      orgId,
      eventId,
      session.user.id
    );
    if (hasPerm.status === "ERROR") return hasPerm as ActionState;

    // Ensure the join row is actually for THIS eventId
    const existing = await prisma.eventSponsor.findUnique({
      where: { id: eventSponsorId },
      select: { id: true, eventId: true, sponsorId: true, logoKey: true },
    });

    if (!existing) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Event sponsor not found",
        data: null,
      }) as ActionState;
    }

    if (existing.eventId !== eventId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Mismatched eventSponsorId for this event",
        data: null,
      }) as ActionState;
    }

    const result = await prisma.$transaction(async (tx) => {
      const newLogoFinal = logoTmpKey
        ? await finalizeSponsorImageFromTmp({
            sponsorId: existing.sponsorId,
            kind: "logo",
            tmpKey: logoTmpKey,
          })
        : null;

      const nextLogoKey = removeLogo
        ? null
        : (newLogoFinal ?? existing.logoKey ?? null);

      const updated = await tx.eventSponsor.update({
        where: { id: eventSponsorId },
        data: {
          tier: tier as SponsorTier,
          isActive,
          order: Math.max(0, order),
          displayName: displayName || null,
          blurb: blurb || null,
          logoKey: nextLogoKey,
        },
      });

      return { updated, oldLogoKey: existing.logoKey, newLogoFinal };
    });

    // ✅ keep S3 clean
    if (result.newLogoFinal || removeLogo) {
      if (result.oldLogoKey && result.oldLogoKey !== result.updated.logoKey) {
        await deleteS3ObjectIfExists(result.oldLogoKey);
      }
    }

    updateTag(`event-sponsors-${eventId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: result.updated,
    }) as ActionState;
  } catch (error) {
    console.error(error);
    const msg =
      error instanceof Error && error.message === "NOT_AUTHORIZED"
        ? "NOT_AUTHORIZED"
        : "Failed to update event sponsor";

    return parseServerActionResponse({
      status: "ERROR",
      error: msg,
      data: null,
    }) as ActionState;
  }
}

/**
 * Remove EventSponsor join row.
 * Expects FormData:
 *  - orgId, eventId, eventSponsorId
 * Deletes logo override from S3 best-effort.
 */
export async function removeEventSponsor(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!requireLogin(session)) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN",
        data: null,
      }) as ActionState;
    }

    const rl = await checkRateLimit("removeEventSponsor");
    if (rl.status === "ERROR") return rl as ActionState;

    const orgId = (formData.get("orgId")?.toString() ?? "").trim();
    const eventId = (formData.get("eventId")?.toString() ?? "").trim();
    const eventSponsorId = (
      formData.get("eventSponsorId")?.toString() ?? ""
    ).trim();

    if (!orgId || !eventId || !eventSponsorId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Missing orgId, eventId, or eventSponsorId",
        data: null,
      }) as ActionState;
    }

    const hasPerm = await assertEventAdminOrOwnerWithId(
      orgId,
      eventId,
      session.user.id
    );
    if (hasPerm.status === "ERROR") return hasPerm as ActionState;

    const existing = await prisma.eventSponsor.findUnique({
      where: { id: eventSponsorId },
      select: { id: true, eventId: true, logoKey: true },
    });

    if (!existing) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Event sponsor not found",
        data: null,
      }) as ActionState;
    }

    if (existing.eventId !== eventId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Mismatched eventSponsorId for this event",
        data: null,
      }) as ActionState;
    }

    await prisma.eventSponsor.delete({ where: { id: eventSponsorId } });

    if (existing.logoKey) {
      await deleteS3ObjectIfExists(existing.logoKey);
    }

    updateTag(`event-sponsors-${eventId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: { id: eventSponsorId },
    }) as ActionState;
  } catch (error) {
    console.error(error);
    const msg =
      error instanceof Error && error.message === "NOT_AUTHORIZED"
        ? "NOT_AUTHORIZED"
        : "Failed to remove event sponsor";

    return parseServerActionResponse({
      status: "ERROR",
      error: msg,
      data: null,
    }) as ActionState;
  }
}
