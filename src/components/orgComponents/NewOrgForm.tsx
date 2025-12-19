"use client";

import React, { useMemo, useState, useActionState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

import { createOrganization } from "@/src/actions/org_actions";
import { new_org_data } from "@/src/constants/orgConstants/org_index";
import type { ActionState, NewOrgFormDataType } from "@/src/lib/global_types";
import { isAllowedImageFile } from "@/src/lib/utils";

const initialState: ActionState = {
  status: "INITIAL",
  error: "",
  data: null,
};

const inputBase =
  "w-full rounded-md bg-primary-950/70 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-accent-500/60 transition-colors";

const labelBase = "text-white/80 text-sm font-medium";

const NewOrgForm = ({ submitLabel }: { submitLabel: string }) => {
  const { form } = new_org_data;

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

  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);

  const logoPreviewUrl = useMemo(
    () => (local.logoFile ? URL.createObjectURL(local.logoFile) : null),
    [local.logoFile]
  );
  const coverPreviewUrl = useMemo(
    () => (local.coverFile ? URL.createObjectURL(local.coverFile) : null),
    [local.coverFile]
  );

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    createOrganization,
    initialState
  );

  const onSelectLogo = (file: File | null) => {
    if (!file) {
      setLocal((p) => ({ ...p, logoFile: null }));
      return;
    }
    if (!isAllowedImageFile(file)) {
      toast.error("Logo must be a PNG, JPG, or WEBP.");
      return;
    }
    setLocal((p) => ({ ...p, logoFile: file }));
  };

  const onSelectCover = (file: File | null) => {
    if (!file) {
      setLocal((p) => ({ ...p, coverFile: null }));
      return;
    }
    if (!isAllowedImageFile(file)) {
      toast.error("Cover must be a PNG, JPG, or WEBP.");
      return;
    }
    setLocal((p) => ({ ...p, coverFile: file }));
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

        <form
          action={formAction}
          encType="multipart/form-data"
          className="flex flex-col gap-6 rounded-xl border border-white/10 bg-primary-950/60 p-5 md:p-6"
        >
          <div className="flex flex-col gap-2">
            <label className={labelBase} htmlFor="name">
              {form.name.label}
            </label>
            <input
              id="name"
              name="name"
              value={local.name}
              onChange={(e) =>
                setLocal((p) => ({ ...p, name: e.target.value }))
              }
              placeholder={form.name.placeholder}
              className={inputBase}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelBase} htmlFor="description">
              {form.description.label}
            </label>
            <textarea
              id="description"
              name="description"
              value={local.description}
              onChange={(e) =>
                setLocal((p) => ({ ...p, description: e.target.value }))
              }
              placeholder={form.description.placeholder}
              className={`${inputBase} min-h-[120px] resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className={labelBase} htmlFor="publicEmail">
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
                className={inputBase}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelBase} htmlFor="publicPhone">
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
                className={inputBase}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelBase} htmlFor="websiteUrl">
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
              className={inputBase}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className={labelBase} htmlFor="logoFile">
                {form.logo.label}
              </label>
              <input
                id="logoFile"
                name="logoFile"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className={inputBase}
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
              <label className={labelBase} htmlFor="coverFile">
                {form.cover.label}
              </label>
              <input
                id="coverFile"
                name="coverFile"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className={inputBase}
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
              <label className={labelBase} htmlFor="contactNote">
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
                className={`${inputBase} min-h-[120px] resize-none`}
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
        </form>
      </div>
    </section>
  );
};

export default NewOrgForm;
