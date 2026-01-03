import { z } from "zod";
import {
  TEN_MB,
  validateImageFile,
  slugRegex,
  markdownRichSchema,
  optionalUrl,
  uniqueNames,
  jsonArrayFromString,
  optionalMapsShortUrl,
  optionalTrimmed,
} from "./utils";
import {
  EventRubricMode,
  EventStaffRole,
  OrgJoinMode,
  SponsorTier,
} from "@prisma/client";

const numFromString = z.union([z.string(), z.number()]).transform((v) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
});

const rubricCategoryDraftSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().max(300).optional().or(z.literal("")),
  weight: numFromString
    .refine((n) => !Number.isNaN(n), "Weight must be a number")
    .refine((n) => n >= 0 && n <= 100, "Weight must be between 0 and 100"),
  order: numFromString
    .refine((n) => !Number.isNaN(n), "Order must be a number")
    .refine((n) => Number.isInteger(n), "Order must be an integer")
    .refine((n) => n >= 0 && n <= 999, "Order out of range"),
});

const trackDraftSchema = z.object({
  name: z.string().trim().min(1, "Track name is required.").max(80),
  blurb: optionalTrimmed(400),
  order: z.number().int().min(0).max(999).optional(),
});

const awardDraftSchema = z.object({
  name: z.string().trim().min(1, "Award name is required.").max(80),
  blurb: optionalTrimmed(400),
  order: z.number().int().min(0).max(999).optional(),
  allowMultipleWinners: z.boolean().optional(),
});

const rubricModeSchema = z.enum([
  "NONE",
  "OPTIONAL",
  "REQUIRED",
] as EventRubricMode[]);

const rubricScaleMaxSchema = z
  .string()
  .transform((v) => Number(v))
  .refine((v) => v === 5 || v === 10, "Scale must be 5 or 10");

export const updateEventTeamSettingsClientSchema = z.object({
  eventId: z.string().min(1),
  maxTeamSize: z.coerce
    .number()
    .int("Max team size must be a whole number")
    .min(1)
    .max(50),
  lockTeamChangesAtStart: z.coerce.boolean(),
  allowSelfJoinRequests: z.coerce.boolean(),
});

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
      { message: "Phone number must be 10 digits" }
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
    })
  ),

  publicEmail: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().email({ message: "Invalid email address" }).optional()
  ),

  publicPhone: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9]{10}$/.test(val), {
      message: "Phone number must be 10 digits",
    }),

  websiteUrl: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().url({ message: "Invalid website URL" }).optional()
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
      { message: "Logo must be a PNG, JPG, or WEBP. Max size is 10MB." }
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
      { message: "Cover must be a PNG, JPG, or WEBP. Max size is 10MB." }
    ),

  contactNote: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z
      .string()
      .max(2000, { message: "Contact note must be less than 2000 characters" })
      .optional()
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
    z.string().min(1, { message: "Description is required" }).max(1000)
  ),

  publicEmail: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().email({ message: "Invalid email address" }).optional()
  ),

  publicPhone: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9]{10}$/.test(val), {
      message: "Phone number must be 10 digits",
    }),

  websiteUrl: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().url({ message: "Invalid website URL" }).optional()
  ),

  logoKey: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .max(512)
      .regex(S3_KEY_REGEX, { message: "Invalid logo key" })
      .optional()
  ),
  coverKey: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .max(512)
      .regex(S3_KEY_REGEX, { message: "Invalid cover key" })
      .optional()
  ),

  contactNote: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().max(2000).optional()
  ),
});

export const editOrgServerSchema = z.object({
  orgId: z.string().min(1),

  name: z.string().min(1).max(100),
  description: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().min(1).max(1000)
  ),

  publicEmail: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().email().optional()
  ),

  publicPhone: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9]{10}$/.test(val), {
      message: "Phone number must be 10 digits",
    }),

  websiteUrl: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().url().optional()
  ),

  contactNote: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().max(2000).optional()
  ),

  // tmp keys from client (after presigned upload)
  logoTmpKey: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().max(512).regex(S3_KEY_REGEX).optional()
  ),

  coverTmpKey: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().max(512).regex(S3_KEY_REGEX).optional()
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
    })
  ),

  publicEmail: z.preprocess(
    emptyToUndefined,
    z.string().email({ message: "Invalid email address" }).optional()
  ),

  publicPhone: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9]{10}$/.test(val), {
      message: "Phone number must be 10 digits",
    }),

  websiteUrl: z.preprocess(
    emptyToUndefined,
    z.string().url({ message: "Invalid website URL" }).optional()
  ),

  contactNote: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .max(2000, { message: "Contact note must be less than 2000 characters" })
      .optional()
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
      { message: "Logo must be a PNG, JPG, or WEBP. Max size is 10MB." }
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
      { message: "Cover must be a PNG, JPG, or WEBP. Max size is 10MB." }
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
    z.string().url({ message: "Invalid website URL" }).optional()
  ),
  sponsorDescription: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .max(2000, {
        message: "Description must be less than 2000 characters",
      })
      .optional()
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
      .optional()
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
    z.string().url({ message: "Invalid website URL" }).optional()
  ),
  sponsorDescription: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .max(2000, {
        message: "Description must be less than 2000 characters",
      })
      .optional()
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
      .optional()
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

    locationName: z.string().max(120, "Location name is too long.").optional(),
    locationAddress: z
      .string()
      .max(240, "Location address is too long.")
      .optional(),
    locationNotes: z
      .string()
      .max(1000, "Location notes is too long.")
      .optional(),
    locationMapUrl: optionalMapsShortUrl,
    rulesMarkdown: markdownRichSchema,
    rubricMarkdown: markdownRichSchema,
    rubricMode: rubricModeSchema.default("NONE"),
    rubricScaleMax: rubricScaleMaxSchema.default(10),
    rubricCategories: z
      .array(rubricCategoryDraftSchema)
      .max(25)
      .optional()
      .default([]),

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
    tracks: z.array(trackDraftSchema).max(50).optional().default([]),
    awards: z.array(awardDraftSchema).max(50).optional().default([]),
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
    if (val.tracks && !uniqueNames(val.tracks)) {
      ctx.addIssue({
        code: "custom",
        path: ["tracks"],
        message: "Track names must be unique.",
      });
    }

    if (val.awards && !uniqueNames(val.awards)) {
      ctx.addIssue({
        code: "custom",
        path: ["awards"],
        message: "Award names must be unique.",
      });
    }
    if (val.rubricMode !== "NONE") {
      if (!val.rubricCategories || val.rubricCategories.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["rubricCategories"],
          message:
            "Add at least one rubric category or set rubric mode to None.",
        });
      }

      if (val.rubricCategories && !uniqueNames(val.rubricCategories)) {
        ctx.addIssue({
          code: "custom",
          path: ["rubricCategories"],
          message: "Rubric category names must be unique.",
        });
      }
    }
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
  locationName: z.preprocess(emptyToUndefined, z.string().max(120).optional()),
  locationAddress: z.preprocess(
    emptyToUndefined,
    z.string().max(240).optional()
  ),
  locationNotes: z.preprocess(
    emptyToUndefined,
    z.string().max(1000).optional()
  ),
  locationMapUrl: z.preprocess(emptyToUndefined, optionalUrl),
  rulesRich: z.unknown().optional(), // we’ll build JSON server-side from markdown
  rubricRich: z.unknown().optional(),
  rubricMode: rubricModeSchema.default("NONE"),
  rubricScaleMax: z.coerce.number().refine((v) => v === 5 || v === 10),
  rubricCategoriesJson: z.string().optional(),
  rubricCategories: jsonArrayFromString(rubricCategoryDraftSchema).optional(),
  maxTeamSize: z.coerce.number().int().min(1).max(50),
  allowSelfJoinRequests: z.enum(["0", "1"]),
  lockTeamChangesAtStart: z.enum(["0", "1"]),
  requireImages: z.enum(["0", "1"]),
  requireVideoDemo: z.enum(["0", "1"]),
  coverKey: z.string().optional(),
  rulesMarkdown: markdownRichSchema,
  rubricMarkdown: markdownRichSchema,

  tracksJson: z.string().optional(),
  awardsJson: z.string().optional(),

  tracks: jsonArrayFromString(trackDraftSchema).optional(),
  awards: jsonArrayFromString(awardDraftSchema).optional(),
});

export const editEventDetailsClientSchema = z.object({
  orgId: z.string().min(1),
  eventId: z.string().min(1),

  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(64).regex(slugRegex, "Invalid slug"),

  heroTitle: z.string().max(80).optional().or(z.literal("")),
  heroSubtitle: z.string().max(180).optional().or(z.literal("")),

  type: z.string().min(1),
  visibility: z.string().min(1),
  joinMode: z.string().min(1),

  registrationOpensAt: z.string().optional().or(z.literal("")),
  registrationClosesAt: z.string().optional().or(z.literal("")),
  startAt: z.string().optional().or(z.literal("")),
  endAt: z.string().optional().or(z.literal("")),
  submitDueAt: z.string().optional().or(z.literal("")),
  locationName: z.string().max(120).optional().or(z.literal("")),
  locationAddress: z.string().max(240).optional().or(z.literal("")),
  locationNotes: z.string().max(1000).optional().or(z.literal("")),
  locationMapUrl: optionalMapsShortUrl.optional().or(z.literal("")),
  rulesMarkdown: z.string().max(20000).optional().or(z.literal("")),
  rubricMarkdown: z.string().max(20000).optional().or(z.literal("")),

  maxTeamSize: z.number().int().min(1).max(50),

  requireImages: z.boolean(),
  requireVideoDemo: z.boolean(),

  coverFile: z.any().optional(), // validated separately
  coverTmpKey: z.string().optional().or(z.literal("")),
  removeCover: z.boolean().optional(),
  tracks: z.array(trackDraftSchema).optional().default([]),
  awards: z.array(awardDraftSchema).optional().default([]),
});

export const updateEventDetailsServerSchema = z.object({
  orgId: z.string().min(1),
  eventId: z.string().min(1),

  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(64).regex(slugRegex),

  heroTitle: z.string().max(80).optional(),
  heroSubtitle: z.string().max(180).optional(),

  type: z.string().min(1),
  visibility: z.string().min(1),
  joinMode: z.string().min(1),

  registrationOpensAt: z.string().optional(),
  registrationClosesAt: z.string().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  submitDueAt: z.string().optional(),
  locationName: z.string().max(120).optional().or(z.literal("")),
  locationAddress: z.string().max(240).optional().or(z.literal("")),
  locationNotes: z.string().max(1000).optional().or(z.literal("")),
  locationMapUrl: z.httpUrl().optional().or(z.literal("")),
  rulesMarkdown: z.string().max(20000).optional().or(z.literal("")),
  rubricMarkdown: z.string().max(20000).optional().or(z.literal("")),

  maxTeamSize: z.number().int().min(1).max(50),

  requireImages: z.boolean(),
  requireVideoDemo: z.boolean(),

  coverTmpKey: z.string().optional(),
  removeCover: z.boolean().optional(),
  tracks: z.array(trackDraftSchema).optional().default([]),
  awards: z.array(awardDraftSchema).optional().default([]),
});

export const createEventInviteEmailClientSchema = z.object({
  eventId: z.string().min(1),
  email: z.string().email(),
  message: z.string().max(1000).optional(),
  minutesToExpire: z
    .number()
    .int()
    .min(60)
    .max(60 * 24 * 7 * 4)
    .optional(),
});

export const createEventInviteEmailServerSchema = z.object({
  eventId: z.string().min(1),
  email: z.string().email(),
  message: z.string().max(1000).optional(),
  minutesToExpire: z.string().optional(),
});

export const createEventInviteLinkClientSchema = z.object({
  eventId: z.string().min(1),
  note: z.string().max(1000).optional(),
  maxUses: z.number().int().min(1).max(100000).optional(),
  minutesToExpire: z
    .number()
    .int()
    .min(60)
    .max(60 * 24 * 7 * 4)
    .optional(),
});

export const createEventInviteLinkServerSchema = z.object({
  eventId: z.string().min(1),
  note: z.string().max(1000).optional(),
  maxUses: z.string().optional(),
  minutesToExpire: z.string().optional(),
});

export const createEventStaffInviteEmailClientSchema = z.object({
  eventId: z.string().min(1, "Event is required"),
  email: z.string().email("Enter a valid email"),
  role: z.enum(EventStaffRole),
  message: z.string().max(500, "Message is too long").optional(),
  minutesToExpire: z
    .number()
    .int()
    .positive()
    .max(60 * 24 * 7 * 4)
    .optional(), // up to 4 weeks
});

export const createEventStaffInviteLinkClientSchema = z.object({
  eventId: z.string().min(1, "Event is required"),
  role: z.enum(EventStaffRole),
  maxUses: z.number().int().positive().max(100000).optional(),
  minutesToExpire: z
    .number()
    .int()
    .positive()
    .max(60 * 24 * 7 * 4)
    .optional(), // up to 4 weeks
  note: z.string().max(1000, "Note is too long").optional(),
});

export const createEventStaffInviteEmailServerSchema = z.object({
  eventId: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1),
  message: z.string().max(1000).optional(),
  minutesToExpire: z.string().optional(),
});

export const createEventStaffInviteLinkServerSchema = z.object({
  eventId: z.string().min(1),
  role: z.string().min(1),
  maxUses: z.string().optional(),
  minutesToExpire: z.string().optional(),
  note: z.string().max(1000).optional(),
});

export const EventRegistrationRequestSchema = z.object({
  eventSlug: z.string().min(1),
  orgSlug: z.string().min(1),
  message: z.string().optional().nullable(),
});

export const ReviewRegistrationRequestSchema = z.object({
  eventId: z.string().min(1),
  requestId: z.string().min(1),
  decision: z.enum(["APPROVE", "DENY"]),
});

export const removeEventTeamClientSchema = z.object({
  eventId: z.string().min(1, "Missing eventId"),
  teamId: z.string().min(1, "Missing teamId"),
});

export const removeEventTeamMemberClientSchema = z.object({
  eventId: z.string().min(1, "Missing eventId"),
  teamMemberId: z.string().min(1, "Missing teamMemberId"),
});

export const removeEventParticipantClientSchema = z.object({
  eventId: z.string().min(1, "Missing eventId"),
  participantId: z.string().min(1, "Missing participantId"),
});

export const commonListEditorSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Name is required").max(80, "Too long"),
        blurb: z.string().trim().max(240, "Too long").optional(),
        order: z
          .string()
          .optional()
          .transform((v) => (v ?? "").replace(/[^\d]/g, "")),
      })
    )
    .max(50, "Too many items"),
});

export const addExistingSponsorToEventClientSchema = z.object({
  orgId: z.string().min(1),
  eventId: z.string().min(1),
  sponsorId: z.string().min(1, "Select a sponsor."),
  tier: z.string().min(1) as z.ZodType<SponsorTier>,
  isActive: z.boolean(),
  order: z.number().int().min(0).max(9999),
  displayName: optionalTrimmed(120),
  blurb: markdownRichSchema,
  logoFile: z.any().optional(),
});

export const editEventSponsorClientSchema = z.object({
  orgId: z.string().min(1),
  eventId: z.string().min(1),
  eventSponsorId: z.string().min(1),
  tier: z.string().min(1) as z.ZodType<SponsorTier>,
  isActive: z.boolean(),
  order: z.number().int().min(0).max(9999),
  displayName: optionalTrimmed(120),
  blurb: markdownRichSchema,
  logoFile: z.any().optional(),
  removeLogo: z.boolean().optional(),
});
