"use client";

import React, { useMemo, useRef, useState, useActionState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import SplitText from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useRouter } from "next/navigation";

import type { ActionState } from "@/src/lib/global_types";
import {
  parseServerActionResponse,
  TEN_MB,
  validateImageFile,
} from "@/src/lib/utils";
import { createOrgImageUpload } from "@/src/actions/s3_actions";
import { uploadToS3PresignedPost, s3KeyToPublicUrl } from "@/src/lib/s3-client";
import {
  updateOrgSponsor,
  removeSponsorFromOrg,
} from "@/src/actions/org_sponsor_edit_actions";
import { editOrgSponsorClientSchema } from "@/src/lib/validation";
import type { OrgSponsorWithSponsor } from "@/src/components/orgComponents/EditOrgSponsorsSection";

gsap.registerPlugin(ScrollTrigger, SplitText);

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

type EditSponsorErrors = Partial<
  Record<
    "tier" | "isActive" | "displayName" | "blurb" | "order" | "logoFile",
    string
  >
>;

const EditOrgSponsorForm = ({
  orgId,
  initialSponsor,
}: {
  orgId: string;
  initialSponsor: OrgSponsorWithSponsor;
}) => {
  const router = useRouter();
  const allowedImageMimeTypes = useMemo(
    () => new Set(["image/png", "image/jpeg", "image/webp"]),
    []
  );

  const triggerId = `org-sponsor-form-${initialSponsor.sponsorId}`;

  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const removeButtonRef = useRef<HTMLButtonElement>(null);

  const tierLabelRef = useRef<HTMLLabelElement>(null);
  const activeLabelRef = useRef<HTMLLabelElement>(null);
  const displayNameLabelRef = useRef<HTMLLabelElement>(null);
  const blurbLabelRef = useRef<HTMLLabelElement>(null);
  const orderLabelRef = useRef<HTMLLabelElement>(null);
  const logoLabelRef = useRef<HTMLLabelElement>(null);

  const logoRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<EditSponsorErrors>({});
  const [statusMessage, setStatusMessage] = useState("");
  const [removeLogo, setRemoveLogo] = useState(false);

  const [formData, setFormData] = useState(() => ({
    tier: (initialSponsor.tier as SponsorTier) ?? "COMMUNITY",
    isActive: initialSponsor.isActive ?? true,
    displayName: initialSponsor.displayName ?? "",
    blurb: initialSponsor.blurb ?? "",
    order: initialSponsor.order ?? 0,
  }));

  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(() => {
    const key =
      initialSponsor.logoKey ?? initialSponsor.sponsor.logoKey ?? null;
    return key ? (s3KeyToPublicUrl(key) as string) : null;
  });

  useGSAP(() => {
    let cleanup: undefined | (() => void);

    const initAnimations = () => {
      if (
        !tierLabelRef.current ||
        !activeLabelRef.current ||
        !displayNameLabelRef.current ||
        !blurbLabelRef.current ||
        !orderLabelRef.current ||
        !logoLabelRef.current ||
        !submitButtonRef.current
      ) {
        requestAnimationFrame(initAnimations);
        return;
      }

      const triggerEl = document.getElementById(triggerId);
      if (!triggerEl) {
        requestAnimationFrame(initAnimations);
        return;
      }

      const splits = [
        new SplitText(tierLabelRef.current, { type: "words" }),
        new SplitText(activeLabelRef.current, { type: "words" }),
        new SplitText(displayNameLabelRef.current, { type: "words" }),
        new SplitText(blurbLabelRef.current, { type: "words" }),
        new SplitText(orderLabelRef.current, { type: "words" }),
        new SplitText(logoLabelRef.current, { type: "words" }),
      ];

      const allLabels = splits.flatMap((s) => s.words);
      const allInputs = [
        submitButtonRef.current,
        removeButtonRef.current,
        ...Array.from(triggerEl.querySelectorAll("input, textarea, select")),
      ].filter(Boolean) as HTMLElement[];

      gsap.set(allLabels, { opacity: 0, y: 48 });
      gsap.set(allInputs, { opacity: 0, y: 48 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerEl,
          start: "top 85%",
          end: "top 40%",
          scrub: 1,
        },
        defaults: { ease: "power3.out", duration: 0.6 },
      });

      tl.to(allLabels, { opacity: 1, y: 0, stagger: 0.02 }, 0).to(
        allInputs,
        { opacity: 1, y: 0, stagger: 0.04 },
        0.05
      );

      requestAnimationFrame(() => ScrollTrigger.refresh());

      cleanup = () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        splits.forEach((s) => s.revert());
      };
    };

    initAnimations();
    return () => cleanup?.();
  }, [triggerId]);

  const onSelectLogo = (file: File | null) => {
    setRemoveLogo(false);
    if (!file) return;

    const ok = validateImageFile({
      file,
      options: { allowedMimeTypes: allowedImageMimeTypes, maxBytes: TEN_MB },
    });
    if (!ok) {
      toast.error("ERROR", {
        description: "Logo must be a PNG, JPG, or WEBP. Max size is 10MB.",
      });
      if (logoRef.current) logoRef.current.value = "";
      return;
    }
    setLogoPreviewUrl(URL.createObjectURL(file));
  };

  const submitForm = async (
    _state: ActionState,
    _fd: FormData
  ): Promise<ActionState> => {
    try {
      void _state;
      void _fd;

      setErrors({});

      const logoFile = logoRef.current?.files?.[0] ?? null;

      await editOrgSponsorClientSchema.parseAsync({
        orgId,
        sponsorId: initialSponsor.sponsorId,
        tier: formData.tier,
        isActive: formData.isActive,
        displayName: formData.displayName,
        blurb: formData.blurb,
        order: formData.order,
        logoFile: logoFile ?? undefined,
        removeLogo,
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

      setStatusMessage("Uploading logo…");

      let logoKey: string | null = null;
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

      setStatusMessage("Saving sponsor…");

      const fd = new FormData();
      fd.set("orgId", orgId);
      fd.set("sponsorId", initialSponsor.sponsorId);
      fd.set("tier", formData.tier);
      fd.set("isActive", formData.isActive ? "true" : "false");
      fd.set("displayName", formData.displayName ?? "");
      fd.set("blurb", formData.blurb ?? "");
      fd.set("order", String(formData.order ?? 0));
      fd.set("removeLogo", removeLogo ? "true" : "false");
      if (logoKey) fd.set("logoKey", logoKey);

      const result = await updateOrgSponsor(initialState, fd);
      if (result.status === "ERROR") {
        setStatusMessage(result.error || "Failed to update sponsor.");
        toast.error("ERROR", { description: result.error });
        return result;
      }

      setStatusMessage("Saved.");
      toast.success("SUCCESS", { description: "Sponsor updated." });
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
        const formattedErrors: Record<string, string> = {};
        Object.keys(fieldErrors).forEach((key) => {
          formattedErrors[key] = fieldErrors[key]?.[0] || "";
        });
        setErrors(formattedErrors as EditSponsorErrors);
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

  const removeLink = async () => {
    const ok = window.confirm(
      `Remove ${initialSponsor.sponsor.name} from this organization?`
    );
    if (!ok) return;

    try {
      setStatusMessage("Removing sponsor…");
      const fd = new FormData();
      fd.set("orgId", orgId);
      fd.set("sponsorId", initialSponsor.sponsorId);

      const result = await removeSponsorFromOrg(initialState, fd);
      if (result.status === "ERROR") {
        setStatusMessage(result.error || "Failed to remove sponsor.");
        toast.error("ERROR", { description: result.error });
        return;
      }
      setStatusMessage("Removed.");
      toast.success("SUCCESS", { description: "Sponsor removed." });
      router.refresh();
    } catch (e) {
      console.error(e);
      setStatusMessage("Failed to remove sponsor.");
      toast.error("ERROR", { description: "Failed to remove sponsor." });
    }
  };

  const [, formAction, isPending] = useActionState(submitForm, initialState);

  return (
    <div
      id={triggerId}
      className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4"
    >
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 md:gap-6">
          <div className="flex items-start gap-3">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0">
              {logoPreviewUrl ? (
                <Image
                  src={logoPreviewUrl}
                  alt={`${initialSponsor.sponsor.name} logo`}
                  fill
                  sizes="44px"
                  className="object-contain p-2"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-white/70">
                  {initialSponsor.sponsor.name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-white font-semibold leading-tight">
                {initialSponsor.sponsor.name}
              </div>
              <div className="text-white/50 text-xs">
                @{initialSponsor.sponsor.slug}
              </div>
              {initialSponsor.sponsor.websiteKey ? (
                <div className="text-white/60 text-xs break-all">
                  {initialSponsor.sponsor.websiteKey}
                </div>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            ref={removeButtonRef}
            onClick={removeLink}
            className="w-full md:w-auto px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-xs md:text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          >
            Remove from org
          </button>
        </div>

        <form action={formAction} className="flex flex-col gap-6 md:gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="flex flex-col gap-2">
              <label
                ref={tierLabelRef}
                className="text-xs md:text-sm text-white/75"
              >
                Tier
              </label>
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
              {errors.tier ? (
                <p className="text-red-500 text-xs md:text-sm">{errors.tier}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label
                ref={activeLabelRef}
                className="text-xs md:text-sm text-white/75"
              >
                Active
              </label>
              <button
                type="button"
                onClick={() =>
                  setFormData((p) => ({ ...p, isActive: !p.isActive }))
                }
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] text-left"
              >
                {formData.isActive ? "Active" : "Inactive"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="flex flex-col gap-2">
              <label
                ref={displayNameLabelRef}
                className="text-xs md:text-sm text-white/75"
              >
                Display name (optional)
              </label>
              <input
                value={formData.displayName}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, displayName: e.target.value }))
                }
                placeholder={initialSponsor.sponsor.name}
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              />
              {errors.displayName ? (
                <p className="text-red-500 text-xs md:text-sm">
                  {errors.displayName}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label
                ref={orderLabelRef}
                className="text-xs md:text-sm text-white/75"
              >
                Order
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    order: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              />
              {errors.order ? (
                <p className="text-red-500 text-xs md:text-sm">
                  {errors.order}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label
              ref={blurbLabelRef}
              className="text-xs md:text-sm text-white/75"
            >
              Blurb (optional)
            </label>
            <textarea
              value={formData.blurb}
              onChange={(e) =>
                setFormData((p) => ({ ...p, blurb: e.target.value }))
              }
              placeholder="Optional org-specific sponsor blurb…"
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors min-h-[120px] resize-none shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            />
            {errors.blurb ? (
              <p className="text-red-500 text-xs md:text-sm">{errors.blurb}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label
              ref={logoLabelRef}
              className="text-xs md:text-sm text-white/75"
            >
              Org logo override (optional)
            </label>
            <input
              ref={logoRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => onSelectLogo(e.target.files?.[0] ?? null)}
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white/80 file:hover:bg-white/15 file:transition-colors"
            />

            <div className="flex flex-col gap-2">
              {initialSponsor.logoKey ? (
                <button
                  type="button"
                  onClick={() => {
                    setRemoveLogo(true);
                    if (logoRef.current) logoRef.current.value = "";
                    const fallbackKey = initialSponsor.sponsor.logoKey ?? null;
                    setLogoPreviewUrl(
                      fallbackKey
                        ? (s3KeyToPublicUrl(fallbackKey) as string)
                        : null
                    );
                  }}
                  className="text-xs text-white/70 hover:text-white underline text-left"
                >
                  Remove override logo
                </button>
              ) : null}
              {errors.logoFile ? (
                <p className="text-red-500 text-xs md:text-sm">
                  {errors.logoFile}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex w-full justify-center">
            <button
              type="submit"
              ref={submitButtonRef}
              disabled={isPending}
              className="w-full max-w-sm px-5 py-3 rounded-2xl cursor-pointer bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "Saving..." : "Save sponsor"}
            </button>
          </div>
        </form>

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

export default EditOrgSponsorForm;
