"use server";

import { checkRateLimit } from "../lib/rate-limiter";
import { parseServerActionResponse } from "../lib/utils";
import { auth } from "../lib/auth";
import type { ActionState } from "../lib/global_types";
import { newOrgFormSchema } from "../lib/validation";
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

async function generateOrgSlug(name: string) {
  const base = slugify(name);
  // You can also do a quick query first, but it's still race-prone.
  // Best is to attempt and catch P2002 in a loop.
  return base;
}

export const createOrganization = async (
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
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

    const rawLogo = formData.get("logoFile");
    const rawCover = formData.get("coverFile");
    const logoFile =
      rawLogo instanceof File && rawLogo.size > 0 ? rawLogo : undefined;
    const coverFile =
      rawCover instanceof File && rawCover.size > 0 ? rawCover : undefined;

    const payload = {
      name,
      description,
      publicEmail,
      publicPhone,
      websiteUrl,
      logoFile,
      coverFile,
      contactNote,
    };

    const parsed = await newOrgFormSchema.safeParseAsync(payload);
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Invalid organization details.";
      return parseServerActionResponse({
        status: "ERROR",
        error: message,
        data: null,
      }) as ActionState;
    }

    const isRateLimited = await checkRateLimit("createOrganization");
    if (isRateLimited.status === "ERROR") {
      return isRateLimited as ActionState;
    }

    const baseSlug = slugify(name);

    const organization = await prisma.$transaction(async (tx) => {
      // retry for slug collisions
      let slug = baseSlug;

      for (let attempt = 0; attempt < 20; attempt++) {
        try {
          const createdOrg = await tx.organization.create({
            data: {
              name,
              slug,
              description,
              publicEmail,
              publicPhone,
              websiteUrl,
              contactNote,
              // logoUrl/coverUrl set AFTER upload step
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
        } catch (e: any) {
          // Prisma unique constraint
          if (e?.code === "P2002") {
            // increment slug: ascend -> ascend-2 -> ascend-3
            slug =
              attempt === 0 ? `${baseSlug}-2` : `${baseSlug}-${attempt + 2}`;
            continue;
          }
          throw e;
        }
      }

      // fallback if we somehow had 20 collisions
      slug = `${baseSlug}-${crypto.randomBytes(3).toString("hex")}`;
      const createdOrg = await tx.organization.create({
        data: {
          name,
          slug,
          description,
          publicEmail,
          publicPhone,
          websiteUrl,
          contactNote,
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
