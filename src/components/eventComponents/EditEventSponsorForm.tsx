"use client";

import React, { useMemo, useRef, useState, useActionState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";

import type {
  ActionState,
  EventSponsorWithSponsor,
  SponsorTier,
} from "@/src/lib/global_types";
import {
  parseServerActionResponse,
  TEN_MB,
  validateImageFile,
} from "@/src/lib/utils";
import { createOrgImageUpload } from "@/src/actions/s3_actions";
import { uploadToS3PresignedPost } from "@/src/lib/s3-client";

import {
  updateEventSponsor,
  removeEventSponsor,
} from "@/src/actions/event_sponsor_actions";
import { editEventSponsorClientSchema } from "@/src/lib/validation";

const initialState: ActionState = { status: "INITIAL", error: "", data: null };

const EditEventSponsorForm = ({
  eventId,
  initialSponsor,
}: {
  eventId: string;
  initialSponsor: EventSponsorWithSponsor;
}) => {
  void eventId;
  const router = useRouter();

  const allowedImageMimeTypes = useMemo(
    () => new Set(["image/png", "image/jpeg", "image/webp"]),
    []
  );
  const logoRef = useRef<HTMLInputElement>(null);

  const [statusMessage, setStatusMessage] = useState("");
  const [showBlurbPreview, setShowBlurbPreview] = useState(false);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  const [errors, setErrors] = useState<
    Partial<
      Record<
        "tier" | "isActive" | "order" | "displayName" | "blurb" | "logoFile",
        string
      >
    >
  >({});

  const [formData, setFormData] = useState(() => ({
    tier: initialSponsor.tier as SponsorTier,
    isActive: Boolean(initialSponsor.isActive),
    displayName: initialSponsor.displayName ?? "",
    blurb: initialSponsor.blurb ?? "",
  }));

  const [orderInput, setOrderInput] = useState<string>(
    String(initialSponsor.order ?? 0)
  );

  const name =
    initialSponsor.displayName?.trim() || initialSponsor.sponsor.name;
  const slug = initialSponsor.sponsor.slug;

  const onSelectLogo = (file: File | null) => {
    if (!file) {
      setLogoPreviewUrl(null);
      return;
    }
    const ok = validateImageFile({
      file,
      options: { allowedMimeTypes: allowedImageMimeTypes, maxBytes: TEN_MB },
    });
    if (!ok) {
      toast.error("ERROR", {
        description: "Logo must be PNG/JPG/WEBP. Max 10MB.",
      });
      if (logoRef.current) logoRef.current.value = "";
      setLogoPreviewUrl(null);
      return;
    }
    setLogoPreviewUrl(URL.createObjectURL(file));
  };

  const submitUpdate = async (
    _s: ActionState,
    _fd: FormData
  ): Promise<ActionState> => {
    try {
      void _s;
      void _fd;

      setErrors({});
      const logoFile = logoRef.current?.files?.[0] ?? null;
      const orderValue = Math.max(0, Number(orderInput) || 0);

      await editEventSponsorClientSchema.parseAsync({
        eventSponsorId: initialSponsor.id,
        tier: formData.tier,
        isActive: formData.isActive,
        order: orderValue,
        displayName: formData.displayName,
        blurb: formData.blurb,
        logoFile: logoFile ?? undefined,
      });

      let logoKey: string | null = null;
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
              message: "Logo must be PNG/JPG/WEBP. Max 10MB.",
            },
          ]);
        }

        setStatusMessage("Uploading logo…");
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

      setStatusMessage("Saving…");

      const fd = new FormData();
      fd.set("eventSponsorId", initialSponsor.id);
      fd.set("tier", formData.tier);
      fd.set("isActive", formData.isActive ? "true" : "false");
      fd.set("order", String(orderValue));
      fd.set("displayName", formData.displayName ?? "");
      fd.set("blurb", formData.blurb ?? "");
      if (logoKey) fd.set("logoKey", logoKey);

      const res = await updateEventSponsor(initialState, fd);
      if (res.status === "ERROR") {
        setStatusMessage(res.error || "Failed to update sponsor.");
        toast.error("ERROR", {
          description: res.error || "Failed to update sponsor.",
        });
        return res;
      }

      toast.success("SUCCESS", { description: "Sponsor updated." });
      setStatusMessage("Saved.");
      router.refresh();
      return res;
    } catch (e) {
      console.error(e);
      setStatusMessage("Please fix the highlighted fields.");

      if (e instanceof z.ZodError) {
        const fieldErrors = z.flattenError(e).fieldErrors as Record<
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

  const submitRemove = async (): Promise<void> => {
    const ok = window.confirm(`Remove sponsor "${name}" from this event?`);
    if (!ok) return;

    try {
      setStatusMessage("Removing…");
      const fd = new FormData();
      fd.set("eventSponsorId", initialSponsor.id);

      const res = await removeEventSponsor(initialState, fd);
      if (res.status === "ERROR") {
        setStatusMessage(res.error || "Failed to remove sponsor.");
        toast.error("ERROR", {
          description: res.error || "Failed to remove sponsor.",
        });
        return;
      }

      toast.success("SUCCESS", { description: "Sponsor removed." });
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("ERROR", { description: "Failed to remove sponsor." });
    }
  };

  const [, updateAction, updating] = useActionState(submitUpdate, initialState);

  return (
    <div className="w-full rounded-3xl bg-white/4 border border-white/10 px-6 py-6 md:px-8 md:py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <form action={updateAction} className="flex flex-col gap-6 md:gap-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
          <div className="flex flex-col gap-2 min-w-0">
            <div className="text-white font-semibold text-lg truncate">
              {name}
            </div>
            <div className="text-white/50 text-xs truncate">@{slug}</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={submitRemove}
              className="w-full sm:w-auto px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-xs md:text-sm"
            >
              Remove
            </button>

            <button
              type="submit"
              disabled={updating}
              className="w-full sm:w-auto px-4 py-2 rounded-2xl bg-white text-primary-950 font-semibold text-xs md:text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {updating ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors"
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
            {errors.tier ? (
              <p className="text-red-500 text-xs md:text-sm">{errors.tier}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-white/75">Active</label>
            <button
              type="button"
              onClick={() =>
                setFormData((p) => ({ ...p, isActive: !p.isActive }))
              }
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-sm text-left"
            >
              {formData.isActive ? "Active" : "Inactive"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-white/75">
              Display name (optional)
            </label>
            <input
              value={formData.displayName}
              onChange={(e) =>
                setFormData((p) => ({ ...p, displayName: e.target.value }))
              }
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors"
            />
            {errors.displayName ? (
              <p className="text-red-500 text-xs md:text-sm">
                {errors.displayName}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-white/75">Order</label>
            <input
              type="text"
              inputMode="numeric"
              value={orderInput}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) =>
                setOrderInput(
                  e.target.value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "")
                )
              }
              onBlur={() => setOrderInput(orderInput === "" ? "0" : orderInput)}
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors"
            />
            {errors.order ? (
              <p className="text-red-500 text-xs md:text-sm">{errors.order}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs md:text-sm text-white/75">
            Blurb (Markdown, optional)
          </label>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-xs text-white/60">Markdown supported</div>
            <button
              type="button"
              onClick={() => setShowBlurbPreview((p) => !p)}
              className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-xs md:text-sm"
            >
              {showBlurbPreview ? "Edit" : "Preview"}
            </button>
          </div>

          {showBlurbPreview ? (
            <div className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="prose prose-invert max-w-none prose-p:text-white/75 prose-a:text-accent-400 prose-strong:text-white">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize]}
                >
                  {formData.blurb || "*Nothing yet…*"}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <textarea
              value={formData.blurb}
              onChange={(e) =>
                setFormData((p) => ({ ...p, blurb: e.target.value }))
              }
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors min-h-[140px] resize-none"
            />
          )}
          {errors.blurb ? (
            <p className="text-red-500 text-xs md:text-sm">{errors.blurb}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs md:text-sm text-white/75">
            Event logo override (optional)
          </label>
          <input
            ref={logoRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => onSelectLogo(e.target.files?.[0] ?? null)}
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white/80"
          />
          {logoPreviewUrl ? (
            <div className="relative w-full max-w-xs h-28 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
              <Image
                src={logoPreviewUrl}
                alt="Logo preview"
                fill
                sizes="320px"
                className="object-contain p-3"
              />
            </div>
          ) : null}
          {errors.logoFile ? (
            <p className="text-red-500 text-xs md:text-sm">{errors.logoFile}</p>
          ) : null}
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

export default EditEventSponsorForm;
