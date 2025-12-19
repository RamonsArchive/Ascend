"use server";

import { checkRateLimit } from "../lib/rate-limiter";
import { parseServerActionResponse } from "../lib/utils";

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
  _prevState: unknown,
  formData: FormData,
) => {
  try {
    const isRateLimited = await checkRateLimit("createOrganization");
    if (isRateLimited.status === "ERROR") {
      return isRateLimited;
    }

    const name = (formData.get("name")?.toString() ?? "").trim();
    const description = (formData.get("description")?.toString() ?? "").trim();
    const publicEmail = (formData.get("publicEmail")?.toString() ?? "").trim();
    const publicPhone = (formData.get("publicPhone")?.toString() ?? "").trim();
    const websiteUrl = (formData.get("websiteUrl")?.toString() ?? "").trim();
    const contactNote = (formData.get("contactNote")?.toString() ?? "").trim();

    const logoFile = formData.get("logoFile");
    const coverFile = formData.get("coverFile");

    if (!name) {
      return parseServerActionResponse({
        status: "ERROR",
        error: "Organization name is required.",
        data: null,
      });
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
      hasLogoFile: logoFile instanceof File ? logoFile.size > 0 : false,
      hasCoverFile: coverFile instanceof File ? coverFile.size > 0 : false,
    };

    return parseServerActionResponse({
      status: "SUCCESS",
      error: "",
      data: placeholder,
    });
  } catch (error) {
    console.error(error);
    return parseServerActionResponse({
      status: "ERROR",
      error: "Failed to create organization",
      data: null,
    });
  }
};
