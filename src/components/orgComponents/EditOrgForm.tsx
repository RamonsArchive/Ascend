"use client";

import React, { useMemo, useRef, useState, useActionState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { z } from "zod";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import SplitText from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRouter } from "next/navigation";

import { edit_org_data } from "@/src/constants/orgConstants/org_index";
import type { ActionState } from "@/src/lib/global_types";
import {
  parseServerActionResponse,
  TEN_MB,
  updatePhoneNumber,
  validateImageFile,
} from "@/src/lib/utils";
import { editOrgClientSchema } from "@/src/lib/validation";
import { createOrgImageUpload } from "@/src/actions/s3_actions";
import { uploadToS3PresignedPost } from "@/src/lib/s3-client";
import { updateOrganization } from "@/src/actions/org_edit_actions";
import { s3KeyToPublicUrl } from "@/src/lib/s3-client";

gsap.registerPlugin(ScrollTrigger, SplitText);

const initialState: ActionState = {
  status: "INITIAL",
  error: "",
  data: null,
};

type EditOrgClientErrors = Partial<
  Record<
    | "name"
    | "description"
    | "publicEmail"
    | "publicPhone"
    | "websiteUrl"
    | "logoFile"
    | "coverFile"
    | "contactNote",
    string
  >
>;

function formatPhoneDisplayFromDigits(digits: string) {
  const cleaned = digits.replace(/[^0-9]/g, "");
  if (cleaned.length >= 6) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  }
  if (cleaned.length >= 3) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  return cleaned;
}

const EditOrgForm = ({
  submitLabel,
  orgId,
  initialOrg,
}: {
  submitLabel: string;
  orgId: string;
  initialOrg: {
    name: string;
    description: string | null;
    publicEmail: string | null;
    publicPhone: string | null;
    websiteUrl: string | null;
    contactNote: string | null;
    logoKey: string | null;
    coverKey: string | null;
  };
}) => {
  const router = useRouter();
  const { form } = edit_org_data;

  const allowedImageMimeTypes = useMemo(
    () => new Set(["image/png", "image/jpeg", "image/webp"]),
    [],
  );

  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const nameLabelRef = useRef<HTMLLabelElement>(null);
  const descriptionLabelRef = useRef<HTMLLabelElement>(null);
  const publicEmailLabelRef = useRef<HTMLLabelElement>(null);
  const publicPhoneLabelRef = useRef<HTMLLabelElement>(null);
  const websiteUrlLabelRef = useRef<HTMLLabelElement>(null);
  const logoLabelRef = useRef<HTMLLabelElement>(null);
  const coverLabelRef = useRef<HTMLLabelElement>(null);
  const contactNoteLabelRef = useRef<HTMLLabelElement>(null);
  const descriptionPreviewButtonRef = useRef<HTMLButtonElement>(null);
  const contactNotePreviewButtonRef = useRef<HTMLButtonElement>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const publicEmailRef = useRef<HTMLInputElement>(null);
  const publicPhoneRef = useRef<HTMLInputElement>(null);
  const websiteUrlRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const contactNoteRef = useRef<HTMLTextAreaElement>(null);

  const [errors, setErrors] = useState<EditOrgClientErrors>({});
  const [statusMessage, setStatusMessage] = useState("");
  const [showContactPreview, setShowContactPreview] = useState(false);
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false);

  const [storeFormData, setStoreFormData] = useState(() => ({
    name: initialOrg.name ?? "",
    description: initialOrg.description ?? "",
    publicEmail: initialOrg.publicEmail ?? "",
    publicPhone: initialOrg.publicPhone ?? "",
    websiteUrl: initialOrg.websiteUrl ?? "",
    contactNote: initialOrg.contactNote ?? "",
  }));

  const [phoneDisplay, setPhoneDisplay] = useState(() =>
    formatPhoneDisplayFromDigits(initialOrg.publicPhone ?? ""),
  );

  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(() =>
    initialOrg.logoKey
      ? (s3KeyToPublicUrl(initialOrg.logoKey) as string)
      : null,
  );
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(() =>
    initialOrg.coverKey
      ? (s3KeyToPublicUrl(initialOrg.coverKey) as string)
      : null,
  );

  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeCover, setRemoveCover] = useState(false);

  const handleFormChange = (key: string, value: string) => {
    if (key === "publicPhone") {
      if (value.length > 12) return; // includes dashes
      updatePhoneNumber(value, phoneDisplay, setPhoneDisplay);
      const cleanPhone = value.replace(/[^0-9]/g, "");
      setStoreFormData({ ...storeFormData, publicPhone: cleanPhone });
      return;
    }

    setStoreFormData({ ...storeFormData, [key]: value });
  };

  useGSAP(() => {
    let cleanup: undefined | (() => void);

    const initAnimations = () => {
      if (
        !nameLabelRef.current ||
        !descriptionLabelRef.current ||
        !publicEmailLabelRef.current ||
        !publicPhoneLabelRef.current ||
        !websiteUrlLabelRef.current ||
        !logoLabelRef.current ||
        !coverLabelRef.current ||
        !contactNoteLabelRef.current ||
        !submitButtonRef.current ||
        !nameRef.current ||
        !descriptionRef.current ||
        !publicEmailRef.current ||
        !publicPhoneRef.current ||
        !websiteUrlRef.current ||
        !logoRef.current ||
        !coverRef.current ||
        !contactNoteRef.current
      ) {
        requestAnimationFrame(initAnimations);
        return;
      }

      const triggerEl = document.getElementById("edit-org-form");
      if (!triggerEl) {
        requestAnimationFrame(initAnimations);
        return;
      }

      const nameLabelSplit = new SplitText(nameLabelRef.current, {
        type: "words",
      });
      const descriptionLabelSplit = new SplitText(descriptionLabelRef.current, {
        type: "words",
      });
      const publicEmailLabelSplit = new SplitText(publicEmailLabelRef.current, {
        type: "words",
      });
      const publicPhoneLabelSplit = new SplitText(publicPhoneLabelRef.current, {
        type: "words",
      });
      const websiteUrlLabelSplit = new SplitText(websiteUrlLabelRef.current, {
        type: "words",
      });
      const logoLabelSplit = new SplitText(logoLabelRef.current, {
        type: "words",
      });
      const coverLabelSplit = new SplitText(coverLabelRef.current, {
        type: "words",
      });
      const contactNoteLabelSplit = new SplitText(contactNoteLabelRef.current, {
        type: "words",
      });

      const allLabels = [
        ...nameLabelSplit.words,
        ...descriptionLabelSplit.words,
        ...publicEmailLabelSplit.words,
        ...publicPhoneLabelSplit.words,
        ...websiteUrlLabelSplit.words,
        ...logoLabelSplit.words,
        ...coverLabelSplit.words,
        ...contactNoteLabelSplit.words,
      ];

      const allInputs = [
        nameRef.current,
        descriptionRef.current,
        publicEmailRef.current,
        publicPhoneRef.current,
        websiteUrlRef.current,
        logoRef.current,
        coverRef.current,
        contactNoteRef.current,
        submitButtonRef.current,
      ];

      const allPreviewButtons = [
        descriptionPreviewButtonRef.current,
        contactNotePreviewButtonRef.current,
      ].filter(Boolean) as HTMLElement[];

      gsap.set(allLabels, { opacity: 0, y: 48 });
      gsap.set(allInputs, { opacity: 0, y: 48 });
      if (allPreviewButtons.length > 0) {
        gsap.set(allPreviewButtons, { opacity: 0, y: 48 });
      }

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
        0.05,
      );

      if (allPreviewButtons.length > 0) {
        tl.to(allPreviewButtons, { opacity: 1, y: 0, stagger: 0.02 }, 0.05);
      }

      requestAnimationFrame(() => ScrollTrigger.refresh());

      cleanup = () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        nameLabelSplit.revert();
        descriptionLabelSplit.revert();
        publicEmailLabelSplit.revert();
        publicPhoneLabelSplit.revert();
        websiteUrlLabelSplit.revert();
        logoLabelSplit.revert();
        coverLabelSplit.revert();
        contactNoteLabelSplit.revert();
      };
    };

    initAnimations();
    return () => cleanup?.();
  }, []);

  const submitForm = async (
    _state: ActionState,
    formData: FormData,
  ): Promise<ActionState> => {
    try {
      setErrors({});

      // Ensure phone digits are submitted
      if (storeFormData.publicPhone) {
        const cleanNumber = storeFormData.publicPhone.replace(/[^0-9]/g, "");
        formData.set("publicPhone", cleanNumber);
      }

      const logoFile = logoRef.current?.files?.[0] ?? null;
      const coverFile = coverRef.current?.files?.[0] ?? null;

      await editOrgClientSchema.parseAsync({
        orgId,
        name: storeFormData.name,
        description: storeFormData.description,
        publicEmail: storeFormData.publicEmail,
        publicPhone: storeFormData.publicPhone,
        websiteUrl: storeFormData.websiteUrl,
        contactNote: storeFormData.contactNote,
        logoFile: logoFile ?? undefined,
        coverFile: coverFile ?? undefined,
        removeLogo,
        removeCover,
      });

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

      setStatusMessage("Saving changes…");

      const fd = new FormData();
      fd.set("orgId", orgId);
      fd.set("name", storeFormData.name);
      fd.set("description", storeFormData.description);
      fd.set("publicEmail", storeFormData.publicEmail);
      fd.set("publicPhone", storeFormData.publicPhone); // digits already
      fd.set("websiteUrl", storeFormData.websiteUrl);
      fd.set("contactNote", storeFormData.contactNote);
      fd.set("removeLogo", removeLogo ? "true" : "false");
      fd.set("removeCover", removeCover ? "true" : "false");
      if (logoKey) fd.set("logoKey", logoKey);
      if (coverKey) fd.set("coverKey", coverKey);

      const result = await updateOrganization(initialState, fd);
      if (result.status === "ERROR") {
        if (result.error === "NOT_AUTHORIZED") {
          setStatusMessage("Not authorized to edit this organization.");
          toast.error("ERROR", { description: "Not authorized." });
          return result;
        }
        setStatusMessage("Something went wrong. Please try again.");
        toast.error("ERROR", { description: result.error });
        return result;
      }

      setStatusMessage("Saved.");
      toast.success("SUCCESS", { description: "Organization updated." });
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
        setErrors(formattedErrors as EditOrgClientErrors);
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

  const [, formAction, isPending] = useActionState(submitForm, initialState);

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

  return (
    <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
      <div className="flex flex-col gap-6 md:gap-8">
        <form
          action={formAction}
          className="flex flex-col gap-8 md:gap-10"
          id="edit-org-form"
        >
          <div className="flex flex-col gap-6 md:gap-8">
            <div className="flex flex-col gap-2 overflow-hidden">
              <label
                htmlFor="name"
                ref={nameLabelRef}
                className="text-xs md:text-sm text-white/75 flex items-center gap-1"
              >
                {form.name.label}
                <span className="text-xs text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                ref={nameRef}
                placeholder={form.name.placeholder}
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                required
                value={storeFormData.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
              />
              {errors.name ? (
                <p className="text-red-400 text-xs md:text-sm">{errors.name}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <label
                  htmlFor="description"
                  ref={descriptionLabelRef}
                  className="text-xs md:text-sm text-white/75 flex items-center gap-1"
                >
                  {form.description.label}
                  <span className="text-xs text-red-500">*</span>
                </label>
                <button
                  type="button"
                  ref={descriptionPreviewButtonRef}
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
                      {storeFormData.description || "*Nothing yet…*"}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <textarea
                  id="description"
                  name="description"
                  ref={descriptionRef}
                  placeholder={form.description.placeholder}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors min-h-[160px] resize-none shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  value={storeFormData.description}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                />
              )}

              {errors.description ? (
                <p className="text-red-400 text-xs md:text-sm">
                  {errors.description}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col gap-2 overflow-hidden">
                <label
                  htmlFor="publicEmail"
                  ref={publicEmailLabelRef}
                  className="text-xs md:text-sm text-white/75"
                >
                  {form.publicEmail.label}
                </label>
                <input
                  id="publicEmail"
                  name="publicEmail"
                  ref={publicEmailRef}
                  placeholder={form.publicEmail.placeholder}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  value={storeFormData.publicEmail}
                  onChange={(e) =>
                    handleFormChange("publicEmail", e.target.value)
                  }
                />
                {errors.publicEmail ? (
                  <p className="text-red-400 text-xs md:text-sm">
                    {errors.publicEmail}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 overflow-hidden">
                <label
                  htmlFor="publicPhone"
                  ref={publicPhoneLabelRef}
                  className="text-xs md:text-sm text-white/75"
                >
                  {form.publicPhone.label}
                </label>
                <input
                  id="publicPhone"
                  name="publicPhone"
                  ref={publicPhoneRef}
                  placeholder={form.publicPhone.placeholder}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  value={phoneDisplay}
                  onChange={(e) =>
                    handleFormChange("publicPhone", e.target.value)
                  }
                />
                {errors.publicPhone ? (
                  <p className="text-red-400 text-xs md:text-sm">
                    {errors.publicPhone}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2 overflow-hidden">
              <label
                htmlFor="websiteUrl"
                ref={websiteUrlLabelRef}
                className="text-xs md:text-sm text-white/75"
              >
                {form.websiteUrl.label}
              </label>
              <input
                id="websiteUrl"
                name="websiteUrl"
                ref={websiteUrlRef}
                placeholder={form.websiteUrl.placeholder}
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                value={storeFormData.websiteUrl}
                onChange={(e) => handleFormChange("websiteUrl", e.target.value)}
              />
              {errors.websiteUrl ? (
                <p className="text-red-400 text-xs md:text-sm">
                  {errors.websiteUrl}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col gap-2 overflow-hidden">
                <label
                  htmlFor="logoFile"
                  ref={logoLabelRef}
                  className="text-xs md:text-sm text-white/75"
                >
                  {form.logo.label}
                </label>
                <input
                  id="logoFile"
                  name="logoFile"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  ref={logoRef}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white/80 file:hover:bg-white/15 file:transition-colors"
                  onChange={(e) => onSelectLogo(e.target.files?.[0] ?? null)}
                />

                <div className="flex flex-col gap-2">
                  {logoPreviewUrl ? (
                    <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                      <div className="text-xs text-white/60">Preview</div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoPreviewUrl}
                        alt="Logo preview"
                        className="w-16 h-16 object-contain rounded-xl bg-black/30 border border-white/10"
                      />
                    </div>
                  ) : null}

                  {initialOrg.logoKey ? (
                    <button
                      type="button"
                      onClick={() => {
                        setRemoveLogo(true);
                        if (logoRef.current) logoRef.current.value = "";
                        setLogoPreviewUrl(null);
                      }}
                      className="text-xs text-white/70 hover:text-white underline text-left"
                    >
                      Remove logo
                    </button>
                  ) : null}
                </div>

                {errors.logoFile ? (
                  <p className="text-red-400 text-xs md:text-sm">
                    {errors.logoFile}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 overflow-hidden">
                <label
                  htmlFor="coverFile"
                  ref={coverLabelRef}
                  className="text-xs md:text-sm text-white/75"
                >
                  {form.cover.label}
                </label>
                <input
                  id="coverFile"
                  name="coverFile"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  ref={coverRef}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white/80 file:hover:bg-white/15 file:transition-colors"
                  onChange={(e) => onSelectCover(e.target.files?.[0] ?? null)}
                />

                <div className="flex flex-col gap-2">
                  {coverPreviewUrl ? (
                    <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                      <div className="text-xs text-white/60">Preview</div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverPreviewUrl}
                        alt="Cover preview"
                        className="w-full h-28 object-cover rounded-xl border border-white/10"
                      />
                    </div>
                  ) : null}

                  {initialOrg.coverKey ? (
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

                {errors.coverFile ? (
                  <p className="text-red-400 text-xs md:text-sm">
                    {errors.coverFile}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2 overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <label
                  htmlFor="contactNote"
                  ref={contactNoteLabelRef}
                  className="text-xs md:text-sm text-white/75"
                >
                  {form.contactNote.label}
                </label>
                <button
                  type="button"
                  ref={contactNotePreviewButtonRef}
                  onClick={() => setShowContactPreview((p) => !p)}
                  className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-xs md:text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                >
                  {showContactPreview ? "Edit" : "Preview"}
                </button>
              </div>

              {showContactPreview ? (
                <div className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div className="prose prose-invert max-w-none prose-p:text-white/75 prose-a:text-accent-400 prose-strong:text-white">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSanitize]}
                    >
                      {storeFormData.contactNote || "*Nothing yet…*"}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <textarea
                  id="contactNote"
                  name="contactNote"
                  ref={contactNoteRef}
                  placeholder={form.contactNote.placeholder}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors min-h-[160px] resize-none shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  value={storeFormData.contactNote}
                  onChange={(e) =>
                    handleFormChange("contactNote", e.target.value)
                  }
                />
              )}

              {errors.contactNote ? (
                <p className="text-red-400 text-xs md:text-sm">
                  {errors.contactNote}
                </p>
              ) : null}
            </div>

            <div className="flex w-full justify-center overflow-hidden">
              <button
                type="submit"
                ref={submitButtonRef}
                className="w-full max-w-sm px-5 py-3 rounded-2xl cursor-pointer bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 disabled:opacity-60"
                disabled={isPending}
              >
                {isPending ? "Saving..." : submitLabel}
              </button>
            </div>
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

export default EditOrgForm;
