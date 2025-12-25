"use client";

import React, { useMemo, useRef, useState, useActionState } from "react";
import Image from "next/image";
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
import { createOrgEvent } from "@/src/actions/org_actions";
import { createOrgEventClientSchema } from "@/src/lib/validation";
import { useRouter } from "next/navigation";
const initialState: ActionState = {
  status: "INITIAL",
  error: "",
  data: null,
};

const OrgCreateEventForm = ({ orgSlug }: { orgSlug: string }) => {
  const router = useRouter();
  const allowedImageMimeTypes = useMemo(
    () => new Set(["image/png", "image/jpeg", "image/webp"]),
    []
  );

  const coverRef = useRef<HTMLInputElement>(null);

  const [statusMessage, setStatusMessage] = useState("");
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState(() => ({
    name: "",
    slug: "",
    type: "HACKATHON" as "HACKATHON" | "IDEATHON",
    heroTitle: "",
    heroSubtitle: "",
    visibility: "PUBLIC_LISTED" as
      | "PUBLIC_LISTED"
      | "PUBLIC_UNLISTED"
      | "PRIVATE",
    joinMode: "OPEN" as "OPEN" | "REQUEST" | "INVITE_ONLY",
    registrationOpensAt: "",
    registrationClosesAt: "",
    startAt: "",
    endAt: "",
    submitDueAt: "",
    locationName: "",
    locationAddress: "",
    locationNotes: "",
    locationMapUrl: "",
    rulesMarkdown: "",
    rubricMarkdown: "",
    maxTeamSize: "5",
    allowSelfJoinRequests: true,
    lockTeamChangesAtStart: true,
    requireImages: false,
    requireVideoDemo: false,
  }));

  const [errors, setErrors] = useState<{
    name?: string;
    slug?: string;
    type?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    visibility?: string;
    joinMode?: string;
    registrationOpensAt?: string;
    registrationClosesAt?: string;
    startAt?: string;
    endAt?: string;
    submitDueAt?: string;
    locationName?: string;
    locationAddress?: string;
    locationNotes?: string;
    locationMapUrl?: string;
    rulesMarkdown?: string;
    rubricMarkdown?: string;
    maxTeamSize?: string;
    coverFile?: string;
  }>({});

  const clearForm = () => {
    setFormData({
      name: "",
      slug: "",
      type: "HACKATHON",
      heroTitle: "",
      heroSubtitle: "",
      visibility: "PUBLIC_LISTED",
      joinMode: "OPEN",
      registrationOpensAt: "",
      registrationClosesAt: "",
      startAt: "",
      endAt: "",
      submitDueAt: "",
      locationName: "",
      locationAddress: "",
      locationNotes: "",
      locationMapUrl: "",
      rulesMarkdown: "",
      rubricMarkdown: "",
      maxTeamSize: "5",
      allowSelfJoinRequests: true,
      lockTeamChangesAtStart: true,
      requireImages: false,
      requireVideoDemo: false,
    });

    setErrors({});
    setStatusMessage("");
    setCoverPreviewUrl(null);
    if (coverRef.current) coverRef.current.value = "";
  };

  const onSelectCover = (file: File | null) => {
    if (!file) {
      setCoverPreviewUrl(null);
      return;
    }

    const ok = validateImageFile({
      file,
      options: { allowedMimeTypes: allowedImageMimeTypes, maxBytes: TEN_MB },
    });

    if (!ok) {
      toast.error("ERROR", {
        description: "Cover must be a PNG, JPG, or WEBP. Max size is 10MB.",
      });
      if (coverRef.current) coverRef.current.value = "";
      setCoverPreviewUrl(null);
      return;
    }

    setCoverPreviewUrl(URL.createObjectURL(file));
  };

  const submitCreateEvent = async (
    _state: ActionState,
    _fd: FormData
  ): Promise<ActionState> => {
    try {
      void _state;
      void _fd;

      setErrors({});

      const coverFile = coverRef.current?.files?.[0] ?? null;

      const parsed = await createOrgEventClientSchema.parseAsync({
        orgSlug,
        name: formData.name,
        slug: formData.slug || undefined,
        type: formData.type,
        heroTitle: formData.heroTitle,
        heroSubtitle: formData.heroSubtitle || undefined,
        visibility: formData.visibility,
        joinMode: formData.joinMode,
        registrationOpensAt: formData.registrationOpensAt || undefined,
        registrationClosesAt: formData.registrationClosesAt || undefined,
        startAt: formData.startAt || undefined,
        endAt: formData.endAt || undefined,
        submitDueAt: formData.submitDueAt || undefined,
        locationName: formData.locationName || undefined,
        locationAddress: formData.locationAddress || undefined,
        locationNotes: formData.locationNotes || undefined,
        locationMapUrl: formData.locationMapUrl || undefined,
        rulesMarkdown: formData.rulesMarkdown || undefined,
        rubricMarkdown: formData.rubricMarkdown || undefined,
        maxTeamSize: formData.maxTeamSize,
        allowSelfJoinRequests: formData.allowSelfJoinRequests,
        lockTeamChangesAtStart: formData.lockTeamChangesAtStart,
        requireImages: formData.requireImages,
        requireVideoDemo: formData.requireVideoDemo,
        coverFile: coverFile ?? undefined,
      });

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

      setStatusMessage("Uploading cover…");

      let coverKey: string | null = null;

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
        console.log("coverKey", coverKey);
      }

      setStatusMessage("Creating event…");

      const fd = new FormData();
      fd.set("orgSlug", parsed.orgSlug);
      fd.set("name", parsed.name);
      fd.set("type", parsed.type);
      fd.set("heroTitle", parsed.heroTitle);
      fd.set("maxTeamSize", String(parsed.maxTeamSize));
      fd.set("visibility", parsed.visibility);
      fd.set("joinMode", parsed.joinMode);

      // optional
      if (parsed.slug) fd.set("slug", parsed.slug);
      if (parsed.heroSubtitle) fd.set("heroSubtitle", parsed.heroSubtitle);
      if (parsed.registrationOpensAt)
        fd.set("registrationOpensAt", parsed.registrationOpensAt);
      if (parsed.registrationClosesAt)
        fd.set("registrationClosesAt", parsed.registrationClosesAt);
      if (parsed.startAt) fd.set("startAt", parsed.startAt);
      if (parsed.endAt) fd.set("endAt", parsed.endAt);
      if (parsed.submitDueAt) fd.set("submitDueAt", parsed.submitDueAt);
      if (parsed.locationName) fd.set("locationName", parsed.locationName);
      if (parsed.locationAddress)
        fd.set("locationAddress", parsed.locationAddress);
      if (parsed.locationNotes) fd.set("locationNotes", parsed.locationNotes);
      if (parsed.locationMapUrl)
        fd.set("locationMapUrl", parsed.locationMapUrl);

      if (parsed.rulesMarkdown) fd.set("rulesMarkdown", parsed.rulesMarkdown);
      if (parsed.rubricMarkdown)
        fd.set("rubricMarkdown", parsed.rubricMarkdown);

      fd.set("allowSelfJoinRequests", parsed.allowSelfJoinRequests ? "1" : "0");
      fd.set(
        "lockTeamChangesAtStart",
        parsed.lockTeamChangesAtStart ? "1" : "0"
      );
      fd.set("requireImages", parsed.requireImages ? "1" : "0");
      fd.set("requireVideoDemo", parsed.requireVideoDemo ? "1" : "0");

      if (coverKey) fd.set("coverKey", coverKey);

      const result = await createOrgEvent(initialState, fd);

      if (result.status === "ERROR") {
        setStatusMessage(result.error || "Failed to create event.");
        toast.error("ERROR", { description: result.error });
        return result;
      }

      toast.success("SUCCESS", { description: "Event created." });
      setStatusMessage("Event created.");
      clearForm();
      // push to new event page settings
      const slug = (result.data as { slug: string }).slug;
      router.push(`${slug}/settings`);
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

  const [, formAction, isPending] = useActionState(
    submitCreateEvent,
    initialState
  );

  return (
    <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="text-white text-xl md:text-2xl font-semibold">
            Create an event
          </div>
          <div className="text-white/70 text-sm leading-relaxed max-w-3xl">
            This creates a new event in{" "}
            <span className="text-white">Draft</span> mode. You can publish it
            later after adding rules, rubric, judges, staff, sponsors, and
            awards.
          </div>
        </div>

        <form action={formAction} className="flex flex-col gap-6 md:gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs md:text-sm text-white/75 flex items-center gap-1">
                Event name <span className="text-xs text-red-500">*</span>
              </label>
              <input
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Ascend Winter Hackathon"
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              />
              {errors.name ? (
                <p className="text-red-500 text-xs md:text-sm">{errors.name}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs md:text-sm text-white/75">
                Event slug (optional)
              </label>
              <input
                value={formData.slug}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, slug: e.target.value }))
                }
                placeholder="winter-hackathon"
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              />
              {errors.slug ? (
                <p className="text-red-500 text-xs md:text-sm">{errors.slug}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs md:text-sm text-white/75 flex items-center gap-1">
                Event type <span className="text-xs text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    type: e.target.value as "HACKATHON" | "IDEATHON",
                  }))
                }
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              >
                <option value="HACKATHON">Hackathon</option>
                <option value="IDEATHON">Ideathon</option>
              </select>
              {errors.type ? (
                <p className="text-red-500 text-xs md:text-sm">{errors.type}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs md:text-sm text-white/75 flex items-center gap-1">
                Visibility <span className="text-xs text-red-500">*</span>
              </label>
              <select
                value={formData.visibility}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    visibility: e.target.value as
                      | "PUBLIC_LISTED"
                      | "PUBLIC_UNLISTED"
                      | "PRIVATE",
                  }))
                }
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              >
                <option value="PUBLIC_LISTED">Public (Listed)</option>
                <option value="PUBLIC_UNLISTED">Public (Unlisted)</option>
                <option value="PRIVATE">Private</option>
              </select>
              {errors.visibility ? (
                <p className="text-red-500 text-xs md:text-sm">
                  {errors.visibility}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs md:text-sm text-white/75 flex items-center gap-1">
                Join mode <span className="text-xs text-red-500">*</span>
              </label>
              <select
                value={formData.joinMode}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    joinMode: e.target.value as
                      | "OPEN"
                      | "REQUEST"
                      | "INVITE_ONLY",
                  }))
                }
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              >
                <option value="OPEN">Open</option>
                <option value="REQUEST">Request</option>
                <option value="INVITE_ONLY">Invite only</option>
              </select>
              {errors.joinMode ? (
                <p className="text-red-500 text-xs md:text-sm">
                  {errors.joinMode}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs md:text-sm text-white/75 flex items-center gap-1">
                Max team size <span className="text-xs text-red-500">*</span>
              </label>

              <input
                type="text"
                inputMode="numeric"
                value={formData.maxTeamSize}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    maxTeamSize: e.target.value
                      .replace(/[^\d]/g, "")
                      .replace(/^0+(?=\d)/, ""),
                  }))
                }
                onBlur={() => {
                  setFormData((p) => ({
                    ...p,
                    maxTeamSize: p.maxTeamSize === "" ? "1" : p.maxTeamSize,
                  }));
                }}
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              />

              {errors.maxTeamSize ? (
                <p className="text-red-500 text-xs md:text-sm">
                  {errors.maxTeamSize}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-white/75 flex items-center gap-1">
              Hero title <span className="text-xs text-red-500">*</span>
            </label>
            <input
              value={formData.heroTitle}
              onChange={(e) =>
                setFormData((p) => ({ ...p, heroTitle: e.target.value }))
              }
              placeholder="Build something great."
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            />
            {errors.heroTitle ? (
              <p className="text-red-500 text-xs md:text-sm">
                {errors.heroTitle}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-white/75">
              Hero subtitle (optional)
            </label>
            <textarea
              value={formData.heroSubtitle}
              onChange={(e) =>
                setFormData((p) => ({ ...p, heroSubtitle: e.target.value }))
              }
              placeholder="Tell participants what this event is about…"
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors min-h-[120px] resize-none shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            />
            {errors.heroSubtitle ? (
              <p className="text-red-500 text-xs md:text-sm">
                {errors.heroSubtitle}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs md:text-sm text-white/75">
                Registration opens (optional)
              </label>
              <input
                type="datetime-local"
                value={formData.registrationOpensAt}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    registrationOpensAt: e.target.value,
                  }))
                }
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              />
              {errors.registrationOpensAt ? (
                <p className="text-red-500 text-xs md:text-sm">
                  {errors.registrationOpensAt}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs md:text-sm text-white/75">
                Registration closes (optional)
              </label>
              <input
                type="datetime-local"
                value={formData.registrationClosesAt}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    registrationClosesAt: e.target.value,
                  }))
                }
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              />
              {errors.registrationClosesAt ? (
                <p className="text-red-500 text-xs md:text-sm">
                  {errors.registrationClosesAt}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs md:text-sm text-white/75">
                Submission due (optional)
              </label>
              <input
                type="datetime-local"
                value={formData.submitDueAt}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    submitDueAt: e.target.value,
                  }))
                }
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              />
              {errors.submitDueAt ? (
                <p className="text-red-500 text-xs md:text-sm">
                  {errors.submitDueAt}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs md:text-sm text-white/75">
                Event starts (optional)
              </label>
              <input
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, startAt: e.target.value }))
                }
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              />
              {errors.startAt ? (
                <p className="text-red-500 text-xs md:text-sm">
                  {errors.startAt}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs md:text-sm text-white/75">
                Event ends (optional)
              </label>
              <input
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, endAt: e.target.value }))
                }
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              />
              {errors.endAt ? (
                <p className="text-red-500 text-xs md:text-sm">
                  {errors.endAt}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="text-white/80 text-sm font-medium">Location</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs md:text-sm text-white/75">
                  Location name (optional)
                </label>
                <input
                  value={formData.locationName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, locationName: e.target.value }))
                  }
                  placeholder="UCSD Jacobs Hall"
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                />
                {errors.locationName ? (
                  <p className="text-red-500 text-xs md:text-sm">
                    {errors.locationName}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs md:text-sm text-white/75">
                  Map URL (optional)
                </label>
                <input
                  value={formData.locationMapUrl}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      locationMapUrl: e.target.value,
                    }))
                  }
                  placeholder="https://maps.google.com/…"
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                />
                {errors.locationMapUrl ? (
                  <p className="text-red-500 text-xs md:text-sm">
                    {errors.locationMapUrl}
                  </p>
                ) : null}
                <div className="text-white/50 text-xs">
                  Paste a Google Maps link. This will be shown on the event
                  page.
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs md:text-sm text-white/75">
                Address (optional)
              </label>
              <input
                value={formData.locationAddress}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    locationAddress: e.target.value,
                  }))
                }
                placeholder="9500 Gilman Dr, La Jolla, CA 92093"
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              />
              {errors.locationAddress ? (
                <p className="text-red-500 text-xs md:text-sm">
                  {errors.locationAddress}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs md:text-sm text-white/75">
                Location notes (optional)
              </label>
              <textarea
                value={formData.locationNotes}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, locationNotes: e.target.value }))
                }
                placeholder="Room number, parking instructions, check-in info…"
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors min-h-[120px] resize-none shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              />
              {errors.locationNotes ? (
                <p className="text-red-500 text-xs md:text-sm">
                  {errors.locationNotes}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="text-white/80 text-sm font-medium">
              Rules & rubric
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs md:text-sm text-white/75">
                  Rules (Markdown)
                </label>
                <textarea
                  value={formData.rulesMarkdown}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      rulesMarkdown: e.target.value,
                    }))
                  }
                  placeholder={`## Rules\n- Be respectful\n- Teams up to 5\n\n## Schedule\n- Opening…`}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors min-h-[240px] resize-none shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] font-mono"
                />
                {errors.rulesMarkdown ? (
                  <p className="text-red-500 text-xs md:text-sm">
                    {errors.rulesMarkdown}
                  </p>
                ) : null}
                <div className="text-white/50 text-xs">
                  Supports headings, lists, bold, links. This will render on the
                  event page.
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs md:text-sm text-white/75">
                  Rubric (Markdown)
                </label>
                <textarea
                  value={formData.rubricMarkdown}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      rubricMarkdown: e.target.value,
                    }))
                  }
                  placeholder={`## Judging rubric\n- Innovation: 25%\n- Impact: 25%\n- Technical: 25%\n- Presentation: 25%`}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors min-h-[240px] resize-none shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] font-mono"
                />
                {errors.rubricMarkdown ? (
                  <p className="text-red-500 text-xs md:text-sm">
                    {errors.rubricMarkdown}
                  </p>
                ) : null}
                <div className="text-white/50 text-xs">
                  How submissions will be scored (shown to participants).
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="text-white/80 text-sm font-medium">Options</div>

            <label className="flex items-center gap-3 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
              <input
                type="checkbox"
                checked={formData.allowSelfJoinRequests}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    allowSelfJoinRequests: e.target.checked,
                  }))
                }
                className="h-4 w-4"
              />
              <div className="flex flex-col gap-1">
                <div className="text-white text-sm">
                  Allow self join requests
                </div>
                <div className="text-white/60 text-xs">
                  Users can request to join teams (if you enable team discovery
                  later).
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
              <input
                type="checkbox"
                checked={formData.lockTeamChangesAtStart}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    lockTeamChangesAtStart: e.target.checked,
                  }))
                }
                className="h-4 w-4"
              />
              <div className="flex flex-col gap-1">
                <div className="text-white text-sm">
                  Lock team changes at start
                </div>
                <div className="text-white/60 text-xs">
                  Prevent team membership changes after the event starts.
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
              <input
                type="checkbox"
                checked={formData.requireImages}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    requireImages: e.target.checked,
                  }))
                }
                className="h-4 w-4"
              />
              <div className="flex flex-col gap-1">
                <div className="text-white text-sm">
                  Require images on submission
                </div>
                <div className="text-white/60 text-xs">
                  Submissions must include images (you’ll enforce schema later).
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
              <input
                type="checkbox"
                checked={formData.requireVideoDemo}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    requireVideoDemo: e.target.checked,
                  }))
                }
                className="h-4 w-4"
              />
              <div className="flex flex-col gap-1">
                <div className="text-white text-sm">Require video demo</div>
                <div className="text-white/60 text-xs">
                  Submissions must include a demo video link/key (later in
                  schema).
                </div>
              </div>
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-white/75">
              Event cover image (optional)
            </label>
            <input
              ref={coverRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => onSelectCover(e.target.files?.[0] ?? null)}
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white/80 file:hover:bg-white/15 file:transition-colors"
            />
            {coverPreviewUrl ? (
              <div className="flex flex-col gap-2">
                <div className="relative w-full max-w-xl h-40 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                  <Image
                    src={coverPreviewUrl}
                    alt="Event cover preview"
                    fill
                    sizes="768px"
                    className="object-cover"
                  />
                </div>
              </div>
            ) : null}
            {errors.coverFile ? (
              <p className="text-red-500 text-xs md:text-sm">
                {errors.coverFile}
              </p>
            ) : null}
          </div>

          <div className="flex w-full justify-center">
            <button
              type="submit"
              disabled={isPending}
              className="w-full max-w-sm px-5 py-3 rounded-2xl cursor-pointer bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "Creating..." : "Create event"}
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

export default OrgCreateEventForm;
