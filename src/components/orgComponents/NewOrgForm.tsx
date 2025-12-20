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

import { createOrganization } from "@/src/actions/org_actions";
import { new_org_data } from "@/src/constants/orgConstants/org_index";
import type { ActionState } from "@/src/lib/global_types";
import {
  parseServerActionResponse,
  TEN_MB,
  updatePhoneNumber,
  validateImageFile,
} from "@/src/lib/utils";
import { newOrgFormSchema } from "@/src/lib/validation";

gsap.registerPlugin(ScrollTrigger, SplitText);

const initialState: ActionState = {
  status: "INITIAL",
  error: "",
  data: null,
};

type NewOrgClientErrors = Partial<
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

function fileFromFormDataEntry(entry: FormDataEntryValue | null) {
  if (!entry) return undefined;
  if (entry instanceof File && entry.size > 0) return entry;
  return undefined;
}

function payloadFromFormData(formData: FormData) {
  const rawLogo = formData.get("logoFile");
  const rawCover = formData.get("coverFile");

  return {
    name: (formData.get("name")?.toString() ?? "").trim(),
    description: (formData.get("description")?.toString() ?? "").trim(),
    publicEmail: (formData.get("publicEmail")?.toString() ?? "").trim(),
    publicPhone: (formData.get("publicPhone")?.toString() ?? "").trim(),
    websiteUrl: (formData.get("websiteUrl")?.toString() ?? "").trim(),
    contactNote: (formData.get("contactNote")?.toString() ?? "").trim(),
    logoFile: fileFromFormDataEntry(rawLogo),
    coverFile: fileFromFormDataEntry(rawCover),
  };
}

const NewOrgForm = ({ submitLabel }: { submitLabel: string }) => {
  const { form } = new_org_data;
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

  const [errors, setErrors] = useState<NewOrgClientErrors>({});
  const [statusMessage, setStatusMessage] = useState("");
  const [showContactPreview, setShowContactPreview] = useState(false);
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false);
  const [storeFormData, setStoreFormData] = useState({
    name: "",
    description: "",
    publicEmail: "",
    publicPhone: "",
    websiteUrl: "",
    contactNote: "",
  });
  const [phoneDisplay, setPhoneDisplay] = useState("");

  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  const handleFormChange = (key: string, value: string) => {
    if (key === "publicPhone") {
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

      const triggerEl = document.getElementById("new-org-form");
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

  const resetForm = () => {
    setErrors({});
    setStatusMessage("");
    setShowContactPreview(false);
    setShowDescriptionPreview(false);
    setStoreFormData({
      name: "",
      description: "",
      publicEmail: "",
      publicPhone: "",
      websiteUrl: "",
      contactNote: "",
    });
    setPhoneDisplay("");

    if (nameRef.current) nameRef.current.value = "";
    if (descriptionRef.current) descriptionRef.current.value = "";
    if (publicEmailRef.current) publicEmailRef.current.value = "";
    if (publicPhoneRef.current) publicPhoneRef.current.value = "";
    if (websiteUrlRef.current) websiteUrlRef.current.value = "";
    if (contactNoteRef.current) contactNoteRef.current.value = "";
    if (logoRef.current) logoRef.current.value = "";
    if (coverRef.current) coverRef.current.value = "";

    setLogoPreviewUrl(null);
    setCoverPreviewUrl(null);
  };

  const submitForm = async (
    _state: ActionState,
    formData: FormData,
  ): Promise<ActionState> => {
    try {
      setErrors({});

      const payload = payloadFromFormData(formData);
      await newOrgFormSchema.parseAsync(payload);

      // check if logged in

      const result = await createOrganization(initialState, formData);
      if (result.status === "ERROR") {
        if (
          result.error.includes("MUST BE LOGGED IN TO CREATE AN ORGANIZATION")
        ) {
          setStatusMessage("You must be logged in to create an organization.");
          toast.error("ERROR", {
            description: "You must be logged in to create an organization.",
          });
          return result;
        }
        setStatusMessage("Something went wrong. Please try again.");
        toast.error("ERROR", {
          description:
            result.error || "Something went wrong. Please try again.",
        });
        return result;
      }

      resetForm();
      setStatusMessage("Organization created successfully.");
      toast.success("SUCCESS", {
        description: "Organization created successfully.",
      });

      return result;
    } catch (error) {
      console.error(error);
      setStatusMessage(
        "An error occurred while submitting the form. Please try again.",
      );

      if (error instanceof z.ZodError) {
        const fieldErrors = z.flattenError(error).fieldErrors as Record<
          string,
          string[]
        >;
        const formatted: Record<string, string> = {};
        Object.keys(fieldErrors).forEach((key) => {
          formatted[key] = fieldErrors[key]?.[0] || "";
        });
        setErrors(formatted as NewOrgClientErrors);
        toast.error("ERROR", {
          description: Object.values(formatted).filter(Boolean).join(", "),
        });
        return {
          status: "ERROR",
          error: Object.values(formatted).filter(Boolean).join(", "),
          data: null,
        };
      }

      toast.error("ERROR", {
        description:
          "An error occurred while submitting the form. Please try again.",
      });
      return {
        status: "ERROR",
        error: "An error occurred while submitting the form",
        data: null,
      };
    }
  };

  const [, formAction, isPending] = useActionState(submitForm, initialState);

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
        description: "Logo must be a PNG, JPG, or WEBP. Max size is 10MB.",
      });
      if (logoRef.current) logoRef.current.value = "";
      setLogoPreviewUrl(null);
      return;
    }
    setLogoPreviewUrl(URL.createObjectURL(file));
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

  return (
    <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
      <div className="flex flex-col gap-6 md:gap-8">
        <form
          action={formAction}
          className="flex flex-col gap-8 md:gap-10"
          id="new-org-form"
          encType="multipart/form-data"
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
                  className="text-xs md:text-sm text-white/75"
                >
                  {form.description.label}
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
                  Public email
                </label>
                <input
                  id="publicEmail"
                  name="publicEmail"
                  ref={publicEmailRef}
                  placeholder="hello@org.com"
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
                  Public phone
                </label>
                <input
                  id="publicPhone"
                  name="publicPhone"
                  ref={publicPhoneRef}
                  placeholder="5551234567"
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
                Website URL
              </label>
              <input
                id="websiteUrl"
                name="websiteUrl"
                ref={websiteUrlRef}
                placeholder="https://yourorg.com"
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
                  Contact note (Markdown)
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
                  placeholder="Example: **Sponsorships** — email [partners@org.com](mailto:partners@org.com)"
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
                {isPending ? "Creating..." : submitLabel}
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

export default NewOrgForm;
