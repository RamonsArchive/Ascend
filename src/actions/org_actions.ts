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

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const createOrganization = async (
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN TO CREATE AN ORGANIZATION",
        data: null,
      }) as ActionState;
    }

    console.log("formData...", formData);

    const name = (formData.get("name")?.toString() ?? "").trim();
    const description = (formData.get("description")?.toString() ?? "").trim();
    const publicEmail = (formData.get("publicEmail")?.toString() ?? "").trim();
    const publicPhone = (formData.get("publicPhone")?.toString() ?? "").trim();
    const websiteUrl = (formData.get("websiteUrl")?.toString() ?? "").trim();
    const contactNote = (formData.get("contactNote")?.toString() ?? "").trim();

    // tmp keys coming from client after presigned uploads
    const logoTmpKey =
      (formData.get("logoKey")?.toString() ?? "").trim() || undefined;
    const coverTmpKey =
      (formData.get("coverKey")?.toString() ?? "").trim() || undefined;
    console.log("logoTmpKey", logoTmpKey);
    console.log("coverTmpKey", coverTmpKey);

    const isRateLimited = await checkRateLimit("createOrganization");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const baseSlug = slugify(name);

    const payload = {
      name,
      description,
      publicEmail,
      publicPhone,
      websiteUrl,
      contactNote,
      logoKey: logoTmpKey,
      coverKey: coverTmpKey,
    };
    console.log("payload", payload);
    const parsed = await newOrgServerFormSchema.safeParseAsync(payload);

    if (!parsed.success) {
      const msg =
        parsed.error.issues[0]?.message ?? "Invalid organization details.";
      return parseServerActionResponse({
        status: "ERROR",
        error: msg,
        data: null,
      }) as ActionState;
    }

    const organization = await prisma.$transaction(async (tx) => {
      // 1) Create org with placeholder keys (null for now)
      let newSlug = baseSlug;

      const createWithSlug = async (slug: string) => {
        const createdOrg = await tx.organization.create({
          data: {
            name,
            slug,
            description,
            publicEmail: publicEmail || null,
            publicPhone: publicPhone || null,
            websiteUrl: websiteUrl || null,
            contactNote: contactNote || null,
            logoKey: null,
            coverKey: null,
          },
        });

        await tx.orgMembership.create({
          data: {
            orgId: createdOrg.id,
            userId: session.user.id,
            role: "OWNER",
          },
        });

        // 2) Finalize uploads (copy tmp -> final, delete tmp)
        // Do this AFTER org exists so we can put it under orgId.
        const [finalLogoKey, finalCoverKey] = await Promise.all([
          logoTmpKey
            ? finalizeOrgImageFromTmp({
                orgId: createdOrg.id,
                kind: "logo",
                tmpKey: logoTmpKey,
              })
            : Promise.resolve(null),
          coverTmpKey
            ? finalizeOrgImageFromTmp({
                orgId: createdOrg.id,
                kind: "cover",
                tmpKey: coverTmpKey,
              })
            : Promise.resolve(null),
        ]);

        // 3) Update org with final keys
        const updatedOrg = await tx.organization.update({
          where: { id: createdOrg.id },
          data: {
            logoKey: finalLogoKey,
            coverKey: finalCoverKey,
          },
        });

        return updatedOrg;
      };

      for (let attempt = 0; attempt < 20; attempt++) {
        try {
          return await createWithSlug(newSlug);
        } catch (e: unknown) {
          if (
            typeof e === "object" &&
            e !== null &&
            "code" in e &&
            (e as { code?: string }).code === "P2002"
          ) {
            newSlug =
              attempt === 0 ? `${baseSlug}-2` : `${baseSlug}-${attempt + 2}`;
            continue;
          }
          throw e;
        }
      }

      const fallbackSlug = `${baseSlug}-${crypto.randomBytes(3).toString("hex")}`;
      return await createWithSlug(fallbackSlug);
    });

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: organization,
    }) as ActionState;
  } catch (err) {
    console.error(err);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to create organization",
      data: null,
    }) as ActionState;
  }
};

export async function updateOrgImage(opts: {
  orgId: string;
  kind: OrgAssetKind; // "logo" | "cover"
  tmpKey: string; // new tmp upload key
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");

  const finalKey = await finalizeOrgImageFromTmp({
    orgId: opts.orgId,
    kind: opts.kind,
    tmpKey: opts.tmpKey,
  });

  const data =
    opts.kind === "logo" ? { logoKey: finalKey } : { coverKey: finalKey };

  return prisma.organization.update({
    where: { id: opts.orgId },
    data,
  });
}

export const getAllOrganizations = async () => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN TO CREATE AN ORGANIZATION",
        data: null,
      }) as ActionState;
    }
    const isRateLimited = await checkRateLimit("getAllOrganizations");
    if (isRateLimited.status === "ERROR") return isRateLimited;
    const organizations = await prisma.organization.findMany({
      include: {
        memberships: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: organizations,
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to get all organizations",
      data: null,
    }) as ActionState;
  }
};

export const fetchOrgData = async (orgSlug: string) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN TO FETCH ORGANIZATION DATA",
        data: null,
      }) as ActionState;
    }
    const isRateLimited = await checkRateLimit("fetchOrgData");
    if (isRateLimited.status === "ERROR") return isRateLimited;
    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });
    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: org,
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to fetch organization data",
      data: null,
    }) as ActionState;
  }
};

export const isMemberofOrg = async (orgId: string, userId: string) => {
  try {
    const membership = await prisma.orgMembership.findUnique({
      where: { orgId_userId: { orgId, userId } },
    });
    if (!membership) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "User is not a member of the organization",
        data: null,
      }) as ActionState;
    }

    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return parseServerActionResponse({
        status: "ERROR",
        error: "User is not a member of the organization",
        data: null,
      }) as ActionState;
    }

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: membership,
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to check if user is a member of the organization",
      data: null,
    }) as ActionState;
  }
};
