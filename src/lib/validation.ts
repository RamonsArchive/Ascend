import { z } from "zod";
import { TEN_MB, validateImageFile } from "./utils";
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
  role: z.enum(["MEMBER", "ADMIN"]).default("MEMBER"),
  message: z.string().max(500, "Message is too long").optional(),
});

export const createOrgInviteLinkClientSchema = z.object({
  orgId: z.string().min(1, "Missing orgId"),
  role: z.enum(["MEMBER", "ADMIN"]).default("MEMBER"),
  note: z.string().max(200, "Note is too long").optional(),
  maxUses: z
    .number()
    .int("Max uses must be a whole number")
    .positive("Max uses must be positive")
    .max(10000, "Max uses too large")
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
