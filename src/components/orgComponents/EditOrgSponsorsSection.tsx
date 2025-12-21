"use client";

import React, { useMemo, useRef, useState, useActionState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import type { ActionState } from "@/src/lib/global_types";
import {
  parseServerActionResponse,
  TEN_MB,
  validateImageFile,
} from "@/src/lib/utils";
import { createOrgImageUpload } from "@/src/actions/s3_actions";
import { uploadToS3PresignedPost } from "@/src/lib/s3-client";
import { addSponsorToOrg } from "@/src/actions/org_sponsor_actions";

const initialState: ActionState = {
  status: "INITIAL",
  error: "",
  data: null,
};

type SponsorTier =
  | "TITLE"
  | "PLATINUM"
  | "GOLD"
  | "SILVER"
  | "BRONZE"
  | "COMMUNITY";

const sponsorClientSchema = z.object({
  orgId: z.string().min(1),
  sponsorName: z
    .string()
    .min(1, { message: "Sponsor name is required" })
    .max(100),
  sponsorWebsite: z.string().optional(),
  sponsorDescription: z.string().max(500).optional(),
  tier: z.enum(["TITLE", "PLATINUM", "GOLD", "SILVER", "BRONZE", "COMMUNITY"]),
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

const EditOrgSponsorsSection = ({ orgId }: { orgId: string }) => {
  const allowedImageMimeTypes = useMemo(
    () => new Set(["image/png", "image/jpeg", "image/webp"]),
    [],
  );

  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [statusMessage, setStatusMessage] = useState("");
  const [formData, setFormData] = useState(() => ({
    sponsorName: "",
    sponsorWebsite: "",
    sponsorDescription: "",
    tier: "COMMUNITY" as SponsorTier,
  }));

  const submitSponsorForm = async (
    _state: ActionState,
    _fd: FormData,
  ): Promise<ActionState> => {
    try {
      void _state;
      void _fd;

      const logoFile = logoRef.current?.files?.[0] ?? null;
      const coverFile = coverRef.current?.files?.[0] ?? null;

      const parsed = sponsorClientSchema.parse({
        orgId,
        sponsorName: formData.sponsorName,
        sponsorWebsite: formData.sponsorWebsite,
        sponsorDescription: formData.sponsorDescription,
        tier: formData.tier,
        logoFile: logoFile ?? undefined,
        coverFile: coverFile ?? undefined,
      });

      if (logoFile) {
        const ok = validateImageFile({
          file: logoFile,
          options: {
            allowedMimeTypes: allowedImageMimeTypes,
            maxBytes: TEN_MB,
          },
        });
        if (!ok)
          throw new z.ZodError([
            {
              code: "custom",
              path: ["logoFile"],
              message: "Logo must be a PNG, JPG, or WEBP. Max size is 10MB.",
            },
          ]);
      }

      if (coverFile) {
        const ok = validateImageFile({
          file: coverFile,
          options: {
            allowedMimeTypes: allowedImageMimeTypes,
            maxBytes: TEN_MB,
          },
        });
        if (!ok)
          throw new z.ZodError([
            {
              code: "custom",
              path: ["coverFile"],
              message: "Cover must be a PNG, JPG, or WEBP. Max size is 10MB.",
            },
          ]);
      }

      setStatusMessage("Uploading sponsor images…");

      let logoKey: string | null = null;
      let coverKey: string | null = null;

      if (logoFile) {
        const presign = await createOrgImageUpload({
          kind: "logo",
          fileName: logoFile.name,
          contentType: logoFile.type,
        });
        await uploadToS3PresignedPost({
          url: presign.url,
          fields: presign.fields,
          file: logoFile,
        });
        logoKey = presign.key;
      }

      if (coverFile) {
        const presign = await createOrgImageUpload({
          kind: "cover",
          fileName: coverFile.name,
          contentType: coverFile.type,
        });
        await uploadToS3PresignedPost({
          url: presign.url,
          fields: presign.fields,
          file: coverFile,
        });
        coverKey = presign.key;
      }

      setStatusMessage("Adding sponsor…");

      const fd = new FormData();
      fd.set("orgId", parsed.orgId);
      fd.set("sponsorName", parsed.sponsorName);
      fd.set("sponsorWebsite", parsed.sponsorWebsite ?? "");
      fd.set("sponsorDescription", parsed.sponsorDescription ?? "");
      fd.set("tier", parsed.tier);
      if (logoKey) fd.set("logoKey", logoKey);
      if (coverKey) fd.set("coverKey", coverKey);

      const result = await addSponsorToOrg(initialState, fd);
      if (result.status === "ERROR") {
        setStatusMessage(result.error || "Failed to add sponsor.");
        toast.error("ERROR", { description: result.error });
        return result;
      }

      setStatusMessage("Sponsor added.");
      toast.success("SUCCESS", { description: "Sponsor added." });

      setFormData({
        sponsorName: "",
        sponsorWebsite: "",
        sponsorDescription: "",
        tier: "COMMUNITY",
      });
      if (logoRef.current) logoRef.current.value = "";
      if (coverRef.current) coverRef.current.value = "";

      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const msg = error.issues[0]?.message ?? "Invalid sponsor details.";
        setStatusMessage(msg);
        toast.error("ERROR", { description: msg });
        return parseServerActionResponse({
          status: "ERROR",
          error: msg,
          data: null,
        });
      }
      console.error(error);
      setStatusMessage("Failed to add sponsor.");
      toast.error("ERROR", { description: "Failed to add sponsor." });
      return parseServerActionResponse({
        status: "ERROR",
        error: "Failed to add sponsor",
        data: null,
      });
    }
  };

  const [, formAction, isPending] = useActionState(
    submitSponsorForm,
    initialState,
  );

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-8 md:gap-10">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Sponsors
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            Add sponsor metadata and optional sponsor logo/cover. You can refine
            tiers and display settings later in the Sponsors tab.
          </div>
        </div>

        <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
          <form action={formAction} className="flex flex-col gap-6 md:gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs md:text-sm text-white/75">
                  Sponsor name
                </label>
                <input
                  value={formData.sponsorName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, sponsorName: e.target.value }))
                  }
                  placeholder="Acme Inc."
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs md:text-sm text-white/75">Tier</label>
                <select
                  value={formData.tier}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      tier: e.target.value as SponsorTier,
                    }))
                  }
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                >
                  {[
                    "TITLE",
                    "PLATINUM",
                    "GOLD",
                    "SILVER",
                    "BRONZE",
                    "COMMUNITY",
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs md:text-sm text-white/75">
                Sponsor website
              </label>
              <input
                value={formData.sponsorWebsite}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, sponsorWebsite: e.target.value }))
                }
                placeholder="https://acme.com"
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs md:text-sm text-white/75">
                Sponsor description
              </label>
              <textarea
                value={formData.sponsorDescription}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    sponsorDescription: e.target.value,
                  }))
                }
                placeholder="Short sponsor blurb…"
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors min-h-[120px] resize-none shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs md:text-sm text-white/75">
                  Sponsor logo
                </label>
                <input
                  ref={logoRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white/80 file:hover:bg-white/15 file:transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs md:text-sm text-white/75">
                  Sponsor cover
                </label>
                <input
                  ref={coverRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white/80 file:hover:bg-white/15 file:transition-colors"
                />
              </div>
            </div>

            <div className="flex w-full justify-center">
              <button
                type="submit"
                disabled={isPending}
                className="w-full max-w-sm px-5 py-3 rounded-2xl cursor-pointer bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isPending ? "Adding..." : "Add sponsor"}
              </button>
            </div>
          </form>

          {statusMessage ? (
            <div className="flex items-center justify-center w-full pt-6">
              <p className="text-white/90 text-xs md:text-sm text-center px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                {statusMessage}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default EditOrgSponsorsSection;
