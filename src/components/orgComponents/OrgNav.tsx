"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ProfileAvatar from "../ProfileAvatar";
import OrgMobileMenu from "./OrgMobileMenu";
import { org_nav_links } from "@/src/constants/orgConstants/org_index";

const MenuIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

// ...imports stay the same

const NavbarContent = ({
  onMenuToggle,
  isMenuOpen,
  orgSlug,
  hasPermissions,
  profileOpen,
  setProfileOpen,
}: {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
  orgSlug: string;
  hasPermissions: boolean;
  profileOpen: boolean;
  setProfileOpen: (v: boolean) => void;
}) => {
  const links = org_nav_links(orgSlug, hasPermissions);

  return (
    <div className="relative w-full bg-primary-950">
      <div className="marketing-nav-bg" />
      <div className="relative flex justify-between items-center w-full h-[48px] px-5 md:px-10">
        <div className="flex items-center justify-between w-full h-full">
          <Link
            href="/app"
            className="relative flex-center h-full w-[52px] md:w-[68px] cursor-pointer"
          >
            <Image
              src="/Logos/Transparent/ascend_logo_white_t.svg"
              alt="Ascend logo"
              fill
              priority
              sizes="68px"
              className="object-cover w-full cursor-pointer"
            />
          </Link>

          <div className="hidden lg:flex items-center justify-center flex-1">
            <div className="flex-center flex-row text-white">
              {links.map((link) => (
                <Link
                  href={link.href}
                  key={link.href}
                  className="text-white text-[16px] font-medium py-2 px-6 duration-300 ease-in-out hover:bg-primary-background-400/20 transition-colors text-center cursor-pointer rounded-sm"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* ✅ ONE instance only */}
          <div className="flex items-center gap-3">
            <ProfileAvatar open={profileOpen} setOpen={setProfileOpen} />

            <button
              onClick={onMenuToggle}
              className="lg:hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity duration-300 ease-in-out"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <XIcon className="w-6 h-6 text-white" />
              ) : (
                <MenuIcon className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrgNav = ({
  orgSlug,
  hasPermissions,
}: {
  orgSlug: string;
  hasPermissions: boolean;
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // IMPORTANT: start visible so the top isn't "blank spacer only"
  const [showNavbar, setShowNavbar] = useState(true);

  useEffect(() => {
    if (isMenuOpen) setProfileOpen(false);
  }, [isMenuOpen]);

  useEffect(() => {
    let lastScrollY = window.scrollY || 0;
    let ticking = false;

    const update = () => {
      const y = Math.max(0, window.scrollY || 0);
      const navbarHeight = 48;

      // At/near top: always show navbar
      if (y <= navbarHeight) {
        setShowNavbar(true);
        lastScrollY = y;
        ticking = false;
        return;
      }

      // Standard behavior:
      // scrolling DOWN -> hide
      // scrolling UP   -> show
      if (y > lastScrollY) setShowNavbar(false);
      else if (y < lastScrollY) setShowNavbar(true);

      lastScrollY = y;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Spacer keeps page content from sitting under fixed navbar */}
      <div className="h-[48px] marketing-nav-bg" />

      {/* ONE navbar, z-100 */}
      <div
        className={`fixed top-0 left-0 right-0 z-100 transform transition-all duration-300 ease-in-out ${
          showNavbar
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <NavbarContent
          onMenuToggle={() => setIsMenuOpen((p) => !p)}
          isMenuOpen={isMenuOpen}
          orgSlug={orgSlug}
          hasPermissions={hasPermissions}
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
        />
      </div>

      <OrgMobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        orgSlug={orgSlug}
        hasPermissions={hasPermissions}
      />
    </>
  );
};

export default OrgNav;
