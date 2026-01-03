import React from "react";

const EmptyState = ({ title, body }: { title: string; body: string }) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-white font-semibold text-sm">{title}</div>
      <div className="text-white/60 text-xs">{body}</div>
    </div>
  );
};

export default EmptyState;
