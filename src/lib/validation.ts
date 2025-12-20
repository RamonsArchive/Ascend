import { z } from "zod";
import { validateImageFile } from "./utils";

const TEN_MB = 10 * 1024 * 1024;
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

export const newOrgFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).max(100, {
    message: "Name must be less than 100 characters",
  }),
  description: z
    .string()
    .min(1, { message: "Description is required" })
    .max(1000, {
      message: "Description must be less than 1000 characters",
    }),
  publicEmail: z
    .string()
    .email({ message: "Invalid email address" })
    .optional(),
  publicPhone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true; // Allow empty/undefined
        return /^[0-9]{10}$/.test(val); // Validate if provided
      },
      { message: "Phone number must be 10 digits" }
    ),
  websiteUrl: z.string().url({ message: "Invalid website URL" }).optional(),
  logoFile: z
    .instanceof(File)
    .optional()
    .refine(
      (val) => {
        if (!val) return true; // Allow empty/undefined
        return validateImageFile({
          file: val as File | null | undefined,
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
    .instanceof(File)
    .optional()
    .refine(
      (val) => {
        if (!val) return true; // Allow empty/undefined
        return validateImageFile({
          file: val as File | null | undefined,
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
  contactNote: z
    .string()
    .min(1, { message: "Contact note is required" })
    .max(1000, {
      message: "Contact note must be less than 1000 characters",
    })
    .optional(),
});
