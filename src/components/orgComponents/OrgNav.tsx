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

const NavbarContent = ({
  onMenuToggle,
  isMenuOpen,
  orgSlug,
  hasPermissions,
}: {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
  orgSlug: string;
  hasPermissions: boolean;
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

          <div className="hidden lg:flex items-center">
            <ProfileAvatar />
          </div>

          <div className="lg:hidden flex items-center gap-3">
            <ProfileAvatar />
            <button
              onClick={onMenuToggle}
              className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity duration-300 ease-in-out"
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

const StaticNavbar = ({
  onMenuToggle,
  isMenuOpen,
  orgSlug,
  hasPermissions,
}: {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
  orgSlug: string;
  hasPermissions: boolean;
}) => {
  return (
    <div className="relative z-10 w-full shrink-0">
      <NavbarContent
        onMenuToggle={onMenuToggle}
        isMenuOpen={isMenuOpen}
        orgSlug={orgSlug}
        hasPermissions={hasPermissions}
      />
    </div>
  );
};

const FloatingNavbar = ({
  isVisible,
  onMenuToggle,
  isMenuOpen,
  orgSlug,
  hasPermissions,
}: {
  isVisible: boolean;
  onMenuToggle: () => void;
  isMenuOpen: boolean;
  orgSlug: string;
  hasPermissions: boolean;
}) => {
  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transform transition-all duration-300 ease-in-out ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <NavbarContent
        onMenuToggle={onMenuToggle}
        isMenuOpen={isMenuOpen}
        orgSlug={orgSlug}
        hasPermissions={hasPermissions}
      />
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
  const [showFloatingNavbar, setShowFloatingNavbar] = useState(false);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  useEffect(() => {
    let lastScrollY = window.scrollY || window.pageYOffset || 0;
    let ticking = false;

    const updateNavbar = () => {
      const currentScrollY = Math.max(
        0,
        window.scrollY || window.pageYOffset || 0
      );
      const navbarHeight = 48;

      if (currentScrollY > navbarHeight) {
        if (currentScrollY > lastScrollY) setShowFloatingNavbar(true);
        else if (currentScrollY < lastScrollY) setShowFloatingNavbar(false);
      } else {
        setShowFloatingNavbar(false);
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateNavbar);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  return (
    <>
      <StaticNavbar
        onMenuToggle={toggleMenu}
        isMenuOpen={isMenuOpen}
        orgSlug={orgSlug}
        hasPermissions={hasPermissions} // ✅ FIX
      />

      <FloatingNavbar
        isVisible={showFloatingNavbar}
        onMenuToggle={toggleMenu}
        isMenuOpen={isMenuOpen}
        orgSlug={orgSlug}
        hasPermissions={hasPermissions}
      />

      <OrgMobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        orgSlug={orgSlug}
        hasPermissions={hasPermissions} // ✅ FIX
      />
    </>
  );
};

export default OrgNav;
