"use client";

import React, { useMemo, useState } from "react";
import SettingsFilter from "./SettingsFilter";
import type { SettingsSection, SettingsTab } from "@/src/lib/global_types";

const SettingsClient = <TView extends string>({
  initialView,
  tabs,
  sections,
}: {
  initialView: TView;
  tabs: Array<SettingsTab<TView>>;
  sections: Array<SettingsSection<TView>>;
}) => {
  const [view, setView] = useState<TView>(initialView);

  const sectionMap = useMemo(() => {
    const m = new Map<TView, () => React.ReactNode>();
    sections.forEach((s) => m.set(s.key, s.render));
    return m;
  }, [sections]);

  const render = sectionMap.get(view);

  return (
    <>
      <SettingsFilter value={view} onChange={setView} tabs={tabs} />
      {render ? render() : null}
    </>
  );
};

export default SettingsClient;
