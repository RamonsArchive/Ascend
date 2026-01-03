import React from "react";
import type { RubricCategoryDraft } from "@/src/lib/global_types";

const PublicEventRubricCategoriesSection = ({
  rubricCategories,
}: {
  rubricCategories: RubricCategoryDraft[];
}) => {
  console.log("rubricCategories", rubricCategories);
  if (rubricCategories.length === 0) {
    return null;
  }
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-6 md:gap-8">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Rubric categories
          </h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-3xl">
            Judges score projects using these categories and weights.
          </p>
        </div>

        {rubricCategories.length === 0 ? (
          <div className="w-full rounded-3xl bg-white/4 border border-white/10 px-6 py-6 md:px-8 md:py-8">
            <div className="text-white/80 font-semibold">
              No rubric categories yet
            </div>
            <div className="text-white/60 text-sm leading-relaxed">
              Categories will appear here once they’re added in event settings.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {rubricCategories.map((c, idx) => (
              <div
                key={idx}
                className="w-full rounded-3xl bg-white/4 border border-white/10 px-6 py-6 md:px-8 md:py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-white font-semibold text-lg">
                      {c.name}
                    </div>
                    <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/70 text-[11px] font-semibold">
                      {c.weight ? `${c.weight}%` : "—"}
                    </div>
                  </div>

                  {c.description?.trim() ? (
                    <div className="text-white/70 text-sm leading-relaxed">
                      {c.description}
                    </div>
                  ) : (
                    <div className="text-white/55 text-sm leading-relaxed">
                      No description provided.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PublicEventRubricCategoriesSection;
