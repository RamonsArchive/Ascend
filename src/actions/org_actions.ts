"use server";

import { checkRateLimit } from "../lib/rate-limiter";
import { parseServerActionResponse } from "../lib/utils";
import { auth } from "../lib/auth";
import type { ActionState } from "../lib/global_types";
import { newOrgServerFormSchema } from "../lib/validation";
import { prisma } from "../lib/prisma";
import { headers } from "next/headers";
import crypto from "crypto";

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

    const name = (formData.get("name")?.toString() ?? "").trim();
    const description = (formData.get("description")?.toString() ?? "").trim();
    const publicEmail = (formData.get("publicEmail")?.toString() ?? "").trim();
    const publicPhone = (formData.get("publicPhone")?.toString() ?? "").trim();
    const websiteUrl = (formData.get("websiteUrl")?.toString() ?? "").trim();
    const contactNote = (formData.get("contactNote")?.toString() ?? "").trim();

    // NEW: keys come as strings (already uploaded)
    const logoKey = (formData.get("logoKey")?.toString() ?? "").trim() || null;
    const coverKey =
      (formData.get("coverKey")?.toString() ?? "").trim() || null;

    // IMPORTANT: newOrgServerFormSchema must NOT require logoFile/coverFile as File anymore
    // Instead validate logoKey/coverKey as optional strings (or do it manually here)

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
      logoKey,
      coverKey,
    };

    const parsed = await newOrgServerFormSchema.safeParseAsync(payload);
    if (!parsed.success) {
      return parseServerActionResponse({
        status: "ERROR",
        error: parsed.error.message,
        data: null,
      }) as ActionState;
    }

    const organization = await prisma.$transaction(async (tx) => {
      let newSlug = baseSlug;

      for (let attempt = 0; attempt < 20; attempt++) {
        try {
          const createdOrg = await tx.organization.create({
            data: {
              name,
              slug: newSlug,
              description,
              publicEmail,
              publicPhone,
              websiteUrl,
              contactNote,
              logoKey,
              coverKey,
            },
          });

          await tx.orgMembership.create({
            data: {
              orgId: createdOrg.id,
              userId: session.user.id,
              role: "OWNER",
            },
          });

          return createdOrg;
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

      const slug = `${baseSlug}-${crypto.randomBytes(3).toString("hex")}`;
      const createdOrg = await tx.organization.create({
        data: {
          name,
          slug,
          description,
          publicEmail,
          publicPhone,
          websiteUrl,
          contactNote,
          logoKey,
          coverKey,
        },
      });

      await tx.orgMembership.create({
        data: { orgId: createdOrg.id, userId: session.user.id, role: "OWNER" },
      });

      return createdOrg;
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
