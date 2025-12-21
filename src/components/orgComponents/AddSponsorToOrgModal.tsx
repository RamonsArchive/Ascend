"use client";

import React, {
  useMemo,
  useRef,
  useState,
  useActionState,
  useEffect,
} from "react";
import { toast } from "sonner";
import { z } from "zod";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
import Image from "next/image";

import type { ActionState } from "@/src/lib/global_types";
import {
  parseServerActionResponse,
  TEN_MB,
  validateImageFile,
} from "@/src/lib/utils";
import { createOrgImageUpload } from "@/src/actions/s3_actions";
import { uploadToS3PresignedPost } from "@/src/lib/s3-client";
import { addExistingSponsorToOrg } from "@/src/actions/org_sponsor_actions";
import { addExistingSponsorToOrgClientSchema } from "@/src/lib/validation";
import type { SponsorLibraryItem } from "@/src/components/orgComponents/SponsorLibraryCard";
import type { SponsorTier } from "@/src/lib/global_types";

const initialState: ActionState = {
  status: "INITIAL",
  error: "",
  data: null,
};

const AddSponsorToOrgModal = ({
  orgId,
  sponsorLibrary,
  isOpen,
  onClose,
  defaultSponsorId,
}: {
  orgId: string;
  sponsorLibrary: SponsorLibraryItem[];
  isOpen: boolean;
  onClose: () => void;
  defaultSponsorId?: string | null;
}) => {
  const router = useRouter();
  const allowedImageMimeTypes = useMemo(
    () => new Set(["image/png", "image/jpeg", "image/webp"]),
    []
  );

  const logoRef = useRef<HTMLInputElement>(null);

  const [statusMessage, setStatusMessage] = useState("");
  const [errors, setErrors] = useState<
    Partial<
      Record<
        | "sponsorId"
        | "tier"
        | "isActive"
        | "order"
        | "displayName"
        | "blurb"
        | "logoFile",
        string
      >
    >
  >({});

  const [search, setSearch] = useState("");
  const [selectedSponsorId, setSelectedSponsorId] = useState<string>(
    defaultSponsorId ?? ""
  );
  const [showBlurbPreview, setShowBlurbPreview] = useState(false);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState(() => ({
    tier: "COMMUNITY" as SponsorTier,
    isActive: true,
    order: 0,
    displayName: "",
    blurb: "",
  }));

  const [orderInput, setOrderInput] = useState<string>("0");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isOpen]);

  const filteredSponsors = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sponsorLibrary;
    return sponsorLibrary.filter((s) => {
      const name = s.name.toLowerCase();
      const website = (s.websiteKey ?? "").toLowerCase();
      return name.includes(q) || website.includes(q);
    });
  }, [search, sponsorLibrary]);

  const selectedSponsor = useMemo(() => {
    return sponsorLibrary.find((s) => s.id === selectedSponsorId) ?? null;
  }, [sponsorLibrary, selectedSponsorId]);

  const close = () => {
    setErrors({});
    setStatusMessage("");
    setSearch("");
    setSelectedSponsorId("");
    setShowBlurbPreview(false);
    setLogoPreviewUrl(null);
    setFormData({
      tier: "COMMUNITY",
      isActive: true,
      order: 0,
      displayName: "",
      blurb: "",
    });
    setOrderInput("0");
    if (logoRef.current) logoRef.current.value = "";
    onClose();
  };

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

  const submitAttach = async (
    _state: ActionState,
    _fd: FormData
  ): Promise<ActionState> => {
    try {
      void _state;
      void _fd;
      setErrors({});

      const logoFile = logoRef.current?.files?.[0] ?? null;
      const orderValue = Math.max(0, Number(orderInput) || 0);

      await addExistingSponsorToOrgClientSchema.parseAsync({
        orgId,
        sponsorId: selectedSponsorId,
        tier: formData.tier,
        isActive: formData.isActive,
        order: orderValue,
        displayName: formData.displayName,
        blurb: formData.blurb,
        logoFile: logoFile ?? undefined,
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

      setStatusMessage("Adding sponsor…");

      const fd = new FormData();
      fd.set("orgId", orgId);
      fd.set("sponsorId", selectedSponsorId);
      fd.set("tier", formData.tier);
      fd.set("isActive", formData.isActive ? "true" : "false");
      fd.set("order", String(orderValue));
      fd.set("displayName", formData.displayName ?? "");
      fd.set("blurb", formData.blurb ?? "");
      if (logoKey) fd.set("logoKey", logoKey);

      const result = await addExistingSponsorToOrg(initialState, fd);
      if (result.status === "ERROR") {
        setStatusMessage(result.error || "Failed to add sponsor.");
        toast.error("ERROR", { description: result.error });
        return result;
      }

      setStatusMessage("Added.");
      toast.success("SUCCESS", {
        description: "Sponsor added to organization.",
      });
      router.refresh();
      close();
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

  const [, formAction, isPending] = useActionState(submitAttach, initialState);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5 sm:px-10">
      <div
        className="absolute inset-0 bg-primary-950/80 backdrop-blur-sm"
        onClick={close}
      />

      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-white/5">
        <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
          <div className="flex flex-col gap-6 md:gap-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="text-white text-xl md:text-2xl font-semibold">
                  Add sponsor to organization
                </div>
                <div className="text-white/70 text-sm md:text-base leading-relaxed">
                  Select a sponsor from your library (private) or the public
                  sponsor directory, then configure placement for this org.
                </div>
              </div>

              <button
                type="button"
                onClick={close}
                className="w-full md:w-auto px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-xs md:text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              >
                Close
              </button>
            </div>

            <div className="flex flex-col gap-4 md:gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs md:text-sm text-white/75">
                  Search sponsors
                </label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or website…"
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                />
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-xs md:text-sm text-white/75">
                  Select sponsor
                </label>

                <div className="flex flex-col gap-2 max-h-[220px] overflow-auto rounded-2xl border border-white/10 bg-white/5">
                  {filteredSponsors.length === 0 ? (
                    <div className="px-4 py-3 text-white/70 text-sm">
                      No sponsors match your search.
                    </div>
                  ) : (
                    filteredSponsors.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSponsorId(s.id)}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          selectedSponsorId === s.id
                            ? "bg-white/10"
                            : "hover:bg-white/10"
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="text-white font-semibold text-sm">
                            {s.name}
                          </div>
                          <div className="flex flex-col xs:flex-row xs:items-center gap-2">
                            <div className="text-white/50 text-xs">
                              @{s.slug}
                            </div>
                            <div className="text-white/70 text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 w-fit">
                              {s.visibility}
                            </div>
                            {s.websiteKey ? (
                              <div className="text-white/60 text-xs break-all">
                                {s.websiteKey}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {errors.sponsorId ? (
                  <p className="text-red-500 text-xs md:text-sm">
                    {errors.sponsorId}
                  </p>
                ) : null}
              </div>
            </div>

            {selectedSponsor ? (
              <form
                action={formAction}
                className="flex flex-col gap-6 md:gap-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs md:text-sm text-white/75">
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
                      <p className="text-red-500 text-xs md:text-sm">
                        {errors.tier}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs md:text-sm text-white/75">
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
                    <label className="text-xs md:text-sm text-white/75">
                      Display name (optional)
                    </label>
                    <input
                      value={formData.displayName}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          displayName: e.target.value,
                        }))
                      }
                      placeholder={selectedSponsor.name}
                      className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    />
                    {errors.displayName ? (
                      <p className="text-red-500 text-xs md:text-sm">
                        {errors.displayName}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs md:text-sm text-white/75">
                      Order
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={orderInput}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) =>
                        setOrderInput(
                          e.target.value
                            .replace(/[^\d]/g, "")
                            .replace(/^0+(?=\d)/, "")
                        )
                      }
                      onBlur={() => {
                        const normalized = orderInput === "" ? "0" : orderInput;
                        setOrderInput(normalized);
                      }}
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
                  <label className="text-xs md:text-sm text-white/75">
                    Blurb (Markdown, optional)
                  </label>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="text-xs text-white/60">
                      Markdown supported
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBlurbPreview((p) => !p)}
                      className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-xs md:text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    >
                      {showBlurbPreview ? "Edit" : "Preview"}
                    </button>
                  </div>

                  {showBlurbPreview ? (
                    <div className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
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
                      placeholder="Optional org-specific sponsor blurb…"
                      className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors min-h-[140px] resize-none shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    />
                  )}
                  {errors.blurb ? (
                    <p className="text-red-500 text-xs md:text-sm">
                      {errors.blurb}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs md:text-sm text-white/75">
                    Org logo override (optional)
                  </label>
                  <input
                    ref={logoRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => onSelectLogo(e.target.files?.[0] ?? null)}
                    className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white/80 file:hover:bg-white/15 file:transition-colors"
                  />
                  {logoPreviewUrl ? (
                    <div className="flex flex-col gap-2">
                      <div className="relative w-full max-w-xs h-28 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                        <Image
                          src={logoPreviewUrl}
                          alt="Org logo override preview"
                          fill
                          sizes="320px"
                          className="object-contain p-3"
                        />
                      </div>
                    </div>
                  ) : null}
                  {errors.logoFile ? (
                    <p className="text-red-500 text-xs md:text-sm">
                      {errors.logoFile}
                    </p>
                  ) : null}
                </div>

                <div className="flex w-full justify-center">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full max-w-sm px-5 py-3 rounded-2xl cursor-pointer bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {isPending ? "Adding..." : "Add sponsor"}
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
            ) : (
              <div className="text-white/70 text-sm">
                Select a sponsor above to continue.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSponsorToOrgModal;
