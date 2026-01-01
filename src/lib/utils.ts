import type { SponsorTier, OrgMember, Member } from "@/src/lib/global_types";
import { EventType } from "@prisma/client";
import type {
  EventLikeForTime,
  PublicEventListItem,
} from "@/src/lib/global_types";
import crypto from "crypto";
import { z } from "zod";

export const parseServerActionResponse = <T>(response: T): T => {
  return JSON.parse(JSON.stringify(response));
};

// Phone number formatting
export const updatePhoneNumber = (
  value: string,
  phoneNumber: string,
  setPhoneNumber: (value: string) => void,
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
      6,
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

export function formatDateRange(
  startAt: Date | string | null | undefined,
  endAt: Date | string | null | undefined,
) {
  const toValidDate = (v: Date | string | null | undefined) => {
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v);
    return Number.isFinite(d.getTime()) ? d : null;
  };

  const startD = toValidDate(startAt);
  const endD = toValidDate(endAt);

  if (!startD && !endD) return null;

  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  const start = startD ? fmt.format(startD) : null;
  const end = endD ? fmt.format(endD) : null;

  if (start && end) return `${start} → ${end}`;
  return start ?? end;
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
  allowedMimeTypes: Set<string> = DEFAULT_ALLOWED_IMAGE_MIME_TYPES,
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
  maxBytes: number,
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
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED",
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
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED",
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

export const humanizeJoinError = (code: string) => {
  switch (code) {
    case "INVITE_INVALID":
    case "LINK_INVALID":
      return "This invite link is invalid.";
    case "INVITE_EXPIRED":
    case "LINK_EXPIRED":
      return "This invite link has expired.";
    case "LINK_MAX_USES_REACHED":
      return "This invite link has reached its max uses.";
    case "EMAIL_MISMATCH":
      return "You’re logged in with a different email than the invite was sent to.";
    case "ALREADY_MEMBER":
      return "You’re already a member of this organization.";
    case "MUST BE LOGGED IN":
      return "Please log in to continue.";
    default:
      return "Something went wrong. Please try again.";
  }
};

export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const slugify = (input: string) =>
  input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);

export const parseDate = (s?: string) => (s ? new Date(s) : null);
export const safeDate = (d: Date | null) =>
  d && !Number.isNaN(d.getTime()) ? d : null;

export function getEventBucket(e: EventLikeForTime, now: Date) {
  const start = e.startAt ? new Date(e.startAt) : null;
  const end = e.endAt ? new Date(e.endAt) : null;

  if (!start && !end) return "UPCOMING";
  if (start && start > now) return "UPCOMING";
  if (end && end < now) return "PAST";
  if (start && start <= now && (!end || end >= now)) return "LIVE";

  return "UPCOMING";
}

export function yearOf(d: Date | null) {
  return d ? d.getFullYear() : null;
}

export function getRelevantYear(e: EventLikeForTime) {
  const startYear = yearOf(e.startAt ? new Date(e.startAt) : null);
  if (startYear) return startYear;

  // fallback to createdAt if available
  if (e.createdAt) return new Date(e.createdAt).getFullYear();

  // final fallback (should be rare)
  return new Date().getFullYear();
}

export function typeLabel(t: EventType | "ALL") {
  if (t === "ALL") return "All";
  if (t === "HACKATHON") return "Hackathon";
  if (t === "IDEATHON") return "Ideathon";
  return "Unknown";
}

export const rolePillClasses = (role: OrgMember["role"]) => {
  switch (role) {
    case "OWNER":
      return "bg-white text-primary-950 border-white";
    case "ADMIN":
      return "bg-white/10 text-white border-white/15";
    case "MEMBER":
    default:
      return "bg-white/5 text-white/80 border-white/10";
  }
};

export const getBaseUrl = () => {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
  );
};

export function statusBadgeClasses(status: string) {
  const s = (status || "").toUpperCase();
  if (s === "REGISTERED")
    return "bg-emerald-400/15 text-emerald-200 border-emerald-400/20";
  if (s === "WAITLISTED")
    return "bg-amber-400/15 text-amber-200 border-amber-400/20";
  if (s === "CANCELLED") return "bg-red-400/15 text-red-200 border-red-400/20";
  return "bg-white/5 text-white/70 border-white/10";
}

export const optionalTrimmed = (maxLength: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().max(maxLength).optional(),
  );

const httpUrl = z.url({ protocol: /^https?$/ });
export const optionalUrl = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  httpUrl.optional(),
);

// for markdown stored-as-json wrapper
export const markdownRichSchema = z
  .string()
  .max(20000, "Content is too long.")
  .optional()
  .or(z.literal(""));

export function getMarkdownFromRich(rich: unknown | null | undefined): string {
  if (!rich) return "";
  if (typeof rich === "object" && "type" in rich && rich.type === "markdown")
    return (rich as { value?: string }).value ?? "";
  return ""; // later: support tiptap/slate etc
}

export const makeClientId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const trackDraftSchema = z.object({
  name: z.string().trim().min(1, "Track name is required.").max(80),
  blurb: optionalTrimmed(400),
  order: z.number().int().min(0).max(999).optional(),
});

export const awardDraftSchema = z.object({
  name: z.string().trim().min(1, "Award name is required.").max(80),
  blurb: optionalTrimmed(400),
  order: z.number().int().min(0).max(999).optional(),
  allowMultipleWinners: z.boolean().optional(),
});

export const uniqueNames = (arr: { name: string }[]) => {
  const seen = new Set<string>();
  for (const x of arr) {
    const k = x.name.trim().toLowerCase();
    if (!k) continue;
    if (seen.has(k)) return false;
    seen.add(k);
  }
  return true;
};

export const jsonArrayFromString = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess((v) => {
    if (typeof v !== "string" || v.trim() === "") return [];
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, z.array(item));

const mapsShortLinkRegex =
  /^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)\/[A-Za-z0-9_-]+(\/)?(\?.*)?$/;

export const optionalMapsShortUrl = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z
    .string()
    .trim()
    .regex(
      mapsShortLinkRegex,
      "Use a Google Maps share link (maps.app.goo.gl/...). Open Google Maps → Share → Copy link.",
    )
    .optional(),
);

export function roleBadgeClasses(role: Member["role"]) {
  switch (role) {
    case "OWNER":
      return "bg-amber-400/15 text-amber-200 border-amber-400/20";
    case "ADMIN":
      return "bg-sky-400/15 text-sky-200 border-sky-400/20";
    case "MEMBER":
      return "bg-white/5 text-white/70 border-white/10";
    default:
      return "bg-white/5 text-white/70 border-white/10";
  }
}

// ===== Event pills (admin/private hero) =====

export function eventStatusLabel(status: string) {
  const s = (status || "").toUpperCase();
  if (s === "PUBLISHED") return "Published";
  if (s === "DRAFT") return "Draft";
  if (s === "ARCHIVED") return "Archived";
  return status || "Unknown";
}

export function eventVisibilityLabel(visibility: string) {
  const v = (visibility || "").toUpperCase();
  if (v === "PUBLIC_LISTED") return "Public (Listed)";
  if (v === "PUBLIC_UNLISTED") return "Public (Unlisted)";
  if (v === "PRIVATE") return "Private";
  return visibility || "Unknown";
}

export function eventJoinModeLabel(joinMode: string) {
  const j = (joinMode || "").toUpperCase();
  if (j === "OPEN") return "Open";
  if (j === "REQUEST") return "Request";
  if (j === "INVITE_ONLY") return "Invite-only";
  return joinMode || "Unknown";
}

export function eventPillClasses(
  kind: "STATUS" | "VISIBILITY" | "JOIN",
  value: string,
) {
  const v = (value || "").toUpperCase();

  // Keep your “soft frosted” vibe; slightly more contrast for important states
  if (kind === "STATUS") {
    if (v === "PUBLISHED")
      return "bg-emerald-400/15 text-emerald-200 border-emerald-400/20";
    if (v === "DRAFT") return "bg-white/5 text-white/70 border-white/10";
    if (v === "ARCHIVED") return "bg-white/5 text-white/60 border-white/10";
    return "bg-white/5 text-white/70 border-white/10";
  }

  if (kind === "VISIBILITY") {
    if (v === "PUBLIC_LISTED")
      return "bg-sky-400/15 text-sky-200 border-sky-400/20";
    if (v === "PUBLIC_UNLISTED")
      return "bg-white/5 text-white/70 border-white/10";
    if (v === "PRIVATE")
      return "bg-amber-400/15 text-amber-200 border-amber-400/20";
    return "bg-white/5 text-white/70 border-white/10";
  }

  // JOIN
  if (v === "OPEN")
    return "bg-emerald-400/15 text-emerald-200 border-emerald-400/20";
  if (v === "REQUEST")
    return "bg-amber-400/15 text-amber-200 border-amber-400/20";
  if (v === "INVITE_ONLY") return "bg-white/5 text-white/70 border-white/10";
  return "bg-white/5 text-white/70 border-white/10";
}

export function formatShortDate(d: Date | string | null | undefined) {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(dt);
}

export function subtlePill() {
  return "px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/70 text-[11px] font-semibold";
}

export const tierLabel = (tier: SponsorTier) => {
  switch (tier) {
    case "TITLE":
      return "Title";
    case "PLATINUM":
      return "Platinum";
    case "GOLD":
      return "Gold";
    case "SILVER":
      return "Silver";
    case "BRONZE":
      return "Bronze";
    case "COMMUNITY":
      return "Community";
    default:
      return tier;
  }
};

export const allowedTiers = new Set<SponsorTier>([
  "TITLE",
  "PLATINUM",
  "GOLD",
  "SILVER",
  "BRONZE",
  "COMMUNITY",
]);
