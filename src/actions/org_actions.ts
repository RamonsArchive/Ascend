"use server";

import { checkRateLimit } from "../lib/rate-limiter";
import { parseServerActionResponse } from "../lib/utils";
import type { ActionState } from "../lib/global_types";
import { newOrgFormSchema } from "../lib/validation";

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
  formData: FormData,
): Promise<ActionState> => {
  try {
    const isRateLimited = await checkRateLimit("createOrganization");
    if (isRateLimited.status === "ERROR") {
      return isRateLimited as ActionState;
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

    // Placeholder: later you'll upload files + write to DB.
    const placeholder = {
      id: "org_placeholder",
      name,
      slug: slugify(name) || "org",
      description: description || null,
      publicEmail: publicEmail || null,
      publicPhone: publicPhone || null,
      websiteUrl: websiteUrl || null,
      contactNote: contactNote || null,
      hasLogoFile: !!logoFile,
      hasCoverFile: !!coverFile,
    };

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: placeholder,
    }) as ActionState;
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to create organization",
      data: null,
    }) as ActionState;
  }
};
