"use client";

import React, { useMemo, useRef, useState, useActionState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import type { ActionState } from "@/src/lib/global_types";
import {
  parseServerActionResponse,
  TEN_MB,
  validateImageFile,
} from "@/src/lib/utils";
import { createOrgImageUpload } from "@/src/actions/s3_actions";
import { uploadToS3PresignedPost, s3KeyToPublicUrl } from "@/src/lib/s3-client";
import {
  setSponsorVisibility,
  updateSponsorProfile,
} from "@/src/actions/org_sponsor_actions";
import { updateSponsorProfileClientSchema } from "@/src/lib/validation";
import { deleteSponsor } from "@/src/actions/org_sponsor_actions";

export type SponsorLibraryItem = {
  id: string;
  name: string;
  slug: string;
  websiteKey: string | null;
  description: string | null;
  logoKey: string | null;
  coverKey: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  createdById: string | null;
};

const initialState: ActionState = {
  status: "INITIAL",
  error: "",
  data: null,
};

const SponsorLibraryCard = ({
  sponsor,
  currentUserId,
  onAddToOrg,
}: {
  sponsor: SponsorLibraryItem;
  currentUserId: string;
  onAddToOrg: (sponsorId: string) => void;
}) => {
  const canEdit = sponsor.createdById === currentUserId;

  const allowedImageMimeTypes = useMemo(
    () => new Set(["image/png", "image/jpeg", "image/webp"]),
    [],
  );

  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const createdSponsor = sponsor.createdById === currentUserId;

  const [isEditing, setIsEditing] = useState(false);
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errors, setErrors] = useState<
    Partial<
      Record<
        | "sponsorName"
        | "sponsorWebsite"
        | "sponsorDescription"
        | "logoFile"
        | "coverFile",
        string
      >
    >
  >({});

  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeCover, setRemoveCover] = useState(false);

  const [formData, setFormData] = useState(() => ({
    sponsorName: sponsor.name,
    sponsorWebsite: sponsor.websiteKey ?? "",
    sponsorDescription: sponsor.description ?? "",
  }));

  const logoPreviewUrl = sponsor.logoKey
    ? (s3KeyToPublicUrl(sponsor.logoKey) as string)
    : null;

  const toggleVisibility = async () => {
    if (!canEdit) return;
    try {
      setStatusMessage("Updating visibility…");
      const fd = new FormData();
      fd.set("sponsorId", sponsor.id);
      fd.set(
        "visibility",
        sponsor.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC",
      );
      const result = await setSponsorVisibility(initialState, fd);
      if (result.status === "ERROR") {
        setStatusMessage(result.error || "Failed to update visibility.");
        toast.error("ERROR", { description: result.error });
        return;
      }
      setStatusMessage("Updated.");
      toast.success("SUCCESS", { description: "Visibility updated." });
    } catch (e) {
      console.error(e);
      setStatusMessage("Failed to update visibility.");
      toast.error("ERROR", { description: "Failed to update visibility." });
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const onDeleteSponsor = async () => {
    if (!canEdit) return;

    const ok = window.confirm(
      `Delete "${sponsor.name}"?\n\nThis will remove the global sponsor from your library.`,
    );
    if (!ok) return;

    try {
      setIsDeleting(true);
      setStatusMessage("Deleting sponsor…");

      const fd = new FormData();
      fd.set("sponsorId", sponsor.id);

      const result = await deleteSponsor(initialState, fd);
      if (result.status === "ERROR") {
        setStatusMessage(result.error || "Failed to delete sponsor.");
        toast.error("ERROR", { description: result.error });
        return;
      }

      setStatusMessage("Deleted.");
      toast.success("SUCCESS", { description: "Sponsor deleted." });

      // IMPORTANT: parent list needs to refresh/re-render from server
      // If your parent is server-rendered, use router.refresh() there or here (if you want)
      // (You didn’t import router in this component yet.)
    } catch (e) {
      console.error(e);
      setStatusMessage("Failed to delete sponsor.");
      toast.error("ERROR", { description: "Failed to delete sponsor." });
    } finally {
      setIsDeleting(false);
    }
  };

  const submitProfile = async (
    _state: ActionState,
    _fd: FormData,
  ): Promise<ActionState> => {
    try {
      void _state;
      void _fd;

      if (!canEdit) {
        return parseServerActionResponse({
          status: "ERROR",
          error: "NOT_AUTHORIZED",
          data: null,
        });
      }

      setErrors({});

      const logoFile = logoRef.current?.files?.[0] ?? null;
      const coverFile = coverRef.current?.files?.[0] ?? null;
      const createdSponsor = sponsor.createdById === currentUserId;

      await updateSponsorProfileClientSchema.parseAsync({
        sponsorId: sponsor.id,
        sponsorName: formData.sponsorName,
        sponsorWebsite: formData.sponsorWebsite,
        sponsorDescription: formData.sponsorDescription,
        logoFile: logoFile ?? undefined,
        coverFile: coverFile ?? undefined,
        removeLogo,
        removeCover,
      });

      if (logoFile) {
        const ok = validateImageFile({
          file: logoFile,
          options: {
            allowedMimeTypes: allowedImageMimeTypes,
            maxBytes: TEN_MB,
          },
        });
        if (!ok) {
          throw new z.ZodError([
            {
              code: "custom",
              path: ["logoFile"],
              message: "Logo must be a PNG, JPG, or WEBP. Max size is 10MB.",
            },
          ]);
        }
      }

      if (coverFile) {
        const ok = validateImageFile({
          file: coverFile,
          options: {
            allowedMimeTypes: allowedImageMimeTypes,
            maxBytes: TEN_MB,
          },
        });
        if (!ok) {
          throw new z.ZodError([
            {
              code: "custom",
              path: ["coverFile"],
              message: "Cover must be a PNG, JPG, or WEBP. Max size is 10MB.",
            },
          ]);
        }
      }

      setStatusMessage("Uploading images…");

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

      setStatusMessage("Saving…");

      const fd = new FormData();
      fd.set("sponsorId", sponsor.id);
      fd.set("sponsorName", formData.sponsorName);
      fd.set("sponsorWebsite", formData.sponsorWebsite ?? "");
      fd.set("sponsorDescription", formData.sponsorDescription ?? "");
      fd.set("removeLogo", removeLogo ? "true" : "false");
      fd.set("removeCover", removeCover ? "true" : "false");
      if (logoKey) fd.set("logoKey", logoKey);
      if (coverKey) fd.set("coverKey", coverKey);

      const result = await updateSponsorProfile(initialState, fd);
      if (result.status === "ERROR") {
        setStatusMessage(result.error || "Failed to update sponsor.");
        toast.error("ERROR", { description: result.error });
        return result;
      }

      setStatusMessage("Saved.");
      toast.success("SUCCESS", { description: "Sponsor updated." });
      setIsEditing(false);
      return result;
    } catch (error) {
      console.error(error);
      setStatusMessage("Please fix the highlighted fields.");

      if (error instanceof z.ZodError) {
        const fieldErrors = z.flattenError(error).fieldErrors as Record<
          string,
          string[]
        >;
        const formattedErrors: Record<string, string> = {};
        Object.keys(fieldErrors).forEach((key) => {
          formattedErrors[key] = fieldErrors[key]?.[0] || "";
        });
        setErrors(formattedErrors);
        toast.error("ERROR", {
          description: Object.values(formattedErrors)
            .filter(Boolean)
            .join(", "),
        });
        return parseServerActionResponse({
          status: "ERROR",
          error: Object.values(formattedErrors).filter(Boolean).join(", "),
          data: null,
        });
      }

      toast.error("ERROR", {
        description: "An error occurred while saving. Please try again.",
      });

      return parseServerActionResponse({
        status: "ERROR",
        error: "An error occurred while saving",
        data: null,
      });
    }
  };

  const [, formAction, isPending] = useActionState(submitProfile, initialState);

  return (
    <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 md:gap-6">
          <div className="flex items-start gap-3">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0">
              {logoPreviewUrl ? (
                <Image
                  src={logoPreviewUrl}
                  alt={`${sponsor.name} logo`}
                  fill
                  sizes="44px"
                  className="object-contain p-2"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-white/70">
                  {sponsor.name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <div className="text-white font-semibold leading-tight">
                {sponsor.name}
              </div>
              <div className="text-white/50 text-xs">@{sponsor.slug}</div>
              <div className="flex flex-col xs:flex-row xs:items-center gap-2">
                <div className="text-white/70 text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 w-fit">
                  {sponsor.visibility}
                </div>
                {sponsor.websiteKey ? (
                  <div className="text-white/60 text-xs break-all">
                    {sponsor.websiteKey}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => onAddToOrg(sponsor.id)}
              className="w-full sm:w-auto px-4 py-2 rounded-2xl bg-white text-primary-950 font-semibold text-xs md:text-sm transition-opacity hover:opacity-90"
            >
              Add to org
            </button>

            {canEdit ? (
              <button
                type="button"
                onClick={() => setIsEditing((p) => !p)}
                className="w-full sm:w-auto px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-xs md:text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              >
                {isEditing ? "Close" : "Edit sponsor"}
              </button>
            ) : null}

            {canEdit ? (
              <button
                type="button"
                onClick={toggleVisibility}
                className="w-full sm:w-auto px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-xs md:text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              >
                {sponsor.visibility === "PUBLIC"
                  ? "Make private"
                  : "Make public"}
              </button>
            ) : null}
            {canEdit && createdSponsor ? (
              <button
                type="button"
                disabled={isDeleting}
                onClick={onDeleteSponsor}
                className="w-full sm:w-auto px-4 py-2 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 hover:bg-red-500/15 transition-colors text-xs md:text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] disabled:opacity-60"
              >
                {isDeleting ? "Deleting…" : "Delete sponsor"}
              </button>
            ) : null}
          </div>
        </div>

        {isEditing ? (
          <form action={formAction} className="flex flex-col gap-6 md:gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs md:text-sm text-white/75 flex items-center gap-1">
                  Sponsor name
                  <span className="text-xs text-red-500">*</span>
                </label>
                <input
                  value={formData.sponsorName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, sponsorName: e.target.value }))
                  }
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                />
                {errors.sponsorName ? (
                  <p className="text-red-500 text-xs md:text-sm">
                    {errors.sponsorName}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs md:text-sm text-white/75">
                  Sponsor website
                </label>
                <input
                  value={formData.sponsorWebsite}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      sponsorWebsite: e.target.value,
                    }))
                  }
                  placeholder="https://acme.com"
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                />
                {errors.sponsorWebsite ? (
                  <p className="text-red-500 text-xs md:text-sm">
                    {errors.sponsorWebsite}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs md:text-sm text-white/75">
                Description (Markdown)
              </label>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="text-xs text-white/60">Markdown supported</div>
                <button
                  type="button"
                  onClick={() => setShowDescriptionPreview((p) => !p)}
                  className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-xs md:text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                >
                  {showDescriptionPreview ? "Edit" : "Preview"}
                </button>
              </div>

              {showDescriptionPreview ? (
                <div className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div className="prose prose-invert max-w-none prose-p:text-white/75 prose-a:text-accent-400 prose-strong:text-white">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSanitize]}
                    >
                      {formData.sponsorDescription || "*Nothing yet…*"}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <textarea
                  value={formData.sponsorDescription}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      sponsorDescription: e.target.value,
                    }))
                  }
                  placeholder="Describe the sponsor (optional)…"
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors min-h-[140px] resize-none shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                />
              )}
              {errors.sponsorDescription ? (
                <p className="text-red-500 text-xs md:text-sm">
                  {errors.sponsorDescription}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs md:text-sm text-white/75">
                  Logo (optional)
                </label>
                <input
                  ref={logoRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={() => setRemoveLogo(false)}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white/80 file:hover:bg-white/15 file:transition-colors"
                />
                <div className="flex flex-col gap-2">
                  {sponsor.logoKey ? (
                    <button
                      type="button"
                      onClick={() => {
                        setRemoveLogo(true);
                        if (logoRef.current) logoRef.current.value = "";
                      }}
                      className="text-xs text-white/70 hover:text-white underline text-left"
                    >
                      Remove logo
                    </button>
                  ) : null}
                  {errors.logoFile ? (
                    <p className="text-red-500 text-xs md:text-sm">
                      {errors.logoFile}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs md:text-sm text-white/75">
                  Cover (optional)
                </label>
                <input
                  ref={coverRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={() => setRemoveCover(false)}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white/80 file:hover:bg-white/15 file:transition-colors"
                />
                <div className="flex flex-col gap-2">
                  {sponsor.coverKey ? (
                    <button
                      type="button"
                      onClick={() => {
                        setRemoveCover(true);
                        if (coverRef.current) coverRef.current.value = "";
                      }}
                      className="text-xs text-white/70 hover:text-white underline text-left"
                    >
                      Remove cover
                    </button>
                  ) : null}
                  {errors.coverFile ? (
                    <p className="text-red-500 text-xs md:text-sm">
                      {errors.coverFile}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex w-full justify-center">
              <button
                type="submit"
                disabled={isPending}
                className="w-full max-w-sm px-5 py-3 rounded-2xl cursor-pointer bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isPending ? "Saving..." : "Save sponsor"}
              </button>
            </div>
          </form>
        ) : null}

        {statusMessage ? (
          <div className="flex items-center justify-center w-full">
            <p className="text-white/90 text-xs md:text-sm text-center px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              {statusMessage}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SponsorLibraryCard;
