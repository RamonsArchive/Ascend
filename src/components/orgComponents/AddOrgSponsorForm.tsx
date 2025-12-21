"use client";

import React, { useMemo, useRef, useState, useActionState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import SplitText from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import type { ActionState } from "@/src/lib/global_types";
import {
  parseServerActionResponse,
  TEN_MB,
  validateImageFile,
} from "@/src/lib/utils";
import { createOrgImageUpload } from "@/src/actions/s3_actions";
import { uploadToS3PresignedPost } from "@/src/lib/s3-client";
import { addSponsorToOrg } from "@/src/actions/org_sponsor_actions";
import { sponsorClientFormSchema } from "@/src/lib/validation";

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

const AddOrgSponsorForm = ({ orgId }: { orgId: string }) => {
  const allowedImageMimeTypes = useMemo(
    () => new Set(["image/png", "image/jpeg", "image/webp"]),
    []
  );

  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const nameLabelRef = useRef<HTMLLabelElement>(null);
  const tierLabelRef = useRef<HTMLLabelElement>(null);
  const websiteLabelRef = useRef<HTMLLabelElement>(null);
  const descriptionLabelRef = useRef<HTMLLabelElement>(null);
  const logoLabelRef = useRef<HTMLLabelElement>(null);
  const coverLabelRef = useRef<HTMLLabelElement>(null);

  const [statusMessage, setStatusMessage] = useState("");
  const [formData, setFormData] = useState(() => ({
    sponsorName: "",
    sponsorWebsite: "",
    sponsorDescription: "",
    tier: "COMMUNITY" as SponsorTier,
  }));

  const [errors, setErrors] = useState<{
    sponsorName?: string;
    sponsorWebsite?: string;
    sponsorDescription?: string;
    tier?: string;
    logoFile?: string;
    coverFile?: string;
  }>({});

  useGSAP(() => {
    let cleanup: undefined | (() => void);

    const initAnimations = () => {
      if (
        !nameLabelRef.current ||
        !tierLabelRef.current ||
        !websiteLabelRef.current ||
        !descriptionLabelRef.current ||
        !logoLabelRef.current ||
        !coverLabelRef.current ||
        !submitButtonRef.current
      ) {
        requestAnimationFrame(initAnimations);
        return;
      }

      const triggerEl = document.getElementById("add-org-sponsor-form");
      if (!triggerEl) {
        requestAnimationFrame(initAnimations);
        return;
      }

      const splits = [
        new SplitText(nameLabelRef.current, { type: "words" }),
        new SplitText(tierLabelRef.current, { type: "words" }),
        new SplitText(websiteLabelRef.current, { type: "words" }),
        new SplitText(descriptionLabelRef.current, { type: "words" }),
        new SplitText(logoLabelRef.current, { type: "words" }),
        new SplitText(coverLabelRef.current, { type: "words" }),
      ];

      const allLabels = splits.flatMap((s) => s.words);
      const allInputs = [
        submitButtonRef.current,
        ...Array.from(
          triggerEl.querySelectorAll("input, textarea, select")
        ).filter(Boolean),
      ] as HTMLElement[];

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
  }, []);

  const submitSponsorForm = async (
    _state: ActionState,
    _fd: FormData
  ): Promise<ActionState> => {
    try {
      void _state;
      void _fd;

      const logoFile = logoRef.current?.files?.[0] ?? null;
      const coverFile = coverRef.current?.files?.[0] ?? null;

      const parsed = await sponsorClientFormSchema.parseAsync({
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
    submitSponsorForm,
    initialState
  );

  return (
    <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
      <form
        id="add-org-sponsor-form"
        action={formAction}
        className="flex flex-col gap-6 md:gap-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="flex flex-col gap-2">
            <label
              ref={nameLabelRef}
              className="text-xs md:text-sm text-white/75 flex items-center gap-1"
            >
              Sponsor name
              <span className="text-xs text-red-500">*</span>
            </label>
            <input
              value={formData.sponsorName}
              onChange={(e) =>
                setFormData((p) => ({ ...p, sponsorName: e.target.value }))
              }
              placeholder="Acme Inc."
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            />
            {errors.sponsorName ? (
              <p className="text-red-500 text-xs md:text-sm">
                {errors.sponsorName}
              </p>
            ) : null}
          </div>

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
        </div>

        <div className="flex flex-col gap-2">
          <label
            ref={websiteLabelRef}
            className="text-xs md:text-sm text-white/75"
          >
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
          {errors.sponsorWebsite ? (
            <p className="text-red-500 text-xs md:text-sm">
              {errors.sponsorWebsite}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label
            ref={descriptionLabelRef}
            className="text-xs md:text-sm text-white/75"
          >
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
          {errors.sponsorDescription ? (
            <p className="text-red-500 text-xs md:text-sm">
              {errors.sponsorDescription}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="flex flex-col gap-2">
            <label
              ref={logoLabelRef}
              className="text-xs md:text-sm text-white/75"
            >
              Sponsor logo
            </label>
            <input
              ref={logoRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white/80 file:hover:bg-white/15 file:transition-colors"
            />
            {errors.logoFile ? (
              <p className="text-red-500 text-xs md:text-sm">
                {errors.logoFile}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <label
              ref={coverLabelRef}
              className="text-xs md:text-sm text-white/75"
            >
              Sponsor cover
            </label>
            <input
              ref={coverRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white/80 file:hover:bg-white/15 file:transition-colors"
            />
            {errors.coverFile ? (
              <p className="text-red-500 text-xs md:text-sm">
                {errors.coverFile}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex w-full justify-center">
          <button
            type="submit"
            disabled={isPending}
            ref={submitButtonRef}
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
  );
};

export default AddOrgSponsorForm;
