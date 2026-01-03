"use client";

import React from "react";
import { EventListEditor } from "@/src/components/formComponents/EventListEditor";
import type { RubricCategoryDraft } from "@/src/lib/global_types";
import { updateEventRubricCategories } from "@/src/actions/event_actions";

const clampInt = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const EventEditRubricCategoriesSection = ({
  eventId,
  orgId,
  defaults,
}: {
  eventId: string;
  orgId: string;
  defaults: RubricCategoryDraft[];
}) => {
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-6 md:gap-8">
        <EventListEditor<RubricCategoryDraft>
          title="Rubric categories"
          subtitle="Add categories judges will score. Weights should total 100."
          emptyText="No rubric categories yet."
          addLabel="+ Add category"
          defaults={defaults ?? []}
          detailsLabel="Description (optional)"
          detailsKey="description"
          onNormalize={(items) => {
            const payload = items.map((c, idx) => {
              const order = Number(String(c.order ?? idx));
              const weightRaw = Number(String(c.weight ?? 0));
              return {
                name: c.name.trim(),
                description: (c.description ?? "").trim() || undefined,
                order: clampInt(order, 0, 999),
                weight: clampInt(weightRaw, 0, 100),
              };
            });
            return payload;
          }}
          renderRowExtras={({ item, setItem }) => (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="flex flex-col gap-2 md:col-span-1">
                <label className="text-xs md:text-sm text-white/75">
                  Weight (%)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(item.weight ?? "")}
                  onChange={(e) =>
                    setItem((prev) => ({
                      ...prev,
                      weight: Number(e.target.value.replace(/[^\d]/g, "") || 0),
                    }))
                  }
                  placeholder="25"
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                />
              </div>
            </div>
          )}
          onSave={async (payload) => {
            return updateEventRubricCategories(
              eventId,
              orgId,
              payload as RubricCategoryDraft[],
            );
          }}
        />
      </div>
    </section>
  );
};

export default EventEditRubricCategoriesSection;
