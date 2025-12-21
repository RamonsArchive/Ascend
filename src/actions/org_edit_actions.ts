"use server";

import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { checkRateLimit } from "@/src/lib/rate-limiter";
import { parseServerActionResponse } from "@/src/lib/utils";
import type { ActionState } from "@/src/lib/global_types";

import { editOrgServerSchema } from "@/src/lib/validation";
import { finalizeOrgImageFromTmp } from "@/src/lib/s3-upload";
import { deleteS3ObjectIfExists } from "@/src/actions/s3_actions";

export const updateOrganization = async (
  _prevState: ActionState,
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

    const isRateLimited = await checkRateLimit("updateOrganization");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    // ---- Read fields
    const orgId = (formData.get("orgId")?.toString() ?? "").trim();

    const name = (formData.get("name")?.toString() ?? "").trim();
    const description = (formData.get("description")?.toString() ?? "").trim();

    const publicEmail = (formData.get("publicEmail")?.toString() ?? "").trim();
    const publicPhone = (formData.get("publicPhone")?.toString() ?? "").trim();
    const websiteUrl = (formData.get("websiteUrl")?.toString() ?? "").trim();
    const contactNote = (formData.get("contactNote")?.toString() ?? "").trim();

    const logoTmpKey =
      (formData.get("logoKey")?.toString() ?? "").trim() || undefined;
    const coverTmpKey =
      (formData.get("coverKey")?.toString() ?? "").trim() || undefined;

    const removeLogo =
      (formData.get("removeLogo")?.toString() ?? "") === "true";
    const removeCover =
      (formData.get("removeCover")?.toString() ?? "") === "true";

    const payload = {
      orgId,
      name,
      description,
      publicEmail,
      publicPhone,
      websiteUrl,
      contactNote,
      logoTmpKey,
      coverTmpKey,
      removeLogo,
      removeCover,
    };

    const parsed = await editOrgServerSchema.safeParseAsync(payload);
    if (!parsed.success) {
      const msg =
        parsed.error.issues[0]?.message ?? "Invalid organization details.";
      return parseServerActionResponse({
        status: "ERROR",
        error: msg,
        data: null,
      }) as ActionState;
    }

    // ---- Permission check: must be OWNER or ADMIN
    const membership = await prisma.orgMembership.findFirst({
      where: { orgId, userId: session.user.id },
      select: { role: true },
    });

    if (
      !membership ||
      (membership.role !== "OWNER" && membership.role !== "ADMIN")
    ) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "NOT_AUTHORIZED",
        data: null,
      }) as ActionState;
    }

    // ---- Transaction: read old keys, finalize new keys, update DB
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.organization.findUnique({
        where: { id: orgId },
        select: { id: true, logoKey: true, coverKey: true, slug: true },
      });

      if (!existing) {
        throw new Error("ORG_NOT_FOUND");
      }

      // 1) finalize new uploads if provided
      const [newLogoFinal, newCoverFinal] = await Promise.all([
        logoTmpKey
          ? finalizeOrgImageFromTmp({ orgId, kind: "logo", tmpKey: logoTmpKey })
          : Promise.resolve(null),
        coverTmpKey
          ? finalizeOrgImageFromTmp({
              orgId,
              kind: "cover",
              tmpKey: coverTmpKey,
            })
          : Promise.resolve(null),
      ]);

      // 2) compute next keys
      const nextLogoKey = removeLogo
        ? null
        : (newLogoFinal ?? existing.logoKey ?? null);

      const nextCoverKey = removeCover
        ? null
        : (newCoverFinal ?? existing.coverKey ?? null);

      // 3) update org (tabular fields overwrite normally)
      const updated = await tx.organization.update({
        where: { id: orgId },
        data: {
          name,
          description,
          publicEmail: publicEmail || null,
          publicPhone: publicPhone || null,
          websiteUrl: websiteUrl || null,
          contactNote: contactNote || null,
          logoKey: nextLogoKey,
          coverKey: nextCoverKey,
        },
      });

      // Return what we need for post-transaction cleanup
      return {
        updated,
        oldLogoKey: existing.logoKey,
        oldCoverKey: existing.coverKey,
        newLogoFinal,
        newCoverFinal,
      };
    });

    // ---- Best-effort cleanup: delete old finalized objects if replaced/removed
    // Only delete if it actually changed
    if (result.newLogoFinal || payload.removeLogo) {
      if (result.oldLogoKey && result.oldLogoKey !== result.updated.logoKey) {
        await deleteS3ObjectIfExists(result.oldLogoKey);
      }
    }
    if (result.newCoverFinal || payload.removeCover) {
      if (
        result.oldCoverKey &&
        result.oldCoverKey !== result.updated.coverKey
      ) {
        await deleteS3ObjectIfExists(result.oldCoverKey);
      }
    }

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: result.updated,
    }) as ActionState;
  } catch (err) {
    console.error(err);

    const message =
      err instanceof Error && err.message === "ORG_NOT_FOUND"
        ? "Organization not found"
        : "Failed to update organization";

    return parseServerActionResponse({
      status: "ERROR",
      error: message,
      data: null,
    }) as ActionState;
  }
};
