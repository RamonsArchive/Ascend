import { z } from "zod";
import { TEN_MB, validateImageFile, slugRegex } from "./utils";
import { OrgJoinMode } from "@prisma/client";

const emptyToUndefined = (v: unknown) => {
  if (v == null) return undefined; // handles null + undefined
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
};

export const contactFormSchema = z.object({
  firstName: z.string().min(1, { message: "Name is required" }).max(20, {
    message: "Name must be less than 20 characters",
  }),
  lastName: z.string().min(1, { message: "Last name is required" }).max(20, {
    message: "Last name must be less than 20 characters",
  }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true; // Allow empty/undefined
        return /^[0-9]{10}$/.test(val); // Validate if provided
      },
      { message: "Phone number must be 10 digits" },
    ),
  organization: z.string().optional(),
  message: z.string().min(1, { message: "Message is required" }).max(500, {
    message: "Message must be less than 500 characters",
  }),
});

export const loginFormSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const newOrgClientFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Organization name is required" })
    .max(100, {
      message: "Name must be less than 100 characters",
    }),

  description: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().min(1, { message: "Description is required" }).max(1000, {
      message: "Description must be less than 1000 characters",
    }),
  ),

  publicEmail: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().email({ message: "Invalid email address" }).optional(),
  ),

  publicPhone: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9]{10}$/.test(val), {
      message: "Phone number must be 10 digits",
    }),

  websiteUrl: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().url({ message: "Invalid website URL" }).optional(),
  ),

  logoFile: z
    .custom<File | undefined>((val) => val == null || val instanceof File, {
      message: "Invalid logo file",
    })
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return validateImageFile({
          file: val,
          options: {
            allowedMimeTypes: new Set([
              "image/png",
              "image/jpeg",
              "image/webp",
            ]),
            maxBytes: TEN_MB,
          },
        });
      },
      { message: "Logo must be a PNG, JPG, or WEBP. Max size is 10MB." },
    ),

  coverFile: z
    .custom<File | undefined>((val) => val == null || val instanceof File, {
      message: "Invalid cover file",
    })
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return validateImageFile({
          file: val,
          options: {
            allowedMimeTypes: new Set([
              "image/png",
              "image/jpeg",
              "image/webp",
            ]),
            maxBytes: TEN_MB,
          },
        });
      },
      { message: "Cover must be a PNG, JPG, or WEBP. Max size is 10MB." },
    ),

  contactNote: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z
      .string()
      .max(2000, { message: "Contact note must be less than 2000 characters" })
      .optional(),
  ),
});

const S3_KEY_REGEX = /^[a-z0-9!_.*'()-]+(?:\/[a-z0-9!_.*'()-]+)*$/i;

export const newOrgServerFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Organization name is required" })
    .max(100),

  description: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().min(1, { message: "Description is required" }).max(1000),
  ),

  publicEmail: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().email({ message: "Invalid email address" }).optional(),
  ),

  publicPhone: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9]{10}$/.test(val), {
      message: "Phone number must be 10 digits",
    }),

  websiteUrl: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().url({ message: "Invalid website URL" }).optional(),
  ),

  logoKey: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .max(512)
      .regex(S3_KEY_REGEX, { message: "Invalid logo key" })
      .optional(),
  ),
  coverKey: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .max(512)
      .regex(S3_KEY_REGEX, { message: "Invalid cover key" })
      .optional(),
  ),

  contactNote: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().max(2000).optional(),
  ),
});

export const editOrgServerSchema = z.object({
  orgId: z.string().min(1),

  name: z.string().min(1).max(100),
  description: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().min(1).max(1000),
  ),

  publicEmail: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().email().optional(),
  ),

  publicPhone: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9]{10}$/.test(val), {
      message: "Phone number must be 10 digits",
    }),

  websiteUrl: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().url().optional(),
  ),

  contactNote: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().max(2000).optional(),
  ),

  // tmp keys from client (after presigned upload)
  logoTmpKey: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().max(512).regex(S3_KEY_REGEX).optional(),
  ),

  coverTmpKey: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().max(512).regex(S3_KEY_REGEX).optional(),
  ),

  removeLogo: z.boolean().optional(),
  removeCover: z.boolean().optional(),
});

export const editOrgClientSchema = z.object({
  orgId: z.string().min(1, { message: "Missing organization id" }),

  name: z
    .string()
    .min(1, { message: "Organization name is required" })
    .max(100, { message: "Name must be less than 100 characters" }),

  description: z.preprocess(
    emptyToUndefined,
    z.string().min(1, { message: "Description is required" }).max(1000, {
      message: "Description must be less than 1000 characters",
    }),
  ),

  publicEmail: z.preprocess(
    emptyToUndefined,
    z.string().email({ message: "Invalid email address" }).optional(),
  ),

  publicPhone: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9]{10}$/.test(val), {
      message: "Phone number must be 10 digits",
    }),

  websiteUrl: z.preprocess(
    emptyToUndefined,
    z.string().url({ message: "Invalid website URL" }).optional(),
  ),

  contactNote: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .max(2000, { message: "Contact note must be less than 2000 characters" })
      .optional(),
  ),

  logoFile: z
    .custom<File | undefined>((val) => val == null || val instanceof File, {
      message: "Invalid logo file",
    })
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return validateImageFile({
          file: val,
          options: {
            allowedMimeTypes: new Set([
              "image/png",
              "image/jpeg",
              "image/webp",
            ]),
            maxBytes: TEN_MB,
          },
        });
      },
      { message: "Logo must be a PNG, JPG, or WEBP. Max size is 10MB." },
    ),

  coverFile: z
    .custom<File | undefined>((val) => val == null || val instanceof File, {
      message: "Invalid cover file",
    })
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return validateImageFile({
          file: val,
          options: {
            allowedMimeTypes: new Set([
              "image/png",
              "image/jpeg",
              "image/webp",
            ]),
            maxBytes: TEN_MB,
          },
        });
      },
      { message: "Cover must be a PNG, JPG, or WEBP. Max size is 10MB." },
    ),

  removeLogo: z.boolean().optional(),
  removeCover: z.boolean().optional(),
});

export const createSponsorProfileClientSchema = z.object({
  sponsorName: z
    .string()
    .min(1, { message: "Sponsor name is required" })
    .max(100),
  sponsorWebsite: z.preprocess(
    emptyToUndefined,
    z.string().url({ message: "Invalid website URL" }).optional(),
  ),
  sponsorDescription: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .max(2000, {
        message: "Description must be less than 2000 characters",
      })
      .optional(),
  ),
  logoFile: z
    .custom<File | undefined>((val) => val == null || val instanceof File, {
      message: "Invalid logo file",
    })
    .optional(),
  coverFile: z
    .custom<File | undefined>((val) => val == null || val instanceof File, {
      message: "Invalid cover file",
    })
    .optional(),
});

export const addExistingSponsorToOrgClientSchema = z.object({
  orgId: z.string().min(1),
  sponsorId: z.string().min(1),
  tier: z.enum(["TITLE", "PLATINUM", "GOLD", "SILVER", "BRONZE", "COMMUNITY"]),
  isActive: z.boolean(),
  order: z
    .number()
    .int()
    .min(0, { message: "Order must be 0 or greater" })
    .max(9999, { message: "Order is too large" }),
  displayName: z.preprocess(emptyToUndefined, z.string().max(120).optional()),
  blurb: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .max(2000, { message: "Blurb must be less than 2000 characters" })
      .optional(),
  ),
  logoFile: z
    .custom<File | undefined>((val) => val == null || val instanceof File, {
      message: "Invalid logo file",
    })
    .optional(),
});

export const updateSponsorProfileClientSchema = z.object({
  sponsorId: z.string().min(1),
  sponsorName: z
    .string()
    .min(1, { message: "Sponsor name is required" })
    .max(100),
  sponsorWebsite: z.preprocess(
    emptyToUndefined,
    z.string().url({ message: "Invalid website URL" }).optional(),
  ),
  sponsorDescription: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .max(2000, {
        message: "Description must be less than 2000 characters",
      })
      .optional(),
  ),
  logoFile: z
    .custom<File | undefined>((val) => val == null || val instanceof File, {
      message: "Invalid logo file",
    })
    .optional(),
  coverFile: z
    .custom<File | undefined>((val) => val == null || val instanceof File, {
      message: "Invalid cover file",
    })
    .optional(),
  removeLogo: z.boolean().optional(),
  removeCover: z.boolean().optional(),
});

export const editOrgSponsorClientSchema = z.object({
  orgId: z.string().min(1),
  sponsorId: z.string().min(1),
  tier: z.enum(["TITLE", "PLATINUM", "GOLD", "SILVER", "BRONZE", "COMMUNITY"]),
  isActive: z.boolean(),
  displayName: z.preprocess(emptyToUndefined, z.string().max(120).optional()),
  blurb: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .max(2000, { message: "Blurb must be less than 2000 characters" })
      .optional(),
  ),
  order: z
    .number()
    .int()
    .min(0, { message: "Order must be 0 or greater" })
    .max(9999, { message: "Order is too large" }),
  logoFile: z
    .custom<File | undefined>((val) => val == null || val instanceof File, {
      message: "Invalid logo file",
    })
    .optional(),
  removeLogo: z.boolean().optional(),
});

export const createOrgInviteEmailClientSchema = z.object({
  orgId: z.string().min(1, "Missing orgId"),
  email: z.string().email("Enter a valid email"),
  message: z.string().max(500, "Message is too long").optional(),
});

export const createOrgInviteLinkClientSchema = z.object({
  orgId: z.string().min(1, "Missing orgId"),
  note: z.string().max(200, "Note is too long").optional(),
  maxUses: z
    .number()
    .int("Max uses must be a whole number")
    .positive("Max uses must be positive")
    .max(10000, "Max uses too large")
    .optional(),
  minutesToExpire: z
    .number()
    .int("Minutes to expire must be a whole number")
    .positive("Minutes to expire must be positive")
    .min(60, "Minutes to expire must be at least 1 hour")
    .max(60 * 24 * 7 * 4, "Minutes to expire is too large") // 1 week by default
    .optional(),
});

export const orgJoinRequestDecisionClientSchema = z.object({
  joinRequestId: z.string().min(1, "Missing joinRequestId"),
  decision: z.enum(["APPROVE", "REJECT"]),
});

export const editOrgJoinSettingsClientSchema = z
  .object({
    orgId: z.string().min(1, "Organization is required."),
    joinMode: z.enum(["INVITE_ONLY", "REQUEST", "OPEN"] as [
      OrgJoinMode,
      ...OrgJoinMode[],
    ]),
    allowJoinRequests: z.boolean(),
  })
  .superRefine((v, ctx) => {
    // keep invariant consistent with server
    if (v.joinMode !== OrgJoinMode.REQUEST && v.allowJoinRequests) {
      ctx.addIssue({
        code: "custom",
        path: ["allowJoinRequests"],
        message: "Join requests can only be enabled when Join mode is REQUEST.",
      });
    }
  });

export const createOrgEventClientSchema = z
  .object({
    orgSlug: z.string().min(1),
    name: z.string().min(2, "Event name is required."),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(slugRegex, "Slug must be lowercase and use hyphens only.")
      .optional(),
    type: z.enum(["HACKATHON", "IDEATHON"]),
    heroTitle: z.string().min(2, "Hero title is required."),
    heroSubtitle: z.string().max(600, "Subtitle is too long.").optional(),

    visibility: z.enum(["PUBLIC_LISTED", "PUBLIC_UNLISTED", "PRIVATE"]),
    joinMode: z.enum(["OPEN", "REQUEST", "INVITE_ONLY"]),

    registrationOpensAt: z.string().optional(),
    registrationClosesAt: z.string().optional(),
    startAt: z.string().optional(),
    endAt: z.string().optional(),
    submitDueAt: z.string().optional(),

    maxTeamSize: z
      .string()
      .transform((v) => Number(v))
      .refine((v) => Number.isInteger(v), "Must be an integer")
      .refine((v) => v >= 1 && v <= 50, "Team size must be between 1 and 50"),

    allowSelfJoinRequests: z.boolean(),
    lockTeamChangesAtStart: z.boolean(),
    requireImages: z.boolean(),
    requireVideoDemo: z.boolean(),

    coverFile: z.instanceof(File).optional(),
  })
  .superRefine((val, ctx) => {
    const parse = (s?: string) => (s ? new Date(s) : null);
    const regOpen = parse(val.registrationOpensAt);
    const regClose = parse(val.registrationClosesAt);
    const start = parse(val.startAt);
    const end = parse(val.endAt);
    const submitDue = parse(val.submitDueAt);

    const isValid = (d: Date | null) => (d ? !Number.isNaN(d.getTime()) : true);

    if (!isValid(regOpen))
      ctx.addIssue({
        code: "custom",
        path: ["registrationOpensAt"],
        message: "Invalid date/time.",
      });

    if (!isValid(regClose))
      ctx.addIssue({
        code: "custom",
        path: ["registrationClosesAt"],
        message: "Invalid date/time.",
      });

    if (!isValid(start))
      ctx.addIssue({
        code: "custom",
        path: ["startAt"],
        message: "Invalid date/time.",
      });

    if (!isValid(end))
      ctx.addIssue({
        code: "custom",
        path: ["endAt"],
        message: "Invalid date/time.",
      });

    if (!isValid(submitDue))
      ctx.addIssue({
        code: "custom",
        path: ["submitDueAt"],
        message: "Invalid date/time.",
      });

    if (regOpen && regClose && regOpen > regClose)
      ctx.addIssue({
        code: "custom",
        path: ["registrationClosesAt"],
        message: "Registration close must be after open.",
      });

    if (start && end && start > end)
      ctx.addIssue({
        code: "custom",
        path: ["endAt"],
        message: "End time must be after start time.",
      });

    if (end && submitDue && submitDue > end)
      ctx.addIssue({
        code: "custom",
        path: ["submitDueAt"],
        message: "Submission due should be before event end (or leave blank).",
      });

    if (start && submitDue && submitDue < start)
      ctx.addIssue({
        code: "custom",
        path: ["submitDueAt"],
        message: "Submission due should be after event start (or leave blank).",
      });
  });

export const createOrgEventServerSchema = z.object({
  orgSlug: z.string().min(1),
  name: z.string().min(2),
  slug: z.string().trim().toLowerCase().regex(slugRegex).optional(),
  type: z.enum(["HACKATHON", "IDEATHON"]),
  heroTitle: z.string().min(2),
  heroSubtitle: z.string().max(600).optional(),
  visibility: z.enum(["PUBLIC_LISTED", "PUBLIC_UNLISTED", "PRIVATE"]),
  joinMode: z.enum(["OPEN", "REQUEST", "INVITE_ONLY"]),
  registrationOpensAt: z.string().optional(),
  registrationClosesAt: z.string().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  submitDueAt: z.string().optional(),
  maxTeamSize: z.coerce.number().int().min(1).max(50),
  allowSelfJoinRequests: z.enum(["0", "1"]),
  lockTeamChangesAtStart: z.enum(["0", "1"]),
  requireImages: z.enum(["0", "1"]),
  requireVideoDemo: z.enum(["0", "1"]),
  coverKey: z.string().optional(),
});
