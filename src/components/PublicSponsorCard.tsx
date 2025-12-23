"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import type { SponsorTier } from "@prisma/client";
import type { PublicOrgSponsor } from "@/src/lib/global_types";
import { s3KeyToPublicUrl } from "@/src/lib/s3-client";
import { tierBadgeClasses } from "@/src/lib/utils";

const tierLabel = (tier: SponsorTier) => {
  switch (tier) {
    case "TITLE":
      return "Title";
    case "PLATINUM":
      return "Platinum";
    case "GOLD":
      return "Gold";
    case "SILVER":
      return "Silver";
    case "BRONZE":
      return "Bronze";
    case "COMMUNITY":
      return "Community";
    default:
      return tier;
  }
};

const PublicSponsorCard = ({
  sponsorLink,
}: {
  sponsorLink: PublicOrgSponsor;
}) => {
  const { sponsor } = sponsorLink;

  const name = sponsorLink.displayName?.trim() || sponsor.name;
  const slug = sponsor.slug;

  const website =
    sponsorLink.sponsor.websiteKey?.trim() ||
    sponsor.websiteKey?.trim() ||
    null;

  // org-level overrides first
  const logoKey = sponsorLink.logoKey ?? sponsor.logoKey;
  const coverKey = sponsor.coverKey; // no org override in schema

  const logoUrl = useMemo(() => {
    if (!logoKey) return null;
    return s3KeyToPublicUrl(logoKey) as string;
  }, [logoKey]);

  const coverUrl = useMemo(() => {
    if (!coverKey) return null;
    return s3KeyToPublicUrl(coverKey) as string;
  }, [coverKey]);

  const markdown = useMemo(() => {
    return (
      sponsorLink.blurb?.trim() ||
      sponsor.description?.trim() ||
      ""
    ).trim();
  }, [sponsorLink.blurb, sponsor.description]);

  return (
    <div className="group w-full rounded-3xl border border-white/10 bg-white/4 hover:bg-white/6 transition-colors duration-200 overflow-hidden hover:border-accent-100">
      {/* Cover */}
      <div className="relative w-full h-[160px] bg-black/40">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={`${name} cover`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover opacity-85 group-hover:opacity-95 transition-opacity duration-200"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-secondary-500/20 via-primary-950 to-primary-950" />
        )}

        <div className="absolute inset-0 bg-linear-to-t from-primary-950 via-primary-950/35 to-transparent" />

        {/* Tier badge */}
        <div className="absolute top-3 left-3">
          <div
            className={[
              "px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm",
              tierBadgeClasses(sponsorLink.tier),
            ].join(" ")}
          >
            {tierLabel(sponsorLink.tier)}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-5">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${name} logo`}
                fill
                sizes="44px"
                className="object-contain p-2"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white/70">
                {name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <div className="text-white font-semibold leading-tight truncate">
              {name}
            </div>
            <div className="text-white/50 text-xs truncate">@{slug}</div>
            {website ? (
              <div className="text-white/60 text-xs break-all">{website}</div>
            ) : null}
          </div>
        </div>

        {/* Markdown */}
        {markdown ? (
          <div className="prose prose-invert max-w-none prose-p:text-white/75 prose-a:text-accent-400 prose-strong:text-white prose-li:text-white/75 prose-headings:text-white">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-white/50 text-sm leading-relaxed">
            No sponsor description yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicSponsorCard;
