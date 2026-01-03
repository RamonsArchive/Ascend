"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

const MarkdownCard = ({
  title,
  value,
  emptyText,
}: {
  title: string;
  value: string;
  emptyText: string;
}) => {
  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-white/4 border border-white/10 px-6 py-6 md:px-8 md:py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="flex flex-col gap-1">
        <div className="text-white font-semibold text-lg md:text-xl">
          {title}
        </div>
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="prose prose-invert max-w-none prose-p:text-white/75 prose-a:text-accent-400 prose-strong:text-white prose-li:text-white/75">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
          >
            {value?.trim() ? value : `*${emptyText}*`}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

// want to show the event rules very big and clear, including rubric
const PrivateEventInfo = ({
  rulesMarkdown,
  rubricMarkdown,
}: {
  rulesMarkdown: string | null;
  rubricMarkdown: string | null;
}) => {
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-6 md:gap-8">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Event info
          </h2>
          <div className="text-sm md:text-base text-white/60 max-w-3xl">
            Clear rules and a consistent rubric helps teams move faster and
            judges stay aligned.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:gap-6">
          <MarkdownCard
            title="Rules"
            value={rulesMarkdown ?? ""}
            emptyText="No rules added yet."
          />

          <MarkdownCard
            title="Rubric"
            value={rubricMarkdown ?? ""}
            emptyText="No rubric added yet."
          />
        </div>
      </div>
    </section>
  );
};

export default PrivateEventInfo;
