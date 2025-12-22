import type { SponsorTier } from "@/src/lib/global_types";
import crypto from "crypto";

export const parseServerActionResponse = <T>(response: T): T => {
  return JSON.parse(JSON.stringify(response));
};

// Phone number formatting
export const updatePhoneNumber = (
  value: string,
  phoneNumber: string,
  setPhoneNumber: (value: string) => void
) => {
  // If the user is backspacing and hit a dash, remove the digit before the dash
  const prevLength = phoneNumber.length;
  const newLength = value.length;

  // Check if user is backspacing on a dash
  if (newLength < prevLength) {
    const deletedChar = phoneNumber[newLength];
    if (deletedChar === "-") {
      // Remove the digit before the dash as well
      const withoutDash = phoneNumber.slice(0, newLength);
      const withoutLastDigit = withoutDash.slice(0, -1);
      setPhoneNumber(withoutLastDigit);
      return;
    }
  }

  // Normal processing
  const cleanedValue = value.replace(/[^0-9]/g, "");

  if (cleanedValue.length > 10) {
    return;
  }

  // Format the number
  let formattedValue = cleanedValue;
  if (cleanedValue.length >= 6) {
    formattedValue = `${cleanedValue.slice(0, 3)}-${cleanedValue.slice(
      3,
      6
    )}-${cleanedValue.slice(6, 10)}`;
  } else if (cleanedValue.length >= 3) {
    formattedValue = `${cleanedValue.slice(0, 3)}-${cleanedValue.slice(3)}`;
  }

  setPhoneNumber(formattedValue);
};

export const formDataToObject = (formData: FormData) => {
  const obj: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    obj[key] = value.toString();
  }
  return obj;
};

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "Not available";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return "Invalid date";
    }

    return dateObj.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Invalid date";
  }
}

const DEFAULT_ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

/**
 * Universal helper for validating uploaded image files on the client.
 * Backend should still validate independently.
 */
export function isAllowedImageFile(
  file: File | null | undefined,
  allowedMimeTypes: Set<string> = DEFAULT_ALLOWED_IMAGE_MIME_TYPES
) {
  if (!file) return false;
  return allowedMimeTypes.has(file.type);
}

export function getFileExtension(filename: string) {
  const idx = filename.lastIndexOf(".");
  if (idx === -1) return "";
  return filename.slice(idx + 1).toLowerCase();
}

export function isUnderFileSize(
  file: File | null | undefined,
  maxBytes: number
) {
  if (!file) return false;
  return file.size <= maxBytes;
}

export const TEN_MB = 10 * 1024 * 1024;

export const validateImageFile = ({
  file,
  options,
}: {
  file: File | null | undefined;
  options: { allowedMimeTypes: Set<string>; maxBytes: number };
}) => {
  if (!file) return false;
  if (!isAllowedImageFile(file, options.allowedMimeTypes)) return false;
  if (!isUnderFileSize(file, options.maxBytes)) return false;
  return true;
};

export function tierBadgeClasses(tier: SponsorTier) {
  switch (tier) {
    case "TITLE":
      return "bg-amber-400/15 text-amber-200 border-amber-400/20";
    case "PLATINUM":
      return "bg-sky-400/15 text-sky-200 border-sky-400/20";
    case "GOLD":
      return "bg-yellow-400/15 text-yellow-200 border-yellow-400/20";
    case "SILVER":
      return "bg-slate-300/15 text-slate-200 border-slate-300/20";
    case "BRONZE":
      return "bg-orange-400/15 text-orange-200 border-orange-400/20";
    case "COMMUNITY":
      return "bg-emerald-400/15 text-emerald-200 border-emerald-400/20";
    default:
      return "bg-white/5 text-white/70 border-white/10";
  }
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function makeToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString("hex");
}

export function parseOptionalInt(value: string | null) {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function parseOptionalDateFromMinutes(minutesStr: string | null) {
  if (!minutesStr) return null;
  const m = Number(minutesStr);
  if (!Number.isFinite(m) || m <= 0) return null;
  const d = new Date(Date.now() + m * 60_000);
  return d;
}

export function statusPill(
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED"
) {
  // same palette vibes as your app: whites, subtle borders
  switch (status) {
    case "PENDING":
      return "bg-white/5 border border-white/10 text-white/80";
    case "ACCEPTED":
      return "bg-white/10 border border-white/15 text-white";
    case "DECLINED":
      return "bg-white/5 border border-white/10 text-white/60";
    case "CANCELLED":
      return "bg-white/5 border border-white/10 text-white/60";
  }
}

export function statusLabel(
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED"
) {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "ACCEPTED":
      return "Approved";
    case "DECLINED":
      return "Declined";
    case "CANCELLED":
      return "Cancelled";
  }
}
