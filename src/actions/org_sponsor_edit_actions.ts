"use server";

import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { checkRateLimit } from "@/src/lib/rate-limiter";
import { parseServerActionResponse } from "@/src/lib/utils";
import type { ActionState } from "@/src/lib/global_types";
import type { SponsorTier } from "@prisma/client";

import { finalizeSponsorImageFromTmp } from "@/src/lib/s3-upload";
import { deleteS3ObjectIfExists } from "@/src/actions/s3_actions";
import { updateTag } from "next/cache";

const allowedTiers = new Set<SponsorTier>([
  "TITLE",
  "PLATINUM",
  "GOLD",
  "SILVER",
  "BRONZE",
  "COMMUNITY",
]);

async function assertAdminOrOwner(orgId: string, userId: string) {
  const membership = await prisma.orgMembership.findFirst({
    where: { orgId, userId },
    select: { role: true },
  });

  if (
    !membership ||
    (membership.role !== "OWNER" && membership.role !== "ADMIN")
  ) {
    throw new Error("NOT_AUTHORIZED");
  }
}

export const updateOrgSponsor = async (
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

    const isRateLimited = await checkRateLimit("updateOrgSponsor");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const orgId = (formData.get("orgId")?.toString() ?? "").trim();
    const sponsorId = (formData.get("sponsorId")?.toString() ?? "").trim();

    const tierRaw = (formData.get("tier")?.toString() ?? "").trim();
    const isActiveRaw = (formData.get("isActive")?.toString() ?? "").trim();
    const displayName = (formData.get("displayName")?.toString() ?? "").trim();
    const blurb = (formData.get("blurb")?.toString() ?? "").trim();
    const orderRaw = (formData.get("order")?.toString() ?? "").trim();

    // Optional: org-specific override logo (OrganizationSponsor.logoKey)
    const logoTmpKey =
      (formData.get("logoKey")?.toString() ?? "").trim() || undefined;

    const removeLogo =
      (formData.get("removeLogo")?.toString() ?? "") === "true";

    if (!orgId || !sponsorId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Missing orgId or sponsorId",
        data: null,
      }) as ActionState;
    }

    // permission
    await assertAdminOrOwner(orgId, session.user.id);

    // normalize fields
    const tier = tierRaw ? (tierRaw as SponsorTier) : undefined;
    if (tier && !allowedTiers.has(tier)) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Invalid tier",
        data: null,
      }) as ActionState;
    }

    const isActive = isActiveRaw === "" ? undefined : isActiveRaw === "true";

    const order =
      orderRaw === "" ? undefined : Math.max(0, Number(orderRaw) || 0);

    // transaction like your org update
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.organizationSponsor.findUnique({
        where: { orgId_sponsorId: { orgId, sponsorId } },
        select: { id: true, logoKey: true },
      });
      if (!existing) throw new Error("ORG_SPONSOR_NOT_FOUND");

      // finalize new upload if provided
      const newLogoFinal = logoTmpKey
        ? await finalizeSponsorImageFromTmp({
            sponsorId, // images live under sponsorId in your S3 layout
            kind: "logo",
            tmpKey: logoTmpKey,
          })
        : null;

      const nextLogoKey = removeLogo
        ? null
        : (newLogoFinal ?? existing.logoKey ?? null);

      const updated = await tx.organizationSponsor.update({
        where: { orgId_sponsorId: { orgId, sponsorId } },
        data: {
          tier: tier ?? undefined,
          isActive: isActive ?? undefined,
          displayName: displayName ? displayName : null,
          blurb: blurb ? blurb : null,
          order: order ?? undefined,
          logoKey: nextLogoKey,
        },
      });

      return {
        updated,
        oldLogoKey: existing.logoKey,
        newLogoFinal,
      };
    });

    // best-effort delete old finalized logo if replaced/removed
    if (result.newLogoFinal || removeLogo) {
      if (result.oldLogoKey && result.oldLogoKey !== result.updated.logoKey) {
        await deleteS3ObjectIfExists(result.oldLogoKey);
      }
    }

    updateTag(`org-sponsors-${orgId}`);
    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: result.updated,
    }) as ActionState;
  } catch (err) {
    console.error(err);

    const msg =
      err instanceof Error && err.message === "NOT_AUTHORIZED"
        ? "NOT_AUTHORIZED"
        : err instanceof Error && err.message === "ORG_SPONSOR_NOT_FOUND"
          ? "Sponsor link not found"
          : "Failed to update sponsor";

    return parseServerActionResponse({
      status: "ERROR",
      error: msg,
      data: null,
    }) as ActionState;
  }
};

/** DONT USE THIS FUNCTION
 * Update GLOBAL sponsor fields (Sponsor table)
 * Use this only if you really want edits to affect this sponsor everywhere.
 */
// export const updateSponsor = async (
//   _prevState: ActionState,
//   formData: FormData
// ): Promise<ActionState> => {
//   try {
//     const session = await auth.api.getSession({ headers: await headers() });
//     if (!session?.user?.id) {
//       return parseServerActionResponse({
//         status: "ERROR",
//         error: "MUST BE LOGGED IN",
//         data: null,
//       }) as ActionState;
//     }

//     const isRateLimited = await checkRateLimit("updateSponsor");
//     if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

//     const orgId = (formData.get("orgId")?.toString() ?? "").trim(); // used only for auth
//     const sponsorId = (formData.get("sponsorId")?.toString() ?? "").trim();

//     const name = (formData.get("name")?.toString() ?? "").trim();
//     const websiteKey = (formData.get("websiteKey")?.toString() ?? "").trim();
//     const description = (formData.get("description")?.toString() ?? "").trim();

//     const logoTmpKey =
//       (formData.get("logoKey")?.toString() ?? "").trim() || undefined;
//     const coverTmpKey =
//       (formData.get("coverKey")?.toString() ?? "").trim() || undefined;

//     const removeLogo =
//       (formData.get("removeLogo")?.toString() ?? "") === "true";
//     const removeCover =
//       (formData.get("removeCover")?.toString() ?? "") === "true";

//     if (!orgId || !sponsorId) {
//       return parseServerActionResponse({
//         status: "ERROR",
//         error: "Missing orgId or sponsorId",
//         data: null,
//       }) as ActionState;
//     }

//     // permission: editing global sponsor is still gated by org admin/owner
//     await assertAdminOrOwner(orgId, session.user.id);

//     const result = await prisma.$transaction(async (tx) => {
//       const existing = await tx.sponsor.findUnique({
//         where: { id: sponsorId },
//         select: { id: true, logoKey: true, coverKey: true },
//       });
//       if (!existing) throw new Error("SPONSOR_NOT_FOUND");

//       const [newLogoFinal, newCoverFinal] = await Promise.all([
//         logoTmpKey
//           ? finalizeSponsorImageFromTmp({
//               sponsorId,
//               kind: "logo",
//               tmpKey: logoTmpKey,
//             })
//           : Promise.resolve(null),
//         coverTmpKey
//           ? finalizeSponsorImageFromTmp({
//               sponsorId,
//               kind: "cover",
//               tmpKey: coverTmpKey,
//             })
//           : Promise.resolve(null),
//       ]);

//       const nextLogoKey = removeLogo
//         ? null
//         : (newLogoFinal ?? existing.logoKey ?? null);
//       const nextCoverKey = removeCover
//         ? null
//         : (newCoverFinal ?? existing.coverKey ?? null);

//       const updated = await tx.sponsor.update({
//         where: { id: sponsorId },
//         data: {
//           name: name || undefined,
//           websiteKey: websiteKey || null,
//           description: description || null,
//           logoKey: nextLogoKey,
//           coverKey: nextCoverKey,
//         },
//       });

//       return {
//         updated,
//         oldLogoKey: existing.logoKey,
//         oldCoverKey: existing.coverKey,
//         newLogoFinal,
//         newCoverFinal,
//       };
//     });

//     // cleanup old finalized files
//     if (result.newLogoFinal || removeLogo) {
//       if (result.oldLogoKey && result.oldLogoKey !== result.updated.logoKey) {
//         await deleteS3ObjectIfExists(result.oldLogoKey);
//       }
//     }
//     if (result.newCoverFinal || removeCover) {
//       if (
//         result.oldCoverKey &&
//         result.oldCoverKey !== result.updated.coverKey
//       ) {
//         await deleteS3ObjectIfExists(result.oldCoverKey);
//       }
//     }

//     return parseServerActionResponse({
//       status: "SUCCESS",
//       error: "",
//       data: result.updated,
//     }) as ActionState;
//   } catch (err) {
//     console.error(err);

//     const msg =
//       err instanceof Error && err.message === "NOT_AUTHORIZED"
//         ? "NOT_AUTHORIZED"
//         : err instanceof Error && err.message === "SPONSOR_NOT_FOUND"
//           ? "Sponsor not found"
//           : "Failed to update sponsor";

//     return parseServerActionResponse({
//       status: "ERROR",
//       error: msg,
//       data: null,
//     }) as ActionState;
//   }
// };

export const removeSponsorFromOrg = async (
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

    const isRateLimited = await checkRateLimit("removeSponsorFromOrg");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const orgId = (formData.get("orgId")?.toString() ?? "").trim();
    const sponsorId = (formData.get("sponsorId")?.toString() ?? "").trim();

    if (!orgId || !sponsorId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Missing orgId or sponsorId",
        data: null,
      }) as ActionState;
    }

    await assertAdminOrOwner(orgId, session.user.id);

    const existing = await prisma.organizationSponsor.findUnique({
      where: { orgId_sponsorId: { orgId, sponsorId } },
      select: { logoKey: true },
    });

    await prisma.organizationSponsor.delete({
      where: { orgId_sponsorId: { orgId, sponsorId } },
    });

    if (existing?.logoKey) {
      await deleteS3ObjectIfExists(existing.logoKey);
    }

    updateTag(`org-sponsors-${orgId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: { orgId, sponsorId },
    }) as ActionState;
  } catch (err) {
    console.error(err);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to remove sponsor",
      data: null,
    }) as ActionState;
  }
};
