import React from "react";
import { global_contact_data } from "@/src/constants/globalConstants/global_index";

const ContactHero = () => {
  const { hero } = global_contact_data;

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-12 md:py-16 gap-6 md:gap-8">
        <div className="text-xs md:text-sm text-white/60 font-medium">
          {hero.eyebrow}
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white leading-tight">
          {hero.title}
        </h1>
        <div className="text-sm md:text-base text-white/75 leading-relaxed max-w-3xl">
          {hero.description}
        </div>
      </div>
    </section>
  );
};

export default ContactHero;
