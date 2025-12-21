"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ProfileAvatar from "../ProfileAvatar";
import { nav_links } from "@/src/constants/globalConstants/global_index";
import GlobalMobileMenu from "./GlobalMobileMenu";

// Menu icon component
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

// Close icon component
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

// Base Navbar content component (reusable for both static and floating)
const NavbarContent = ({
  onMenuToggle,
  isMenuOpen,
}: {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}) => {
  return (
    <div className="relative w-full bg-primary-950">
      <div className="marketing-nav-bg" />
      <div className="relative flex justify-between items-center w-full h-[48px] px-5 md:px-10">
        <div className="flex items-center justify-between w-full h-full">
          {/* Logo */}
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
              className="object-cover w-full cursor-pointer"
            />
          </Link>

          {/* Desktop: Nav links in center */}
          <div className="hidden lg:flex items-center justify-center flex-1 gap-0">
            <div className="flex-center flex-row text-white">
              {nav_links.map((link) => (
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

          {/* Desktop: Profile Avatar on the right */}
          <div className="hidden lg:flex items-center">
            <ProfileAvatar />
          </div>

          {/* Mobile: Profile Avatar and Menu button */}
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

// Static Navbar (default, always visible)
const StaticNavbar = ({
  onMenuToggle,
  isMenuOpen,
}: {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}) => {
  return (
    <div className="relative z-10 w-full shrink-0">
      <NavbarContent onMenuToggle={onMenuToggle} isMenuOpen={isMenuOpen} />
    </div>
  );
};

// Floating Navbar (appears when scrolling down past static navbar)
const FloatingNavbar = ({
  isVisible,
  onMenuToggle,
  isMenuOpen,
}: {
  isVisible: boolean;
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}) => {
  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transform transition-all duration-300 ease-in-out ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <NavbarContent onMenuToggle={onMenuToggle} isMenuOpen={isMenuOpen} />
    </div>
  );
};

// Main Navbar component with scroll detection and throttling
const GlobalNav = () => {
  const pathname = usePathname();
  const segments = (pathname || "").split("/").filter(Boolean);
  const isOrgDashboardRoute =
    segments[0] === "app" &&
    segments[1] === "orgs" &&
    segments.length >= 3 &&
    segments[2] !== "new";

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFloatingNavbar, setShowFloatingNavbar] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    if (isOrgDashboardRoute) return;
    let lastScrollY = window.scrollY || window.pageYOffset || 0;
    let ticking = false;

    const updateNavbar = () => {
      const currentScrollY = Math.max(
        0,
        window.scrollY || window.pageYOffset || 0
      );

      const navbarHeight = 48; // Height of the navbar

      // Only show floating navbar when we've scrolled past navbar
      if (currentScrollY > navbarHeight) {
        // Scrolling down
        if (currentScrollY > lastScrollY) {
          setShowFloatingNavbar(true);
        }
        // Scrolling up - hide floating navbar
        else if (currentScrollY < lastScrollY) {
          setShowFloatingNavbar(false);
        }
      } else {
        // At top, hide floating navbar
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

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isOrgDashboardRoute]);

  // Close menu when clicking outside (optional enhancement)
  useEffect(() => {
    if (isOrgDashboardRoute) return;
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen, isOrgDashboardRoute]);

  // Avoid double navbar: org dashboard routes use `OrgNav` via nested layout.
  if (isOrgDashboardRoute) return null;

  return (
    <>
      {/* Static navbar */}
      <StaticNavbar onMenuToggle={toggleMenu} isMenuOpen={isMenuOpen} />

      {/* Floating navbar */}
      <FloatingNavbar
        isVisible={showFloatingNavbar}
        onMenuToggle={toggleMenu}
        isMenuOpen={isMenuOpen}
      />

      {/* Mobile Menu */}
      <GlobalMobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  );
};

export default GlobalNav;
