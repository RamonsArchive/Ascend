import React from "react";
import { global_home_data } from "@/src/constants/globalConstants/global_index";
import Link from "next/link";
import ImageCarousel from "../ImageCarousel";

const HomeHero = () => {
  const { hero } = global_home_data;
  const { title, subtitle, description, buttons, images } = hero;
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100dvh-48px)]">
      <div className="flex flex-col items-center justify-center max-w-2xl w-full">
        <h1 className="text-4xl font-bold">{title}</h1>
        <p className="text-lg">{subtitle}</p>
        <p className="text-lg">{description}</p>
      </div>
      <div className="w-full">
        <ImageCarousel images={images.map((image) => image.src) as string[]} />
      </div>
      <div className="flex flex-row items-center justify-center">
        {buttons.map((button) => (
          <Link key={button.label} href={button.href}>
            {button.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HomeHero;
