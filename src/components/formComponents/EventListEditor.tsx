"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/src/lib/global_types";
import { makeClientId } from "@/src/lib/utils";
import { commonListEditorSchema } from "@/src/lib/validation";

type DetailsKey = "blurb" | "description";

type BaseDraft = {
  clientId: string;
  name: string;
  order?: string | number;
  blurb?: string;
  description?: string;
};

type CommonErrors = Partial<Record<"items", string>>;

const toKey = (s: string) => (s ?? "").trim().toLowerCase();

const asString = (v: unknown) =>
  v === null || v === undefined ? "" : String(v);

export function EventListEditor<T extends BaseDraft>({
  title,
  subtitle,
  emptyText,
  addLabel,
  defaults,
  detailsLabel,
  detailsKey = "blurb",
  renderRowExtras,
  onNormalize,
  onSave,
}: {
  title: string;
  subtitle?: string;
  emptyText: string;
  addLabel: string;
  defaults: T[];

  // NEW: choose which field your textarea edits
  detailsKey?: DetailsKey;
  detailsLabel?: string;

  renderRowExtras?: (args: {
    item: T;
    setItem: (updater: (prev: T) => T) => void;
  }) => React.ReactNode;

  onNormalize: (items: T[]) => unknown;
  onSave: (payload: unknown) => Promise<ActionState>;
}) {
  const [items, setItems] = useState<T[]>(() =>
    (defaults ?? []).map((d) => ({
      ...d,
      clientId: d.clientId || makeClientId(),
      order: asString(d.order),
      blurb: d.blurb ?? "",
      description: d.description ?? "",
    })),
  );

  const [errors, setErrors] = useState<CommonErrors>({});
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const addItem = () => {
    setItems((p) => [
      ...p,
      {
        clientId: makeClientId(),
        name: "",
        order: "",
        blurb: "",
        description: "",
      } as T,
    ]);
  };

  const resetToDefaults = () => {
    setItems(
      (defaults ?? []).map((d) => ({
        ...d,
        clientId: d.clientId || makeClientId(),
        order: asString(d.order),
        blurb: d.blurb ?? "",
        description: d.description ?? "",
      })),
    );
    setErrors({});
    setStatusMessage("");
    toast.message("Reset", { description: "Reverted to saved values." });
  };

  const validateClient = (drafts: T[]) => {
    // validate base fields: name + details + order
    const parsed = commonListEditorSchema.safeParse({
      items: drafts.map((x) => ({
        name: x.name,
        blurb: asString(x[detailsKey] ?? ""),
        order: asString(x.order ?? ""),
      })),
    });
    if (!parsed.success) {
      const msg =
        parsed.error.issues[0]?.message || "Please fix the highlighted fields.";
      setErrors({ items: msg });
      return false;
    }

    // unique name (case-insensitive)
    const keys = drafts.map((x) => toKey(x.name)).filter(Boolean);
    const dup = keys.find((k, idx) => keys.indexOf(k) !== idx);
    if (dup) {
      setErrors({ items: "Names must be unique (duplicates found)." });
      return false;
    }

    return true;
  };

  const save = async () => {
    try {
      setErrors({});
      setStatusMessage("");
      setIsSaving(true);

      if (!validateClient(items)) {
        setStatusMessage("Please fix the highlighted fields.");
        setIsSaving(false);
        return;
      }

      const payload = onNormalize(items);
      setStatusMessage("Saving…");

      const res = await onSave(payload);

      if (res.status === "ERROR") {
        setStatusMessage(res.error || "Failed to save.");
        toast.error("ERROR", { description: res.error || "Failed to save." });
        setIsSaving(false);
        return;
      }

      setStatusMessage("Saved.");
      toast.success("SUCCESS", { description: "Updated." });
      setIsSaving(false);
    } catch (e) {
      console.error(e);
      setStatusMessage("An error occurred while saving.");
      toast.error("ERROR", { description: "An error occurred while saving." });
      setIsSaving(false);
    }
  };

  // no useMemo: compute preview directly
  const sortedPreview = [...items].sort((a, b) => {
    const ao = Number(asString(a.order).replace(/[^\d]/g, "") || 0);
    const bo = Number(asString(b.order).replace(/[^\d]/g, "") || 0);
    return ao - bo;
  });

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl md:text-3xl font-semibold text-white">
          {title}
        </h2>
        {subtitle ? (
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            {subtitle}
          </div>
        ) : null}
      </div>

      <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
        <div className="flex flex-col gap-6 md:gap-8">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={addItem}
              className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-xs md:text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            >
              {addLabel}
            </button>

            <button
              type="button"
              onClick={resetToDefaults}
              className="text-xs text-white/70 hover:text-white underline"
            >
              Reset to saved
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-white/60 text-sm rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
              {emptyText}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((item, idx) => {
                const setItem = (updater: (prev: T) => T) => {
                  setItems((p) =>
                    p.map((x) =>
                      x.clientId === item.clientId ? updater(x) : x,
                    ),
                  );
                };

                const detailsText = asString(item[detailsKey] ?? "");

                return (
                  <div
                    key={item.clientId}
                    className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-white/80 text-xs md:text-sm">
                        Item {idx + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setItems((p) =>
                            p.filter((x) => x.clientId !== item.clientId),
                          )
                        }
                        className="text-xs text-white/70 hover:text-white underline"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-3">
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-xs md:text-sm text-white/75">
                          Name <span className="text-xs text-red-500">*</span>
                        </label>
                        <input
                          value={item.name}
                          onChange={(e) =>
                            setItem((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs md:text-sm text-white/75">
                          Order
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={asString(item.order)}
                          onChange={(e) =>
                            setItem((prev) => ({
                              ...prev,
                              order: e.target.value.replace(/[^\d]/g, ""),
                            }))
                          }
                          placeholder={`${idx}`}
                          className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-3">
                      <label className="text-xs md:text-sm text-white/75">
                        {detailsLabel ?? "Blurb (optional)"}
                      </label>
                      <textarea
                        value={detailsText}
                        onChange={(e) =>
                          setItem((prev) => ({
                            ...prev,
                            [detailsKey]: e.target.value,
                          }))
                        }
                        className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors min-h-[110px] resize-none shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      />
                    </div>

                    {renderRowExtras ? (
                      <div className="mt-3">
                        {renderRowExtras({ item, setItem })}
                      </div>
                    ) : null}
                  </div>
                );
              })}

              <div className="flex items-center justify-start">
                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-xs md:text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                >
                  {addLabel}
                </button>
              </div>
            </div>
          )}

          {errors.items ? (
            <p className="text-red-500 text-xs md:text-sm">{errors.items}</p>
          ) : null}

          <div className="flex w-full justify-center">
            <button
              type="button"
              onClick={save}
              disabled={isSaving}
              className="w-full max-w-sm px-5 py-3 rounded-2xl cursor-pointer bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>

          {statusMessage ? (
            <div className="flex items-center justify-center w-full">
              <p className="text-white/90 text-xs md:text-sm text-center px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                {statusMessage}
              </p>
            </div>
          ) : null}

          {items.length > 0 ? (
            <div className="text-white/50 text-xs">
              Current order preview:{" "}
              <span className="text-white/70">
                {sortedPreview
                  .map((x) => x.name.trim())
                  .filter(Boolean)
                  .join(" • ") || "—"}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
