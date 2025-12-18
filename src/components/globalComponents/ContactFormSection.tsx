import React from "react";
import ContactForm from "./ContactForm";
import { global_contact_data } from "@/src/constants/globalConstants/global_index";

const ContactFormSection = () => {
  const { formSection } = global_contact_data;

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-8 md:gap-10">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            {formSection.title}
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            {formSection.description}
          </div>
        </div>

        <ContactForm
          services={[...formSection.services]}
          submitLabel={formSection.submitLabel}
        />
      </div>
    </section>
  );
};

export default ContactFormSection;
