"use client";

import React, { useActionState, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { z } from "zod";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

import type { ActionState, UserDataSettings } from "@/src/lib/global_types";
import {
  parseServerActionResponse,
  TEN_MB,
  validateImageFile,
} from "@/src/lib/utils";
import { updateUserProfile } from "@/src/actions/user_actions";
import { createUserImageUpload } from "@/src/actions/s3_actions";
import { uploadToS3PresignedPost, s3KeyToPublicUrl } from "@/src/lib/s3-client";
import { updateUserProfileClientSchema } from "@/src/lib/validation";

const initialState: ActionState = { status: "INITIAL", error: "", data: null };

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const EditUserProfileForm = ({ userData }: { userData: UserDataSettings }) => {
  const profileRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const [statusMessage, setStatusMessage] = useState("");

  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(
    userData.profilePicKey
      ? (s3KeyToPublicUrl(userData.profilePicKey) as string)
      : null
  );
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(
    userData.bannerKey ? (s3KeyToPublicUrl(userData.bannerKey) as string) : null
  );

  const [showBioPreview, setShowBioPreview] = useState(false);

  const [formData, setFormData] = useState(() => ({
    name: userData.name ?? "",
    username: userData.username ?? "",
    headline: userData.headline ?? "",
    bioMarkdown: (userData.bioText ?? "") as string,

    location: userData.location ?? "",
    websiteUrl: userData.websiteUrl ?? "",
    linkedinUrl: userData.linkedinUrl ?? "",
    youtubeUrl: userData.youtubeUrl ?? "",
    githubUrl: userData.githubUrl ?? "",
    discord: userData.discord ?? "",

    removeProfilePic: false,
    removeBanner: false,
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSelectImage = (file: File | null, kind: "profile" | "banner") => {
    if (!file) return;

    const ok = validateImageFile({
      file,
      options: { allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES, maxBytes: TEN_MB },
    });

    if (!ok) {
      toast.error("ERROR", {
        description: "Image must be PNG/JPG/WEBP. Max size is 10MB.",
      });
      if (kind === "profile" && profileRef.current)
        profileRef.current.value = "";
      if (kind === "banner" && bannerRef.current) bannerRef.current.value = "";
      return;
    }

    const url = URL.createObjectURL(file);
    if (kind === "profile") setProfilePreviewUrl(url);
    else setBannerPreviewUrl(url);
  };

  const submit = async (
    _state: ActionState,
    _fd: FormData
  ): Promise<ActionState> => {
    try {
      void _state;
      void _fd;

      setErrors({});
      setStatusMessage("");

      const profileFile = profileRef.current?.files?.[0] ?? null;
      const bannerFile = bannerRef.current?.files?.[0] ?? null;

      // Client validate
      const parsed = await updateUserProfileClientSchema.parseAsync({
        name: formData.name,
        username: formData.username,
        headline: formData.headline,
        bioMarkdown: formData.bioMarkdown,

        location: formData.location,
        websiteUrl: formData.websiteUrl,
        linkedinUrl: formData.linkedinUrl,
        youtubeUrl: formData.youtubeUrl,
        githubUrl: formData.githubUrl,
        discord: formData.discord,

        profilePicFile: profileFile ?? undefined,
        bannerFile: bannerFile ?? undefined,

        removeProfilePic: formData.removeProfilePic,
        removeBanner: formData.removeBanner,
      });

      // Optional: validate files explicitly (same style as your event form)
      if (profileFile) {
        const ok = validateImageFile({
          file: profileFile,
          options: {
            allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES,
            maxBytes: TEN_MB,
          },
        });
        if (!ok) {
          throw new z.ZodError([
            {
              code: "custom",
              path: ["profilePicFile"],
              message: "Invalid profile image.",
            },
          ]);
        }
      }
      if (bannerFile) {
        const ok = validateImageFile({
          file: bannerFile,
          options: {
            allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES,
            maxBytes: TEN_MB,
          },
        });
        if (!ok) {
          throw new z.ZodError([
            {
              code: "custom",
              path: ["bannerFile"],
              message: "Invalid banner image.",
            },
          ]);
        }
      }

      // Upload to tmp if needed
      setStatusMessage("Uploading images…");

      let profilePicTmpKey: string | null = null;
      let bannerTmpKey: string | null = null;

      if (profileFile) {
        const presign = await createUserImageUpload({
          kind: "profile",
          fileName: profileFile.name,
          contentType: profileFile.type,
        });
        await uploadToS3PresignedPost({
          url: presign.url,
          fields: presign.fields,
          file: profileFile,
        });
        profilePicTmpKey = presign.key;
      }

      if (bannerFile) {
        const presign = await createUserImageUpload({
          kind: "banner",
          fileName: bannerFile.name,
          contentType: bannerFile.type,
        });
        await uploadToS3PresignedPost({
          url: presign.url,
          fields: presign.fields,
          file: bannerFile,
        });
        bannerTmpKey = presign.key;
      }

      setStatusMessage("Saving…");

      const fd = new FormData();
      fd.set("name", parsed.name ?? "");
      fd.set("username", parsed.username ?? "");
      fd.set("headline", parsed.headline ?? "");
      fd.set("bioMarkdown", parsed.bioMarkdown ?? "");

      // If you have a rich JSON editor, you could send JSON string here.
      // For now: store markdown only; server schema accepts optional.
      fd.set("bioRich", "");

      fd.set("location", parsed.location ?? "");
      fd.set("websiteUrl", parsed.websiteUrl ?? "");
      fd.set("linkedinUrl", parsed.linkedinUrl ?? "");
      fd.set("youtubeUrl", parsed.youtubeUrl ?? "");
      fd.set("githubUrl", parsed.githubUrl ?? "");
      fd.set("discord", parsed.discord ?? "");

      if (profilePicTmpKey) fd.set("profilePicTmpKey", profilePicTmpKey);
      if (bannerTmpKey) fd.set("bannerTmpKey", bannerTmpKey);

      if (parsed.removeProfilePic) fd.set("removeProfilePic", "1");
      if (parsed.removeBanner) fd.set("removeBanner", "1");

      const result = await updateUserProfile(initialState, fd);

      if (result.status === "ERROR") {
        toast.error("ERROR", {
          description: result.error || "Failed to save.",
        });
        setStatusMessage(result.error || "Failed to save.");
        return result;
      }

      toast.success("SUCCESS", { description: "Profile updated." });
      setStatusMessage("Saved.");
      return result;
    } catch (error) {
      console.error(error);
      setStatusMessage("Please fix the highlighted fields.");

      if (error instanceof z.ZodError) {
        const fieldErrors = z.flattenError(error).fieldErrors as Record<
          string,
          string[]
        >;
        const formatted: Record<string, string> = {};
        Object.keys(fieldErrors).forEach(
          (k) => (formatted[k] = fieldErrors[k]?.[0] || "")
        );
        setErrors(formatted);

        toast.error("ERROR", {
          description: Object.values(formatted).filter(Boolean).join(", "),
        });

        return parseServerActionResponse({
          status: "ERROR",
          error: Object.values(formatted).filter(Boolean).join(", "),
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

  const [, formAction, isPending] = useActionState(submit, initialState);

  return (
    <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="text-white text-xl md:text-2xl font-semibold">
            Profile
          </div>
          <div className="text-white/70 text-sm leading-relaxed max-w-3xl">
            This updates your public profile and links.
          </div>
        </div>

        <form action={formAction} className="flex flex-col gap-6 md:gap-8">
          {/* Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs md:text-sm text-white/75">
                Profile image
              </label>
              <input
                ref={profileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) =>
                  onSelectImage(e.target.files?.[0] ?? null, "profile")
                }
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white/80 file:hover:bg-white/15 file:transition-colors"
              />
              {profilePreviewUrl ? (
                <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                  <Image
                    src={profilePreviewUrl}
                    alt="Profile preview"
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </div>
              ) : null}

              <label className="flex items-center gap-3 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={formData.removeProfilePic}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      removeProfilePic: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
                <div className="text-white/75 text-sm">
                  Remove profile image
                </div>
              </label>

              {errors.profilePicFile ? (
                <p className="text-red-500 text-xs md:text-sm">
                  {errors.profilePicFile}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs md:text-sm text-white/75">
                Banner image
              </label>
              <input
                ref={bannerRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) =>
                  onSelectImage(e.target.files?.[0] ?? null, "banner")
                }
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white/80 file:hover:bg-white/15 file:transition-colors"
              />
              {bannerPreviewUrl ? (
                <div className="relative w-full h-28 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                  <Image
                    src={bannerPreviewUrl}
                    alt="Banner preview"
                    fill
                    sizes="768px"
                    className="object-cover"
                  />
                </div>
              ) : null}

              <label className="flex items-center gap-3 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={formData.removeBanner}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      removeBanner: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
                <div className="text-white/75 text-sm">Remove banner image</div>
              </label>

              {errors.bannerFile ? (
                <p className="text-red-500 text-xs md:text-sm">
                  {errors.bannerFile}
                </p>
              ) : null}
            </div>
          </div>

          {/* Basic */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs md:text-sm text-white/75">Name</label>
              <input
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              />
              {errors.name ? (
                <p className="text-red-500 text-xs md:text-sm">{errors.name}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs md:text-sm text-white/75">
                Username
              </label>
              <input
                value={formData.username}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, username: e.target.value }))
                }
                placeholder="ramon"
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              />
              {errors.username ? (
                <p className="text-red-500 text-xs md:text-sm">
                  {errors.username}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-white/75">Headline</label>
            <input
              value={formData.headline}
              onChange={(e) =>
                setFormData((p) => ({ ...p, headline: e.target.value }))
              }
              placeholder="Cognitive Science @ UCSD • ML + Full-stack"
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            />
            {errors.headline ? (
              <p className="text-red-500 text-xs md:text-sm">
                {errors.headline}
              </p>
            ) : null}
          </div>

          {/* Bio markdown + preview */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs md:text-sm text-white/75">
                Bio (Markdown)
              </label>
              <button
                type="button"
                onClick={() => setShowBioPreview((p) => !p)}
                className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-xs md:text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              >
                {showBioPreview ? "Edit" : "Preview"}
              </button>
            </div>

            {showBioPreview ? (
              <div className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="prose prose-invert max-w-none prose-p:text-white/75 prose-a:text-accent-400 prose-strong:text-white">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize]}
                  >
                    {formData.bioMarkdown || "*Nothing yet…*"}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <textarea
                value={formData.bioMarkdown}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, bioMarkdown: e.target.value }))
                }
                placeholder="Write a short bio…"
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors min-h-[220px] resize-none shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] font-mono"
              />
            )}

            {errors.bioMarkdown ? (
              <p className="text-red-500 text-xs md:text-sm">
                {errors.bioMarkdown}
              </p>
            ) : null}
            <div className="text-white/50 text-xs">
              Supports headings, lists, links, bold, etc.
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {[
              ["location", "Location"],
              ["websiteUrl", "Website URL"],
              ["linkedinUrl", "LinkedIn URL"],
              ["youtubeUrl", "YouTube URL"],
              ["githubUrl", "GitHub URL"],
              ["discord", "Discord"],
            ].map(([key, label]) => (
              <div key={key} className="flex flex-col gap-2">
                <label className="text-xs md:text-sm text-white/75">
                  {label}
                </label>
                <input
                  value={(formData as any)[key]}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, [key]: e.target.value }))
                  }
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                />
                {errors[key] ? (
                  <p className="text-red-500 text-xs md:text-sm">
                    {errors[key]}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          <div className="flex w-full justify-center">
            <button
              type="submit"
              disabled={isPending}
              className="w-full max-w-sm px-5 py-3 rounded-2xl cursor-pointer bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "Saving..." : "Save changes"}
            </button>
          </div>

          {statusMessage ? (
            <div className="flex items-center justify-center w-full">
              <p className="text-white/90 text-xs md:text-sm text-center px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                {statusMessage}
              </p>
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
};

export default EditUserProfileForm;
