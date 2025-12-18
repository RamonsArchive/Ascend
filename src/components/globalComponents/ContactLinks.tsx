import React from "react";
import { global_contact_data } from "@/src/constants/globalConstants/global_index";
import { footerSocials, socialIcons } from "@/src/constants/links_index";

const CONTACT_SOCIAL_IDS = new Set(["instagram", "gmail", "linkedin"]);

function displayHandle(id: string, href: string) {
  if (id === "instagram") return "@clutchstudio.dev";
  if (id === "gmail") return "clutchdev.apps@gmail.com";
  if (id === "linkedin") return "linkedin.com/in/ramonmnm100";
  if (href.startsWith("mailto:")) return href.replace("mailto:", "");
  return href;
}

const ContactLinks = () => {
  const { linksSection } = global_contact_data;

  const links = footerSocials.filter((l) => CONTACT_SOCIAL_IDS.has(l.id));

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-8 md:gap-10">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            {linksSection.title}
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            {linksSection.description}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {links.map((l) => {
            const isExternal = l.href.startsWith("http");
            return (
              <a
                key={l.id}
                href={l.href}
                aria-label={l.ariaLabel}
                title={l.title}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="marketing-card rounded-3xl px-6 py-5"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center px-3 py-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-white/90">
                      {socialIcons[l.id] ?? null}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-base md:text-lg font-semibold text-white">
                      {l.name}
                    </div>
                    <div className="text-sm md:text-base text-white/65 leading-relaxed">
                      {displayHandle(l.id, l.href)}
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ContactLinks;
