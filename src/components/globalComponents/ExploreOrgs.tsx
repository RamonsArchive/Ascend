import React from "react";
import Link from "next/link";
import PublicOrgCard from "@/src/components/PublicOrgCard";
import { global_events_data } from "@/src/constants/globalConstants/global_index";
import type { OrgListItem } from "@/src/lib/global_types";

const ExploreOrgs = ({ orgs }: { orgs: OrgListItem[] }) => {
  const { orgs: orgCopy } = global_events_data;

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 gap-6 md:gap-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight">
              {orgCopy.title}
            </h2>
            <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-3xl">
              {orgCopy.subtitle}
            </div>
          </div>

          <Link
            href={orgCopy.cta.href}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-md bg-white/5 text-white/90 border border-white/10 hover:bg-white/10 transition-colors duration-200 w-full md:w-auto"
          >
            {orgCopy.cta.label}
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {orgs.map((org) => (
            <PublicOrgCard key={org.id} org={org} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExploreOrgs;
