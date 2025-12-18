import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  ABOUT_DATA,
  global_about_data,
} from "@/src/constants/globalConstants/global_index";

const AboutFounder = () => {
  const { founder } = global_about_data;
  const { images } = ABOUT_DATA;
  const founderImage = images[0];

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-8 md:gap-10">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Meet the founder
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            {founder.description}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Founder image */}
          <div className="marketing-card flex flex-col gap-4 px-6 py-6 rounded-2xl">
            <div className="flex flex-col gap-1">
              <div className="text-sm md:text-base font-semibold text-white">
                {founderImage.alt}
              </div>
              <div className="text-xs md:text-sm text-white/60">
                {founderImage.description}
              </div>
            </div>
            <div className="relative w-full h-[320px] rounded-xl overflow-hidden bg-white/5 border border-white/10">
              <Image
                src={founderImage.src}
                alt={founderImage.alt}
                fill
                sizes="(max-width: 768px) 90vw, 320px"
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Partners (logos + links) */}
          <div className="marketing-card flex flex-col gap-4 px-6 py-6 rounded-2xl">
            <div className="text-sm md:text-base font-semibold text-white">
              Partners
            </div>
            <div className="flex flex-col gap-4">
              <Link
                href="https://digitalrevolution.foundation"
                target="_blank"
                className="marketing-card flex items-center justify-between gap-4 px-5 py-4 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-[40px] h-[40px]">
                    <Image
                      src="/GlobalAssets/About/advLogoDark-4.png"
                      alt="Digital Revolution"
                      fill
                      sizes="40px"
                      className="object-contain"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-sm md:text-base font-semibold text-white">
                      Digital Revolution
                    </div>
                    <div className="text-xs md:text-sm text-white/60">
                      Mission-aligned foundation
                    </div>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-white/50" />
              </Link>

              <Link
                href="https://clutchstudio.dev"
                target="_blank"
                className="marketing-card flex items-center justify-between gap-4 px-5 py-4 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-[40px] h-[40px]">
                    <Image
                      src="/GlobalAssets/About/icon.png"
                      alt="Clutch Studio"
                      fill
                      sizes="40px"
                      className="object-contain"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-sm md:text-base font-semibold text-white">
                      Clutch Studio
                    </div>
                    <div className="text-xs md:text-sm text-white/60">
                      Product + engineering partner
                    </div>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-white/50" />
              </Link>
            </div>
          </div>

          {/* Built for */}
          <div className="marketing-card flex flex-col gap-4 px-6 py-6 rounded-2xl">
            <div className="text-sm md:text-base font-semibold text-white">
              What we optimize for
            </div>
            <div className="text-sm md:text-base text-white/75 leading-relaxed">
              Organizer‑first workflows, participant clarity, and safe admin
              controls—so your event feels clean at every step.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutFounder;
