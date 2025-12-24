import React from "react";
import Link from "next/link";
import AppOrgCard from "./AppOrgCard";
import type { OrgListItem } from "@/src/lib/global_types";

const AppOrganizationsSection = ({
  title,
  description,
  orgs,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  description: string;
  orgs: OrgListItem[];
  ctaHref: string;
  ctaLabel: string;
}) => {
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-8 md:gap-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 md:gap-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl md:text-3xl font-semibold text-white">
              {title}
            </h2>
            <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
              {description}
            </div>
          </div>

          <Link
            href={ctaHref}
            className="w-full md:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 text-center"
          >
            {ctaLabel}
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {orgs.map((org) => (
            <AppOrgCard key={org.id} org={org} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default AppOrganizationsSection;
