import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { OrgListItem } from "@/src/lib/global_types";
import { s3KeyToPublicUrl } from "@/src/lib/s3-client";

const PublicOrgCard = ({ org }: { org: OrgListItem }) => {
  console.log(org);
  return (
    <Link
      href={`/orgs/${org.slug}`}
      className="group w-full rounded-xl border border-white/10 bg-primary-950/70 hover:bg-primary-950 transition-colors duration-200 overflow-hidden hover:border-accent-100"
    >
      <div className="relative w-full h-[140px] bg-black/40">
        {org.coverKey ? (
          <Image
            src={s3KeyToPublicUrl(org.coverKey) ?? ""}
            alt={`${org.name} cover`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover opacity-80 group-hover:opacity-90 transition-opacity duration-200"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-secondary-500/20 via-primary-950 to-primary-950" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-primary-950 via-primary-950/30 to-transparent" />
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-md overflow-hidden border border-white/10 bg-white/5 shrink-0">
            {org.logoKey ? (
              <Image
                src={s3KeyToPublicUrl(org.logoKey) ?? ""}
                alt={`${org.name} logo`}
                fill
                sizes="36px"
                className="object-contain p-1"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-white/70">
                {org.name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="text-white font-semibold leading-tight">
              {org.name}
            </div>
            <div className="text-white/50 text-xs">@{org.slug}</div>
          </div>
        </div>

        {org.description ? (
          <div className="text-white/70 text-sm leading-relaxed line-clamp-2">
            {org.description}
          </div>
        ) : (
          <div className="text-white/50 text-sm leading-relaxed">
            Organization on Ascend
          </div>
        )}
      </div>
    </Link>
  );
};

export default PublicOrgCard;
