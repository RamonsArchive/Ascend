"use client";

import React, { useMemo, useRef, useState, useActionState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { z } from "zod";
import { useRouter } from "next/navigation";

import type { ActionState } from "@/src/lib/global_types";
import type { EventCompleteData } from "@/src/lib/global_types";
import {
  parseServerActionResponse,
  TEN_MB,
  validateImageFile,
  slugify,
} from "@/src/lib/utils";

import { createEventImageUpload } from "@/src/lib/s3-upload";
import { uploadToS3PresignedPost, s3KeyToPublicUrl } from "@/src/lib/s3-client";
import { editEventDetailsClientSchema } from "@/src/lib/validation";
import { updateEventDetails } from "@/src/actions/event_actions";

const initialState: ActionState = { status: "INITIAL", error: "", data: null };

type Errors = Partial<
  Record<
    | "name"
    | "slug"
    | "heroTitle"
    | "heroSubtitle"
    | "type"
    | "visibility"
    | "joinMode"
    | "registrationOpensAt"
    | "registrationClosesAt"
    | "startAt"
    | "endAt"
    | "submitDueAt"
    | "maxTeamSize"
    | "coverFile",
    string
  >
>;

const EventEditDetailsForm = ({ event }: { event: EventCompleteData }) => {
  const router = useRouter();

  const allowedImageMimeTypes = useMemo(
    () => new Set(["image/png", "image/jpeg", "image/webp"]),
    [],
  );

  const coverRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Errors>({});
  const [statusMessage, setStatusMessage] = useState("");
  const [removeCover, setRemoveCover] = useState(false);

  const [formData, setFormData] = useState(() => ({
    name: event.name,
    slug: event.slug,

    heroTitle: event.heroTitle ?? "",
    heroSubtitle: event.heroSubtitle ?? "",

    type: event.type,
    visibility: event.visibility,
    joinMode: event.joinMode,

    registrationOpensAt: event.registrationOpensAt
      ? new Date(event.registrationOpensAt).toISOString().slice(0, 16)
      : "",
    registrationClosesAt: event.registrationClosesAt
      ? new Date(event.registrationClosesAt).toISOString().slice(0, 16)
      : "",
    startAt: event.startAt
      ? new Date(event.startAt).toISOString().slice(0, 16)
      : "",
    endAt: event.endAt ? new Date(event.endAt).toISOString().slice(0, 16) : "",
    submitDueAt: event.submitDueAt
      ? new Date(event.submitDueAt).toISOString().slice(0, 16)
      : "",

    maxTeamSize: event.maxTeamSize ?? 5,

    allowSelfJoinRequests: !!event.allowSelfJoinRequests,
    lockTeamChangesAtStart: !!event.lockTeamChangesAtStart,
    requireImages: !!event.requireImages,
    requireVideoDemo: !!event.requireVideoDemo,
  }));

  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(() => {
    return event.coverKey ? (s3KeyToPublicUrl(event.coverKey) as string) : null;
  });

  const onSelectCover = (file: File | null) => {
    setRemoveCover(false);
    if (!file) return;

    const ok = validateImageFile({
      file,
      options: { allowedMimeTypes: allowedImageMimeTypes, maxBytes: TEN_MB },
    });

    if (!ok) {
      toast.error("ERROR", {
        description: "Cover must be a PNG, JPG, or WEBP. Max size is 10MB.",
      });
      if (coverRef.current) coverRef.current.value = "";
      return;
    }

    setCoverPreviewUrl(URL.createObjectURL(file));
  };

  const submit = async (
    _state: ActionState,
    _fd: FormData,
  ): Promise<ActionState> => {
    try {
      void _state;
      void _fd;

      setErrors({});
      setStatusMessage("");

      const coverFile = coverRef.current?.files?.[0] ?? null;

      // auto slug from name if blank
      const safeSlug = formData.slug.trim() || slugify(formData.name);

      await editEventDetailsClientSchema.parseAsync({
        orgId: event.orgId,
        eventId: event.id,

        name: formData.name,
        slug: safeSlug,

        heroTitle: formData.heroTitle,
        heroSubtitle: formData.heroSubtitle,

        type: formData.type,
        visibility: formData.visibility,
        joinMode: formData.joinMode,

        registrationOpensAt: formData.registrationOpensAt,
        registrationClosesAt: formData.registrationClosesAt,
        startAt: formData.startAt,
        endAt: formData.endAt,
        submitDueAt: formData.submitDueAt,

        maxTeamSize: Number(formData.maxTeamSize),

        allowSelfJoinRequests: formData.allowSelfJoinRequests,
        lockTeamChangesAtStart: formData.lockTeamChangesAtStart,
        requireImages: formData.requireImages,
        requireVideoDemo: formData.requireVideoDemo,

        coverFile: coverFile ?? undefined,
        coverTmpKey: "",
        removeCover,
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

      let coverTmpKey: string | null = null;

      if (coverFile) {
        setStatusMessage("Uploading cover…");
        const presign = await createEventImageUpload({
          kind: "cover",
          fileName: coverFile.name,
          contentType: coverFile.type,
        });

        await uploadToS3PresignedPost({
          url: presign.url,
          fields: presign.fields,
          file: coverFile,
        });

        coverTmpKey = presign.key;
      }

      setStatusMessage("Saving event…");

      const fd = new FormData();
      fd.set("orgId", event.orgId);
      fd.set("eventId", event.id);
      fd.set("name", formData.name);
      fd.set("slug", safeSlug);

      fd.set("heroTitle", formData.heroTitle ?? "");
      fd.set("heroSubtitle", formData.heroSubtitle ?? "");

      fd.set("type", formData.type);
      fd.set("visibility", formData.visibility);
      fd.set("joinMode", formData.joinMode);

      if (formData.registrationOpensAt)
        fd.set("registrationOpensAt", formData.registrationOpensAt);
      if (formData.registrationClosesAt)
        fd.set("registrationClosesAt", formData.registrationClosesAt);
      if (formData.startAt) fd.set("startAt", formData.startAt);
      if (formData.endAt) fd.set("endAt", formData.endAt);
      if (formData.submitDueAt) fd.set("submitDueAt", formData.submitDueAt);

      fd.set("maxTeamSize", String(Number(formData.maxTeamSize) || 5));

      fd.set(
        "allowSelfJoinRequests",
        formData.allowSelfJoinRequests ? "1" : "0",
      );
      fd.set(
        "lockTeamChangesAtStart",
        formData.lockTeamChangesAtStart ? "1" : "0",
      );
      fd.set("requireImages", formData.requireImages ? "1" : "0");
      fd.set("requireVideoDemo", formData.requireVideoDemo ? "1" : "0");

      fd.set("removeCover", removeCover ? "1" : "0");
      if (coverTmpKey) fd.set("coverTmpKey", coverTmpKey);

      const result = await updateEventDetails(initialState, fd);
      if (result.status === "ERROR") {
        setStatusMessage(result.error || "Failed to save.");
        toast.error("ERROR", { description: result.error });
        return result;
      }

      setStatusMessage("Saved.");
      toast.success("SUCCESS", { description: "Event updated." });
      router.refresh();
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
          (k) => (formatted[k] = fieldErrors[k]?.[0] || ""),
        );
        setErrors(formatted as Errors);

        toast.error("ERROR", {
          description: Object.values(formatted).filter(Boolean).join(", "),
        });

        return parseServerActionResponse({
          status: "ERROR",
          error: Object.values(formatted).filter(Boolean).join(", "),
          data: null,
        }) as ActionState;
      }

      toast.error("ERROR", { description: "An error occurred while saving." });
      return parseServerActionResponse({
        status: "ERROR",
        error: "An error occurred while saving",
        data: null,
      }) as ActionState;
    }
  };

  const [, formAction, isPending] = useActionState(submit, initialState);

  return (
    <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
      <form action={formAction} className="flex flex-col gap-6 md:gap-8">
        {/* Cover */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <label className="text-xs md:text-sm text-white/75">
              Event cover (optional)
            </label>

            {event.coverKey ? (
              <button
                type="button"
                onClick={() => {
                  setRemoveCover(true);
                  if (coverRef.current) coverRef.current.value = "";
                  setCoverPreviewUrl(null);
                }}
                className="text-xs text-white/70 hover:text-white underline text-left"
              >
                Remove cover
              </button>
            ) : null}
          </div>

          <input
            ref={coverRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => onSelectCover(e.target.files?.[0] ?? null)}
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-[rgba(255,61,138,0.35)] focus:ring-2 focus:ring-[rgba(255,61,138,0.15)] transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white/80 file:hover:bg-white/15 file:transition-colors"
          />

          {coverPreviewUrl ? (
            <div className="relative w-full h-[180px] rounded-3xl overflow-hidden border border-white/10 bg-primary-950/70">
              <Image
                src={coverPreviewUrl}
                alt="Event cover preview"
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-cover opacity-85"
              />
              {/* EXACT hero blend */}
              <div className="absolute inset-0 bg-linear-to-t from-primary-950 via-primary-950/30 to-transparent" />
            </div>
          ) : (
            <div className="text-xs text-white/50">
              Recommended: wide image (at least 1600px). PNG/JPG/WEBP.
            </div>
          )}

          {errors.coverFile ? (
            <p className="text-red-500 text-xs md:text-sm">
              {errors.coverFile}
            </p>
          ) : null}
        </div>

        {/* Main fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-white/75">
              Event name
            </label>
            <input
              value={formData.name}
              onChange={(e) =>
                setFormData((p) => ({ ...p, name: e.target.value }))
              }
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-[rgba(255,61,138,0.35)] focus:ring-2 focus:ring-[rgba(255,61,138,0.15)] transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            />
            {errors.name ? (
              <p className="text-red-500 text-xs md:text-sm">{errors.name}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-white/75">Slug</label>
            <input
              value={formData.slug}
              onChange={(e) =>
                setFormData((p) => ({ ...p, slug: e.target.value }))
              }
              placeholder={slugify(formData.name)}
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-[rgba(255,61,138,0.35)] focus:ring-2 focus:ring-[rgba(255,61,138,0.15)] transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            />
            {errors.slug ? (
              <p className="text-red-500 text-xs md:text-sm">{errors.slug}</p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-white/75">
              Hero title (optional)
            </label>
            <input
              value={formData.heroTitle}
              onChange={(e) =>
                setFormData((p) => ({ ...p, heroTitle: e.target.value }))
              }
              placeholder="Short headline shown on the event page"
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-[rgba(255,61,138,0.35)] focus:ring-2 focus:ring-[rgba(255,61,138,0.15)] transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-white/75">
              Hero subtitle (optional)
            </label>
            <input
              value={formData.heroSubtitle}
              onChange={(e) =>
                setFormData((p) => ({ ...p, heroSubtitle: e.target.value }))
              }
              placeholder="One sentence to explain the vibe"
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-[rgba(255,61,138,0.35)] focus:ring-2 focus:ring-[rgba(255,61,138,0.15)] transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            />
          </div>
        </div>

        {/* Date controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {[
            ["registrationOpensAt", "Registration opens"],
            ["registrationClosesAt", "Registration closes"],
            ["startAt", "Event starts"],
            ["endAt", "Event ends"],
            ["submitDueAt", "Submission due"],
          ].map(([k, label]) => (
            <div key={k} className="flex flex-col gap-2">
              <label className="text-xs md:text-sm text-white/75">
                {label}
              </label>
              <input
                type="datetime-local"
                value={(formData as any)[k]}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, [k]: e.target.value }))
                }
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-[rgba(255,61,138,0.35)] focus:ring-2 focus:ring-[rgba(255,61,138,0.15)] transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              />
            </div>
          ))}
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-white/75">
              Max team size
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={formData.maxTeamSize}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  maxTeamSize: Number(e.target.value),
                }))
              }
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-[rgba(255,61,138,0.35)] focus:ring-2 focus:ring-[rgba(255,61,138,0.15)] transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-white/75">
              Join mode
            </label>
            <select
              value={formData.joinMode}
              onChange={(e) =>
                setFormData((p) => ({ ...p, joinMode: e.target.value }))
              }
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-[rgba(255,61,138,0.35)] focus:ring-2 focus:ring-[rgba(255,61,138,0.15)] transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            >
              <option value="OPEN">Open</option>
              <option value="REQUEST">Request</option>
              <option value="INVITE_ONLY">Invite-only</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {[
            ["allowSelfJoinRequests", "Allow join requests"],
            ["lockTeamChangesAtStart", "Lock team changes at start"],
            ["requireImages", "Require images"],
            ["requireVideoDemo", "Require video demo"],
          ].map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() =>
                setFormData((p) => ({ ...p, [k]: !(p as any)[k] }))
              }
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] text-left"
            >
              <span className="font-semibold text-white">{label}</span>
              <span className="ml-2 text-white/60 text-xs">
                {(formData as any)[k] ? "On" : "Off"}
              </span>
            </button>
          ))}
        </div>

        <div className="flex w-full justify-center">
          <button
            type="submit"
            disabled={isPending}
            className="w-full max-w-sm px-5 py-3 rounded-2xl cursor-pointer bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save event"}
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
  );
};

export default EventEditDetailsForm;
