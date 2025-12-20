import { z } from "zod";
import { TEN_MB, validateImageFile } from "./utils";
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

export const newOrgFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Organization name is required" })
    .max(100, {
      message: "Name must be less than 100 characters",
    }),
  // Description can be plain text or Markdown (stored as a string).
  description: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z
      .string()
      .max(1000, { message: "Description must be less than 1000 characters" })
      .optional(),
  ),
  publicEmail: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().email({ message: "Invalid email address" }).optional(),
  ),
  publicPhone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true; // Allow empty/undefined
        return /^[0-9]{10}$/.test(val); // Validate if provided
      },
      { message: "Phone number must be 10 digits" },
    ),
  websiteUrl: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().url({ message: "Invalid website URL" }).optional(),
  ),
  logoFile: z
    .custom<File | undefined>(
      (val) => val === undefined || val === null || val instanceof File,
      { message: "Invalid logo file" },
    )
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
    .custom<File | undefined>(
      (val) => val === undefined || val === null || val instanceof File,
      { message: "Invalid cover file" },
    )
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
  // Contact note is Markdown, stored as a string. Optional, but if present validate length.
  contactNote: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z
      .string()
      .max(2000, { message: "Contact note must be less than 2000 characters" })
      .optional(),
  ),
});
