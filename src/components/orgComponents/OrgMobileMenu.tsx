import React, { useEffect } from "react";
import Link from "next/link";
import { org_nav_links } from "@/src/constants/orgConstants/org_index";

const OrgMobileMenu = ({
  isOpen,
  onClose,
  orgSlug,
}: {
  isOpen: boolean;
  onClose: () => void;
  orgSlug: string;
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/55"
      />

      <div className="absolute top-[48px] left-0 right-0">
        <div className="w-full bg-primary-950 border-t border-white/10">
          <div className="flex flex-col px-5 py-5 gap-2">
            {org_nav_links(orgSlug).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white/90 hover:bg-white/10 transition-colors text-sm"
              >
                {link.label}
              </Link>
            ))}

            <div className="w-full h-px bg-white/10" />

            <Link
              href="/app"
              onClick={onClose}
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition-colors text-sm"
            >
              Back to App
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgMobileMenu;
