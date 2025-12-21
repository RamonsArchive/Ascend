import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { Organization, OrgMembership } from "@prisma/client";
import { s3KeyToPublicUrl } from "@/src/lib/s3";

type OrgWithMemberships = Organization & { memberships?: OrgMembership[] };

const AppOrgCard = ({ org }: { org: OrgWithMemberships }) => {
  const memberCount = org.memberships?.length ?? 0;

  return (
    <Link
      href={`/app/orgs/${org.slug}`}
      className="group w-full rounded-2xl border border-white/10 bg-primary-950/70 hover:bg-primary-950 transition-colors duration-200 overflow-hidden hover:border-accent-100"
    >
      <div className="relative w-full h-[140px] bg-black/40">
        {org.coverKey ? (
          <Image
            src={s3KeyToPublicUrl(org.coverKey) as string}
            alt={`${org.name} cover`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover opacity-85 group-hover:opacity-95 transition-opacity duration-200"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-secondary-500/20 via-primary-950 to-primary-950" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-primary-950 via-primary-950/30 to-transparent" />
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0">
            {org.logoKey ? (
              <Image
                src={s3KeyToPublicUrl(org.logoKey) as string}
                alt={`${org.name} logo`}
                fill
                sizes="40px"
                className="object-contain p-1"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-white/70">
                {org.name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <div className="text-white font-semibold leading-tight truncate">
              {org.name}
            </div>
            <div className="text-white/50 text-xs truncate">@{org.slug}</div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {org.description ? (
            <div className="text-white/70 text-sm leading-relaxed line-clamp-2">
              {org.description}
            </div>
          ) : (
            <div className="text-white/50 text-sm leading-relaxed">
              Organization on Ascend
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="text-white/50 text-xs">{memberCount} members</div>
            <div className="text-white/70 text-xs group-hover:text-white transition-colors">
              Open →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AppOrgCard;
