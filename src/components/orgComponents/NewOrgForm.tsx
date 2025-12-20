"use client";

import React, { useMemo, useState, useActionState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import Form from "next/form";

import { createOrganization } from "@/src/actions/org_actions";
import { new_org_data } from "@/src/constants/orgConstants/org_index";
import type { ActionState, NewOrgFormDataType } from "@/src/lib/global_types";
import {
  validateImageFile,
  parseServerActionResponse,
  formDataToObject,
} from "@/src/lib/utils";
import { newOrgFormSchema } from "@/src/lib/validation";

const initialState: ActionState = {
  status: "INITIAL",
  error: "",
  data: null,
};

const NewOrgForm = ({ submitLabel }: { submitLabel: string }) => {
  const { form } = new_org_data;
  const allowedImageMimeTypes = new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
  ]);

  const [local, setLocal] = useState<NewOrgFormDataType>({
    name: "",
    description: "",
    publicEmail: "",
    publicPhone: "",
    websiteUrl: "",
    logoFile: null,
    coverFile: null,
    contactNote: "",
  });

  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    publicEmail?: string;
    publicPhone?: string;
    websiteUrl?: string;
    logoFile?: string;
    coverFile?: string;
    contactNote?: string;
  }>({});

  const [statusMessage, setStatusMessage] = useState<string>("");

  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false);

  const logoPreviewUrl = useMemo(
    () => (local.logoFile ? URL.createObjectURL(local.logoFile) : null),
    [local.logoFile]
  );
  const coverPreviewUrl = useMemo(
    () => (local.coverFile ? URL.createObjectURL(local.coverFile) : null),
    [local.coverFile]
  );
  const TEN_MB = 10 * 1024 * 1024;

  const onSelectLogo = (file: File | null) => {
    if (!file) {
      setLocal((p) => ({ ...p, logoFile: null }));
      return;
    }
    if (
      !validateImageFile({
        file,
        options: {
          allowedMimeTypes: allowedImageMimeTypes,
          maxBytes: TEN_MB,
        },
      })
    ) {
      toast.error("ERROR", {
        description: "Logo must be a PNG, JPG, or WEBP. Max size is 10MB.",
      });
      return;
    }
    setLocal((p) => ({ ...p, logoFile: file }));
  };

  const onSelectCover = (file: File | null) => {
    if (!file) {
      setLocal((p) => ({ ...p, coverFile: null }));
      return;
    }
    if (
      !validateImageFile({
        file,
        options: {
          allowedMimeTypes: allowedImageMimeTypes,
          maxBytes: TEN_MB,
        },
      })
    ) {
      toast.error("ERROR", {
        description: "Cover must be a PNG, JPG, or WEBP. Max size is 10MB.",
      });
      return;
    }
    setLocal((p) => ({ ...p, coverFile: file }));
  };

  const resetForm = () => {
    setLocal({
      name: "",
      description: "",
      publicEmail: "",
      publicPhone: "",
      websiteUrl: "",
      logoFile: null,
      coverFile: null,
      contactNote: "",
    });
    setErrors({});
    setStatusMessage("");
    setShowMarkdownPreview(false);
    setShowDescriptionPreview(false);
  };

  const submitForm = async (
    state: ActionState,
    formData: FormData
  ): Promise<ActionState> => {
    try {
      setErrors({});
      const formObject = formDataToObject(formData);
      await newOrgFormSchema.parseAsync(formObject);
      const result = await createOrganization(formObject);
      if (result.status === "ERROR") {
        setStatusMessage("Something went wrong. Please try again.");
        toast.error("ERROR", {
          description: "Something went wrong. Please try again.",
        });
        return parseServerActionResponse({
          status: "ERROR",
          error: "Something went wrong. Please try again.",
          data: null,
        });
      }

      resetForm();
      setStatusMessage("Organization created successfully.");
      toast.success("SUCCESS", {
        description: "Organization created successfully.",
      });
      return parseServerActionResponse({
        status: "SUCCESS",
        error: "",
        data: result.data,
      });
    } catch (error) {
      console.error(error);
      setStatusMessage(
        "An error occurred while submitting the form. Please try again."
      );
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
          description: Object.values(formattedErrors).join(", "),
        });
        return parseServerActionResponse({
          status: "ERROR",
          error: Object.values(formattedErrors).join(", "),
          data: null,
        });
      }
      toast.error("ERROR", {
        description:
          "An error occurred while submitting the form. Please try again.",
      });

      return parseServerActionResponse({
        status: "ERROR",
        error: "An error occurred while submitting the form",
        data: null,
      });
    }
  };

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    submitForm,
    initialState
  );

  const handleFormChange = (key: string, value: string) => {
    if (key === "phone") {
      updatePhoneNumber(value, phoneDisplay, setPhoneDisplay);
      const cleanPhone = value.replace(/[^0-9]/g, "");
      setStoreFormData({ ...storeFormData, phone: cleanPhone });
      return;
    }

    setStoreFormData({ ...storeFormData, [key]: value });
  };

  return (
    <section className="flex flex-col items-center justify-center w-full pb-12 md:pb-16 lg:pb-20">
      <div className="flex flex-col w-full max-w-5xl px-5 sm:px-10 md:px-18 gap-6 md:gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Organization details
          </h2>
          <div className="text-white/60 text-sm leading-relaxed">
            These fields control how your organization appears on public pages.
          </div>
        </div>

        <Form
          action={formAction}
          className="flex flex-col gap-6 rounded-xl border border-white/10 bg-primary-950/60 p-5 md:p-6"
          id="new-org-form"
        >
          <div className="flex flex-col gap-2">
            <label
              className="label-base flex items-center gap-1"
              htmlFor="name"
            >
              {form.name.label}
              <span className="text-xs text-red-500">*</span>
            </label>

            <input
              id="name"
              name="name"
              value={local.name}
              onChange={(e) =>
                setLocal((p) => ({ ...p, name: e.target.value }))
              }
              placeholder={form.name.placeholder}
              className="input-base"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <label
                  className="label-base flex items-center gap-1"
                  htmlFor="description"
                >
                  {form.description.label}
                  <span className="text-xs text-red-500">*</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowDescriptionPreview((p) => !p)}
                  className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-sm"
                >
                  {showDescriptionPreview ? "Edit" : "Preview"}
                </button>
              </div>

              {showDescriptionPreview ? (
                <div className="rounded-md border border-white/10 bg-primary-950/70 p-4">
                  <div className="prose prose-invert max-w-none prose-p:text-white/75 prose-a:text-accent-400 prose-strong:text-white">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSanitize]}
                    >
                      {local.description || "*Nothing yet…*"}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <textarea
                  id="description"
                  name="description"
                  value={local.description}
                  onChange={(e) =>
                    setLocal((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder={form.description.placeholder}
                  className="input-base min-h-[120px] resize-none"
                  required
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="label-base" htmlFor="publicEmail">
                Public email
              </label>
              <input
                id="publicEmail"
                name="publicEmail"
                value={local.publicEmail}
                onChange={(e) =>
                  setLocal((p) => ({ ...p, publicEmail: e.target.value }))
                }
                placeholder="hello@org.com"
                className="input-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="label-base" htmlFor="publicPhone">
                Public phone
              </label>
              <input
                id="publicPhone"
                name="publicPhone"
                value={local.publicPhone}
                onChange={(e) =>
                  setLocal((p) => ({ ...p, publicPhone: e.target.value }))
                }
                placeholder="+1 555 123 4567"
                className="input-base"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="label-base" htmlFor="websiteUrl">
              Website URL
            </label>
            <input
              id="websiteUrl"
              name="websiteUrl"
              value={local.websiteUrl}
              onChange={(e) =>
                setLocal((p) => ({ ...p, websiteUrl: e.target.value }))
              }
              placeholder="https://yourorg.com"
              className="input-base"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="label-base" htmlFor="logoFile">
                {form.logo.label}
              </label>
              <input
                id="logoFile"
                name="logoFile"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="input-base"
                onChange={(e) => onSelectLogo(e.target.files?.[0] ?? null)}
              />
              {logoPreviewUrl ? (
                <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-white/60">Preview</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoPreviewUrl}
                    alt="Logo preview"
                    className="w-16 h-16 object-contain rounded-md bg-black/30 border border-white/10"
                  />
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label className="label-base" htmlFor="coverFile">
                {form.cover.label}
              </label>
              <input
                id="coverFile"
                name="coverFile"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="input-base"
                onChange={(e) => onSelectCover(e.target.files?.[0] ?? null)}
              />
              {coverPreviewUrl ? (
                <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-white/60">Preview</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverPreviewUrl}
                    alt="Cover preview"
                    className="w-full h-28 object-cover rounded-md border border-white/10"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <label className="label-base" htmlFor="contactNote">
                Contact note (Markdown)
              </label>
              <button
                type="button"
                onClick={() => setShowMarkdownPreview((p) => !p)}
                className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-sm"
              >
                {showMarkdownPreview ? "Edit" : "Preview"}
              </button>
            </div>

            {showMarkdownPreview ? (
              <div className="rounded-md border border-white/10 bg-primary-950/70 p-4">
                <div className="prose prose-invert max-w-none prose-p:text-white/75 prose-a:text-accent-400 prose-strong:text-white">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize]}
                  >
                    {local.contactNote || "*Nothing yet…*"}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <textarea
                id="contactNote"
                name="contactNote"
                value={local.contactNote}
                onChange={(e) =>
                  setLocal((p) => ({ ...p, contactNote: e.target.value }))
                }
                placeholder="Example: **Sponsorships** — email [partners@org.com](mailto:partners@org.com)"
                className="input-base min-h-[120px] resize-none"
              />
            )}
          </div>

          <div className="flex flex-col gap-3">
            {state?.status === "ERROR" && state.error ? (
              <div className="rounded-md border border-warning-500/30 bg-warning-500/10 p-3 text-warning-100 text-sm">
                {state.error}
              </div>
            ) : null}

            {state?.status === "SUCCESS" ? (
              <div className="rounded-md border border-accent-500/30 bg-accent-500/10 p-3 text-white/90 text-sm">
                Organization created (placeholder). You can wire DB write + file
                upload next.
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isPending}
              className="w-full inline-flex items-center justify-center px-4 py-3 rounded-md bg-accent-500 text-primary-950 font-semibold hover:bg-accent-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? "Creating…" : submitLabel}
            </button>
          </div>
        </Form>
      </div>
    </section>
  );
};

export default NewOrgForm;
