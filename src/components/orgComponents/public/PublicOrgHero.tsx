import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { Organization, OrgRole } from "@prisma/client";
import { s3KeyToPublicUrl } from "@/src/lib/s3";

const PublicOrgHero = ({
  org,
  canEdit,
  role,
}: {
  org: Pick<
    Organization,
    "name" | "slug" | "description" | "logoKey" | "coverKey"
  >;
  canEdit: boolean;
  role: OrgRole | null;
}) => {
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-6">
        <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 bg-primary-950/70">
          <div className="relative w-full h-[200px] md:h-[260px] bg-black/40">
            {org.coverKey ? (
              <Image
                src={s3KeyToPublicUrl(org.coverKey) as string}
                alt={`${org.name} cover`}
                fill
                sizes="(max-width: 768px) 100vw, 80vw"
                className="object-cover opacity-85"
              />
            ) : (
              <div className="absolute inset-0 bg-linear-to-br from-secondary-500/20 via-primary-950 to-primary-950" />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-primary-950 via-primary-950/30 to-transparent" />
          </div>

          <div className="flex flex-col gap-5 p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 md:gap-6">
              <div className="flex items-start gap-4">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-white/5 shrink-0">
                  {org.logoKey ? (
                    <Image
                      src={s3KeyToPublicUrl(org.logoKey) as string}
                      alt={`${org.name} logo`}
                      fill
                      sizes="56px"
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-white/70">
                      {org.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="text-white/60 text-xs">@{org.slug}</div>
                  <h1 className="text-2xl md:text-4xl font-semibold text-white leading-tight">
                    {org.name}
                  </h1>
                  <div className="text-white/70 text-sm md:text-base leading-relaxed max-w-3xl">
                    {org.description || "Organization on Ascend."}
                  </div>
                </div>
              </div>

              {canEdit ? (
                <div className="flex flex-col gap-3">
                  <div className="text-white/60 text-xs">
                    Admin access · <span className="text-white/80">{role}</span>
                  </div>
                  <Link
                    href={`/app/orgs/${org.slug}/settings`}
                    className="w-full md:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 text-center"
                  >
                    Edit organization
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {canEdit ? (
          <div className="fixed bottom-5 right-5 z-50">
            <Link
              href={`/app/orgs/${org.slug}/settings`}
              className="px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
            >
              Edit
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default PublicOrgHero;
