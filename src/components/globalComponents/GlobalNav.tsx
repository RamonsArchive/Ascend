"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ProfileAvatar from "../ProfileAvatar";
import { nav_links } from "@/src/constants/globalConstants/global_index";
import GlobalMobileMenu from "./GlobalMobileMenu";

const MenuIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
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
  profileOpen,
  setProfileOpen,
}: {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
  profileOpen: boolean;
  setProfileOpen: (v: boolean) => void;
}) => {
  return (
    <div className="relative w-full bg-primary-950">
      <div className="marketing-nav-bg" />
      <div className="relative flex justify-between items-center w-full h-[48px] px-5 md:px-10">
        <div className="flex items-center justify-between w-full h-full">
          <Link
            href="/"
            className="relative flex-center h-full w-[52px] md:w-[68px] cursor-pointer"
          >
            <Image
              src="/Logos/Transparent/ascend_logo_white_t.svg"
              alt="Ascend logo"
              fill
              priority
              sizes="68px"
              className="object-cover"
            />
          </Link>

          <div className="hidden lg:flex items-center justify-center flex-1">
            <div className="flex flex-row text-white">
              {nav_links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-white text-[16px] font-medium py-2 px-6 hover:bg-primary-background-400/20 transition-colors rounded-sm"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex items-center">
            <ProfileAvatar open={profileOpen} setOpen={setProfileOpen} />
          </div>

          <div className="lg:hidden flex items-center gap-3">
            <ProfileAvatar open={profileOpen} setOpen={setProfileOpen} />
            <button onClick={onMenuToggle} aria-label="Toggle menu">
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

const GlobalNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true); // ✅ default visible

  useEffect(() => {
    if (isMenuOpen) setProfileOpen(false);
  }, [isMenuOpen]);

  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      if (y > 48) {
        if (y > lastY) setShowNavbar(false);
        else setShowNavbar(true);
      } else {
        setShowNavbar(true);
      }
      lastY = y;
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
      {/* Spacer with GRID ONLY */}
      <div className="h-[48px] marketing-nav-bg" />

      <div
        className={`fixed top-0 left-0 right-0 z-100 transition-all duration-300 ${
          showNavbar
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <NavbarContent
          onMenuToggle={() => setIsMenuOpen((p) => !p)}
          isMenuOpen={isMenuOpen}
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
        />
      </div>

      <GlobalMobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  );
};

export default GlobalNav;
