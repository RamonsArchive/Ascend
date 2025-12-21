"use server";

import crypto from "crypto";
import { headers } from "next/headers";
import { updateTag } from "next/cache";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { checkRateLimit } from "@/src/lib/rate-limiter";
import { parseServerActionResponse } from "@/src/lib/utils";
import type { ActionState } from "@/src/lib/global_types";
import { finalizeSponsorImageFromTmp } from "@/src/lib/s3-upload";
import { SponsorVisibility, type SponsorTier } from "@prisma/client";
import { deleteS3ObjectIfExists } from "@/src/actions/s3_actions";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const createSponsorProfile = async (
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

    const isRateLimited = await checkRateLimit("createSponsorProfile");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const sponsorName = (formData.get("sponsorName")?.toString() ?? "").trim();
    const sponsorWebsite = (
      formData.get("sponsorWebsite")?.toString() ?? ""
    ).trim();
    const sponsorDescription = (
      formData.get("sponsorDescription")?.toString() ?? ""
    ).trim();

    const logoTmpKey =
      (formData.get("logoKey")?.toString() ?? "").trim() || undefined;
    const coverTmpKey =
      (formData.get("coverKey")?.toString() ?? "").trim() || undefined;

    if (!sponsorName) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Sponsor name is required",
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
            createdById: session.user.id,
            visibility: SponsorVisibility.PRIVATE,
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

        return updatedSponsor;
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
    updateTag(`sponsor-${created.id}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: created,
    }) as ActionState;
  } catch (err) {
    console.error(err);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to create sponsor",
      data: null,
    }) as ActionState;
  }
};

export const updateSponsorProfile = async (
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

    const isRateLimited = await checkRateLimit("updateSponsorProfile");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const sponsorId = (formData.get("sponsorId")?.toString() ?? "").trim();
    const name = (formData.get("sponsorName")?.toString() ?? "").trim();
    const websiteKey = (
      formData.get("sponsorWebsite")?.toString() ?? ""
    ).trim();
    const description = (
      formData.get("sponsorDescription")?.toString() ?? ""
    ).trim();

    const logoTmpKey =
      (formData.get("logoKey")?.toString() ?? "").trim() || undefined;
    const coverTmpKey =
      (formData.get("coverKey")?.toString() ?? "").trim() || undefined;

    const removeLogo =
      (formData.get("removeLogo")?.toString() ?? "") === "true";
    const removeCover =
      (formData.get("removeCover")?.toString() ?? "") === "true";

    if (!sponsorId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Missing sponsorId",
        data: null,
      }) as ActionState;
    }

    const existing = await prisma.sponsor.findUnique({
      where: { id: sponsorId },
      select: { id: true, createdById: true, logoKey: true, coverKey: true },
    });

    if (!existing) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Sponsor not found",
        data: null,
      }) as ActionState;
    }

    if (existing.createdById !== session.user.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "NOT_AUTHORIZED",
        data: null,
      }) as ActionState;
    }

    const result = await prisma.$transaction(async (tx) => {
      const [newLogoFinal, newCoverFinal] = await Promise.all([
        logoTmpKey
          ? finalizeSponsorImageFromTmp({
              sponsorId,
              kind: "logo",
              tmpKey: logoTmpKey,
            })
          : Promise.resolve(null),
        coverTmpKey
          ? finalizeSponsorImageFromTmp({
              sponsorId,
              kind: "cover",
              tmpKey: coverTmpKey,
            })
          : Promise.resolve(null),
      ]);

      const nextLogoKey = removeLogo
        ? null
        : (newLogoFinal ?? existing.logoKey ?? null);

      const nextCoverKey = removeCover
        ? null
        : (newCoverFinal ?? existing.coverKey ?? null);

      const updated = await tx.sponsor.update({
        where: { id: sponsorId },
        data: {
          name: name || undefined,
          websiteKey: websiteKey || null,
          description: description || null,
          logoKey: nextLogoKey,
          coverKey: nextCoverKey,
        },
      });

      return {
        updated,
        oldLogoKey: existing.logoKey,
        oldCoverKey: existing.coverKey,
        newLogoFinal,
        newCoverFinal,
      };
    });

    if (result.newLogoFinal || removeLogo) {
      if (result.oldLogoKey && result.oldLogoKey !== result.updated.logoKey) {
        await deleteS3ObjectIfExists(result.oldLogoKey);
      }
    }

    if (result.newCoverFinal || removeCover) {
      if (
        result.oldCoverKey &&
        result.oldCoverKey !== result.updated.coverKey
      ) {
        await deleteS3ObjectIfExists(result.oldCoverKey);
      }
    }

    updateTag(`sponsor-${sponsorId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: result.updated,
    }) as ActionState;
  } catch (err) {
    console.error(err);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to update sponsor",
      data: null,
    }) as ActionState;
  }
};

export const setSponsorVisibility = async (
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

    const isRateLimited = await checkRateLimit("setSponsorVisibility");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const sponsorId = (formData.get("sponsorId")?.toString() ?? "").trim();
    const visibility = (formData.get("visibility")?.toString() ?? "").trim();

    if (!sponsorId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Missing sponsorId",
        data: null,
      }) as ActionState;
    }

    const allowed = new Set<string>(["PUBLIC", "PRIVATE"]);
    if (!allowed.has(visibility)) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Invalid visibility",
        data: null,
      }) as ActionState;
    }

    const existing = await prisma.sponsor.findUnique({
      where: { id: sponsorId },
      select: { id: true, createdById: true },
    });
    if (!existing) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Sponsor not found",
        data: null,
      }) as ActionState;
    }

    if (existing.createdById !== session.user.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "NOT_AUTHORIZED",
        data: null,
      }) as ActionState;
    }

    const updated = await prisma.sponsor.update({
      where: { id: sponsorId },
      data: {
        visibility:
          visibility === "PUBLIC"
            ? SponsorVisibility.PUBLIC
            : SponsorVisibility.PRIVATE,
      },
    });

    updateTag(`sponsor-${sponsorId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: updated,
    }) as ActionState;
  } catch (err) {
    console.error(err);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to update sponsor visibility",
      data: null,
    }) as ActionState;
  }
};

export const fetchSponsorLibrary = async (
  query?: string,
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

    const isRateLimited = await checkRateLimit("fetchSponsorLibrary");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const q = (query ?? "").trim();
    const userId = session.user.id;

    const sponsors = await prisma.sponsor.findMany({
      where: {
        AND: [
          {
            OR: [
              { createdById: userId },
              { visibility: SponsorVisibility.PUBLIC },
            ],
          },
          q
            ? {
                OR: [
                  { name: { contains: q } },
                  { websiteKey: { contains: q } },
                ],
              }
            : {},
        ],
      },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        websiteKey: true,
        description: true,
        logoKey: true,
        coverKey: true,
        visibility: true,
        createdById: true,
        updatedAt: true,
      },
    });

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: sponsors,
    }) as ActionState;
  } catch (err) {
    console.error(err);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to fetch sponsor library",
      data: null,
    }) as ActionState;
  }
};

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

export const addExistingSponsorToOrg = async (
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

    const isRateLimited = await checkRateLimit("addExistingSponsorToOrg");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const orgId = (formData.get("orgId")?.toString() ?? "").trim();
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

    if (!orgId || !sponsorId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Missing orgId or sponsorId",
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

    await assertAdminOrOwner(orgId, session.user.id);

    let finalLogoKey: string | null = null;
    if (logoTmpKey) {
      finalLogoKey = await finalizeSponsorImageFromTmp({
        sponsorId,
        kind: "logo",
        tmpKey: logoTmpKey,
      });
    }

    try {
      const created = await prisma.organizationSponsor.create({
        data: {
          orgId,
          sponsorId,
          tier: tier as SponsorTier,
          isActive,
          order: Math.max(0, order),
          displayName: displayName || null,
          blurb: blurb || null,
          logoKey: finalLogoKey,
        },
      });

      updateTag(`org-sponsors-${orgId}`);

      return parseServerActionResponse({
        status: "SUCCESS",
        error: "",
        data: created,
      }) as ActionState;
    } catch (e: unknown) {
      if (
        typeof e === "object" &&
        e &&
        (e as { code?: string }).code === "P2002"
      ) {
        return parseServerActionResponse({
          status: "ERROR",
          error: "Sponsor is already added to this organization.",
          data: null,
        }) as ActionState;
      }
      throw e;
    }
  } catch (err) {
    console.error(err);
    const msg =
      err instanceof Error && err.message === "NOT_AUTHORIZED"
        ? "NOT_AUTHORIZED"
        : "Failed to add sponsor to organization";

    return parseServerActionResponse({
      status: "ERROR",
      error: msg,
      data: null,
    }) as ActionState;
  }
};

export const fetchOrgSponsors = async (orgId: string): Promise<ActionState> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN",
        data: null,
      }) as ActionState;
    }

    const isRateLimited = await checkRateLimit("fetchOrgSponsors");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    await assertAdminOrOwner(orgId, session.user.id);

    const sponsors = await prisma.organizationSponsor.findMany({
      where: { orgId },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: {
        sponsor: {
          select: {
            id: true,
            name: true,
            slug: true,
            websiteKey: true,
            description: true,
            logoKey: true,
            coverKey: true,
          },
        },
      },
    });

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: sponsors,
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to fetch org sponsors",
      data: null,
    }) as ActionState;
  }
};

export const fetchAllPublicSponsors = async (): Promise<ActionState> => {
  try {
    const isRateLimited = await checkRateLimit("fetchAllPublicSponsors");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const sponsors = await prisma.sponsor.findMany({
      where: { visibility: SponsorVisibility.PUBLIC },
    });
    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: sponsors,
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to fetch all public sponsors",
      data: null,
    }) as ActionState;
  }
};
