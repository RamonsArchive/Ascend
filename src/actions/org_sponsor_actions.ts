"use server";

import crypto from "crypto";
import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { checkRateLimit } from "@/src/lib/rate-limiter";
import { parseServerActionResponse } from "@/src/lib/utils";
import type { ActionState } from "@/src/lib/global_types";
import { finalizeSponsorImageFromTmp } from "@/src/lib/s3-upload";
import type { SponsorTier } from "@prisma/client";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const addSponsorToOrg = async (
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

    const isRateLimited = await checkRateLimit("addSponsorToOrg");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const orgId = (formData.get("orgId")?.toString() ?? "").trim();
    const sponsorName = (formData.get("sponsorName")?.toString() ?? "").trim();
    const sponsorWebsite = (
      formData.get("sponsorWebsite")?.toString() ?? ""
    ).trim();
    const sponsorDescription = (
      formData.get("sponsorDescription")?.toString() ?? ""
    ).trim();
    const tier = (formData.get("tier")?.toString() ?? "COMMUNITY").trim();

    const logoTmpKey =
      (formData.get("logoKey")?.toString() ?? "").trim() || undefined;
    const coverTmpKey =
      (formData.get("coverKey")?.toString() ?? "").trim() || undefined;

    if (!orgId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Missing orgId",
        data: null,
      }) as ActionState;
    }
    if (!sponsorName) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Sponsor name is required",
        data: null,
      }) as ActionState;
    }

    const allowedTiers = new Set<SponsorTier>([
      "TITLE",
      "PLATINUM",
      "GOLD",
      "SILVER",
      "BRONZE",
      "COMMUNITY",
    ]);
    if (!allowedTiers.has(tier as SponsorTier)) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Invalid sponsor tier",
        data: null,
      }) as ActionState;
    }
    const tierValue = tier as SponsorTier;

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

    const baseSlug = slugify(sponsorName);

    const created = await prisma.$transaction(async (tx) => {
      const createSponsorWithSlug = async (slug: string) => {
        const sponsor = await tx.sponsor.create({
          data: {
            name: sponsorName,
            slug,
            websiteKey: sponsorWebsite || null,
            description: sponsorDescription || null,
            logoKey: null,
            coverKey: null,
          },
        });

        const link = await tx.organizationSponsor.create({
          data: {
            orgId,
            sponsorId: sponsor.id,
            tier: tierValue,
            isActive: true,
          },
        });

        const [finalLogoKey, finalCoverKey] = await Promise.all([
          logoTmpKey
            ? finalizeSponsorImageFromTmp({
                sponsorId: sponsor.id,
                kind: "logo",
                tmpKey: logoTmpKey,
              })
            : Promise.resolve(null),
          coverTmpKey
            ? finalizeSponsorImageFromTmp({
                sponsorId: sponsor.id,
                kind: "cover",
                tmpKey: coverTmpKey,
              })
            : Promise.resolve(null),
        ]);

        const updatedSponsor = await tx.sponsor.update({
          where: { id: sponsor.id },
          data: { logoKey: finalLogoKey, coverKey: finalCoverKey },
        });

        return { sponsor: updatedSponsor, link };
      };

      let nextSlug = baseSlug || crypto.randomBytes(3).toString("hex");

      for (let attempt = 0; attempt < 20; attempt++) {
        try {
          return await createSponsorWithSlug(nextSlug);
        } catch (e: unknown) {
          if (
            typeof e === "object" &&
            e &&
            (e as { code?: string }).code === "P2002"
          ) {
            nextSlug =
              attempt === 0 ? `${baseSlug}-2` : `${baseSlug}-${attempt + 2}`;
            continue;
          }
          throw e;
        }
      }

      const fallbackSlug = `${baseSlug}-${crypto.randomBytes(3).toString("hex")}`;
      return await createSponsorWithSlug(fallbackSlug);
    });

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: created,
    }) as ActionState;
  } catch (err) {
    console.error(err);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to add sponsor",
      data: null,
    }) as ActionState;
  }
};
