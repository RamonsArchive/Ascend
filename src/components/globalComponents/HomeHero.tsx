import React from "react";
import { global_home_data } from "@/src/constants/globalConstants/global_index";
import Link from "next/link";
import ImageCarousel from "../ImageCarousel";

const HomeHero = () => {
  const { hero } = global_home_data;
  const { title, subtitle, description, buttons, images, carousel } = hero;

  const STICK_COUNT = 72;
  const rand01 = (seed: number) => {
    // Deterministic pseudo-random in [0,1)
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v));

  return (
    <div className="relative flex flex-col items-center justify-center h-[calc(100dvh-48px)] w-full overflow-hidden">
      {/* Ascending Geometric Sticks Background Effect - Constant Stream Straight Up */}
      <div className="ascend-stream">
        {Array.from({ length: STICK_COUNT }).map((_, i) => {
          // Evenly spaced across the bottom, with subtle deterministic jitter (balanced, not wavy).
          const baseX = ((i + 0.5) / STICK_COUNT) * 100;
          const xJitter = (rand01(i * 12.9898 + 1.23) - 0.5) * 1.2; // ±0.6%
          const x = clamp(baseX + xJitter, 1, 99);

          // Fast, constant stream: use negative delays so it starts "already flowing".
          const dur = 1.9 + rand01(i * 0.17 + 9.1) * 0.8; // 1.9s .. 2.7s
          const delay = -(i * 0.09); // continuous spacing (no wave reset)

          // Keep it low: shorter bars + limited travel, slight variety.
          const h = 34 + rand01(i * 3.33 + 2.7) * 38; // 34px .. 72px
          const travel = 110 + rand01(i * 7.77 + 4.2) * 80; // 110px .. 190px

          return (
            <div
              key={`stick-${i}`}
              className={`ascend-stick ${i % 2 === 0 ? "text-[#1A1BB8]" : "text-white"}`}
              style={
                {
                  "--x": x,
                  "--dur": `${dur}s`,
                  "--delay": `${delay}s`,
                  "--h": `${h}px`,
                  "--travel": `${travel}px`,
                } as React.CSSProperties
              }
            />
          );
        })}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-2xl px-5 py-5 sm:px-10 sm:py-10 md:px-18 md:py-18">
        {/* Main Content Section - Compact spacing to fit viewport */}
        <div className="flex flex-col items-center w-full gap-4 md:gap-5 lg:gap-6">
          {/* Text Content */}
          <div className="flex flex-col items-center text-center gap-2 md:gap-3 max-w-4xl shrink-0">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              {title}
            </h1>

            {/* Subtitle */}
            <div className="text-md md:text-lg font-medium text-white/90 leading-snug">
              {subtitle}
            </div>

            {/* Description */}
            <div className="text-sm md:text-md text-white/70 leading-relaxed max-w-2xl">
              {description}
            </div>
          </div>

          {/* Image Carousel Section */}
          <div className="flex flex-col items-center w-full gap-2 md:gap-3 shrink min-w-0">
            <div className="w-full max-w-2xl">
              <ImageCarousel
                images={images.map((image) => image.src) as string[]}
              />
            </div>

            {/* Carousel Caption */}
            {carousel?.caption && (
              <div className="text-xs md:text-sm lg:text-base text-white/60 text-center max-w-2xl">
                {carousel.caption}
              </div>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 shrink-0">
            {buttons.map((button, index) => {
              const isPrimary = index === 0;
              return (
                <Link
                  key={button.label}
                  href={button.href || "#"}
                  className={`
                    flex items-center justify-center
                    px-6 md:px-8 lg:px-10
                    py-2.5 md:py-3 lg:py-3.5
                    text-sm md:text-base font-semibold
                    rounded-lg
                    transition-all duration-200 ease-in-out
                    ${
                      isPrimary
                        ? "bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700"
                        : "bg-white/10 text-white border border-white/20 hover:bg-white/20 active:bg-white/30 backdrop-blur-sm"
                    }
                  `}
                >
                  {button.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeHero;
