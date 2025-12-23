"use server";

import { checkRateLimit } from "../lib/rate-limiter";
import { parseServerActionResponse } from "../lib/utils";
import { auth } from "../lib/auth";
import type { ActionState } from "../lib/global_types";
import { newOrgServerFormSchema } from "../lib/validation";
import { prisma } from "../lib/prisma";
import { headers } from "next/headers";
import crypto from "crypto";
import {
  finalizeOrgImageFromTmp,
  OrgAssetKind,
  finalizeEventImageFromTmp,
} from "../lib/s3-upload";
import { OrgJoinMode } from "@prisma/client";
import { updateTag } from "next/cache";
import { slugify, parseDate, safeDate, slugRegex } from "../lib/utils";
import { createOrgEventServerSchema } from "../lib/validation";
import { z } from "zod";

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
      select: {
        id: true,
        name: true,
        description: true,
        publicEmail: true,
        publicPhone: true,
        websiteUrl: true,
        contactNote: true,
        logoKey: true,
        coverKey: true,
        allowJoinRequests: true,
        joinMode: true,
        memberships: { select: { userId: true, role: true } },
      },
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

export async function assertOrgAdminOrOwner(orgSlug: string, userId: string) {
  const org = await fetchOrgData(orgSlug);
  if (org.status === "ERROR" || !org.data)
    return parseServerActionResponse({
      status: "ERROR",
      error: "Organization not found",
      data: null,
    }) as ActionState;
  const orgId = (org.data as { id: string }).id;

  const membership = await prisma.orgMembership.findUnique({
    where: { orgId_userId: { orgId, userId } },
    select: { role: true },
  });
  if (!membership)
    return parseServerActionResponse({
      status: "ERROR",
      error: "User is not a member of the organization",
      data: null,
    }) as ActionState;
  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    return parseServerActionResponse({
      status: "ERROR",
      error: "Must be an admin or owner to perform this action",
      data: null,
    }) as ActionState;
  }
  return parseServerActionResponse({
    status: "SUCCESS",
    error: "",
    data: { orgId, userRole: membership.role },
  }) as ActionState;
}

export const assertOrgAdminOrOwnerWithId = async (
  orgId: string,
  userId: string
) => {
  try {
    const membership = await prisma.orgMembership.findUnique({
      where: { orgId_userId: { orgId, userId } },
      select: { role: true },
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
      data: { orgId, userRole: membership.role },
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

export const updateOrgJoinSettings = async (
  orgId: string,
  userId: string,
  opts: { joinMode?: OrgJoinMode; allowJoinRequests?: boolean }
): Promise<ActionState> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "MUST BE LOGGED IN TO UPDATE ORGANIZATION JOIN SETTINGS",
        data: null,
      }) as ActionState;
    }

    const isRateLimited = await checkRateLimit("updateOrgJoinSettings");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const hasPermissions = await assertOrgAdminOrOwnerWithId(orgId, userId);
    if (hasPermissions.status === "ERROR") return hasPermissions as ActionState;

    const current = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { joinMode: true, allowJoinRequests: true },
    });
    if (!current) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "ORGANIZATION NOT FOUND",
        data: null,
      }) as ActionState;
    }

    const nextJoinMode = opts.joinMode ?? current.joinMode;
    let nextAllow = opts.allowJoinRequests ?? current.allowJoinRequests;

    // enforce invariant
    if (nextJoinMode !== OrgJoinMode.REQUEST) nextAllow = false;

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: { joinMode: nextJoinMode, allowJoinRequests: nextAllow },
      select: { id: true, joinMode: true, allowJoinRequests: true },
    });

    updateTag(`org-join-settings-${orgId}`);

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: updated,
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to update organization join settings",
      data: null,
    }) as ActionState;
  }
};

export async function isOrgOwner(orgId: string, userId: string) {
  try {
    const membership = await prisma.orgMembership.findUnique({
      where: { orgId_userId: { orgId, userId } },
      select: { role: true },
    });

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: membership?.role === "OWNER",
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to check if user is the owner of the organization",
      data: null,
    }) as ActionState;
  }
}

export const createOrgEvent = async (
  _state: ActionState,
  fd: FormData
): Promise<ActionState> => {
  try {
    void _state;

    const isRateLimited = await checkRateLimit("createOrgEvent");
    if (isRateLimited.status === "ERROR") return isRateLimited as ActionState;

    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id ?? "";
    if (!userId) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Not authenticated",
        data: null,
      }) as ActionState;
    }

    const raw = {
      orgSlug: String(fd.get("orgSlug") ?? ""),
      name: String(fd.get("name") ?? ""),
      slug: fd.get("slug") ? String(fd.get("slug")) : undefined,
      type: String(fd.get("type") ?? ""),
      heroTitle: String(fd.get("heroTitle") ?? ""),
      heroSubtitle: fd.get("heroSubtitle")
        ? String(fd.get("heroSubtitle"))
        : undefined,
      visibility: String(fd.get("visibility") ?? ""),
      joinMode: String(fd.get("joinMode") ?? ""),
      registrationOpensAt: fd.get("registrationOpensAt")
        ? String(fd.get("registrationOpensAt"))
        : undefined,
      registrationClosesAt: fd.get("registrationClosesAt")
        ? String(fd.get("registrationClosesAt"))
        : undefined,
      startAt: fd.get("startAt") ? String(fd.get("startAt")) : undefined,
      endAt: fd.get("endAt") ? String(fd.get("endAt")) : undefined,
      submitDueAt: fd.get("submitDueAt")
        ? String(fd.get("submitDueAt"))
        : undefined,
      maxTeamSize: fd.get("maxTeamSize") ?? "5",
      allowSelfJoinRequests: String(fd.get("allowSelfJoinRequests") ?? "1"),
      lockTeamChangesAtStart: String(fd.get("lockTeamChangesAtStart") ?? "1"),
      requireImages: String(fd.get("requireImages") ?? "0"),
      requireVideoDemo: String(fd.get("requireVideoDemo") ?? "0"),
      coverKey: fd.get("coverKey") ? String(fd.get("coverKey")) : undefined,
    };

    const parsed = createOrgEventServerSchema.parse(raw);

    const org = await prisma.organization.findUnique({
      where: { slug: parsed.orgSlug },
      select: { id: true },
    });

    if (!org) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Organization not found",
        data: null,
      }) as ActionState;
    }

    // ✅ Only org ADMIN/OWNER can create events
    const membership = await prisma.orgMembership.findUnique({
      where: { orgId_userId: { orgId: org.id, userId } },
      select: { role: true },
    });

    if (
      !membership ||
      (membership.role !== "OWNER" && membership.role !== "ADMIN")
    ) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Must be an org admin or owner to create an event",
        data: null,
      }) as ActionState;
    }

    const slug =
      parsed.slug && parsed.slug.length > 0
        ? parsed.slug
        : slugify(parsed.name);

    if (!slug || !slugRegex.test(slug)) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Invalid slug",
        data: null,
      }) as ActionState;
    }

    // ensure unique within org
    const existing = await prisma.event.findUnique({
      where: { orgId_slug: { orgId: org.id, slug } },
      select: { id: true },
    });

    if (existing) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "An event with that slug already exists in this organization.",
        data: null,
      }) as ActionState;
    }

    const regOpen = safeDate(parseDate(parsed.registrationOpensAt));
    const regClose = safeDate(parseDate(parsed.registrationClosesAt));
    const startAt = safeDate(parseDate(parsed.startAt));
    const endAt = safeDate(parseDate(parsed.endAt));
    const submitDueAt = safeDate(parseDate(parsed.submitDueAt));

    if (regOpen && regClose && regOpen > regClose) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Registration close must be after open.",
        data: null,
      }) as ActionState;
    }

    if (startAt && endAt && startAt > endAt) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Event end must be after start.",
        data: null,
      }) as ActionState;
    }

    const created = await prisma.event.create({
      data: {
        orgId: org.id,
        name: parsed.name,
        slug,
        type: parsed.type,
        status: "DRAFT",
        heroTitle: parsed.heroTitle,
        heroSubtitle: parsed.heroSubtitle ?? null,
        visibility: parsed.visibility,
        joinMode: parsed.joinMode,
        registrationOpensAt: regOpen,
        registrationClosesAt: regClose,
        startAt,
        endAt,
        submitDueAt,
        maxTeamSize: parsed.maxTeamSize,
        allowSelfJoinRequests: parsed.allowSelfJoinRequests === "1",
        lockTeamChangesAtStart: parsed.lockTeamChangesAtStart === "1",
        requireImages: parsed.requireImages === "1",
        requireVideoDemo: parsed.requireVideoDemo === "1",
        coverKey: parsed.coverKey ?? null,
        // keep staffJoinMode default from schema unless you want to expose it in this form
      },
      select: { id: true, slug: true, name: true },
    });

    let finalCoverKey: string | null = null;

    if (parsed.coverKey) {
      finalCoverKey = await finalizeEventImageFromTmp({
        eventId: created.id,
        kind: "cover",
        tmpKey: parsed.coverKey,
      });

      await prisma.event.update({
        where: { id: created.id },
        data: { coverKey: finalCoverKey },
      });
    }

    updateTag(`event-${created.id}`);
    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: created,
    }) as ActionState;
  } catch (error) {
    console.error(error);

    if (error instanceof z.ZodError) {
      const msg = Object.values(z.flattenError(error).fieldErrors)
        .flat()
        .filter(Boolean)
        .join(", ");

      return parseServerActionResponse({
        status: "ERROR",
        error: msg || "Invalid form fields",
        data: null,
      }) as ActionState;
    }

    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to create event",
      data: null,
    }) as ActionState;
  }
};

export const fetchPublicOrgCountsData = async (orgSlug: string) => {
  try {
    const isRateLimited = await checkRateLimit("fetchPublicOrgCountsData");
    if (isRateLimited.status === "ERROR") return isRateLimited;
    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        logoKey: true,
        coverKey: true,
        _count: { select: { events: true, memberships: true, sponsors: true } },
      },
    });
    if (!org) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Organization not found",
        data: null,
      }) as ActionState;
    }
    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: org,
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to fetch public organization counts data",
      data: null,
    }) as ActionState;
  }
};
