import React from "react";
import { global_home_data } from "@/src/constants/globalConstants/global_index";
import Link from "next/link";
import ImageCarousel from "../ImageCarousel";

const HomeHero = () => {
  const { hero } = global_home_data;
  const { title, subtitle, description, buttons, images, carousel } = hero;

  return (
    <div className="relative flex flex-col items-center justify-center h-[calc(100dvh-48px)] w-full overflow-hidden">
      {/* Ascending Geometric Sticks Background Effect - Electric River Flow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Left side electric stream - evenly spread, flowing toward center */}
        {Array.from({ length: 40 }).map((_, i) => {
          const baseDelay = (i * 0.1) % 4; // Evenly spaced delays, cycling every 4s
          const delayVariation = (Math.random() - 0.5) * 0.3; // Small random variation ±0.15s
          const delay = baseDelay + delayVariation;
          const baseDuration = 3.5;
          const durationVariation = (Math.random() - 0.5) * 0.5; // Small variation ±0.25s
          const duration = baseDuration + durationVariation;
          const basePosition = 5 + (i % 20) * 2; // Evenly spread positions
          const positionVariation = (Math.random() - 0.5) * 1.5; // Small random variation ±0.75%
          const position = basePosition + positionVariation;
          return (
            <div
              key={`left-${i}`}
              className={`ascend-stick ascend-stick-left ${i % 2 === 0 ? "text-[#1A1BB8]" : "text-white"}`}
              style={
                {
                  "--stick-position": `${Math.max(2, Math.min(48, position))}%`,
                  "--stick-delay": `${Math.max(0, delay)}s`,
                  "--stick-duration": `${Math.max(2.5, Math.min(4.5, duration))}s`,
                } as React.CSSProperties
              }
            />
          );
        })}
        {/* Right side electric stream - evenly spread, flowing toward center */}
        {Array.from({ length: 40 }).map((_, i) => {
          const baseDelay = (i * 0.1) % 4; // Evenly spaced delays, cycling every 4s
          const delayVariation = (Math.random() - 0.5) * 0.3; // Small random variation ±0.15s
          const delay = baseDelay + delayVariation;
          const baseDuration = 3.5;
          const durationVariation = (Math.random() - 0.5) * 0.5; // Small variation ±0.25s
          const duration = baseDuration + durationVariation;
          const basePosition = 5 + (i % 20) * 2; // Evenly spread positions
          const positionVariation = (Math.random() - 0.5) * 1.5; // Small random variation ±0.75%
          const position = basePosition + positionVariation;
          return (
            <div
              key={`right-${i}`}
              className={`ascend-stick ascend-stick-right ${i % 2 === 0 ? "text-white" : "text-[#1A1BB8]"}`}
              style={
                {
                  "--stick-position": `${Math.max(2, Math.min(48, position))}%`,
                  "--stick-delay": `${Math.max(0, delay)}s`,
                  "--stick-duration": `${Math.max(2.5, Math.min(4.5, duration))}s`,
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
