"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { nav_links } from "@/src/constants/globalConstants/global_index";
import { X } from "lucide-react";

interface GlobalMobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalMobileMenu({
  isOpen,
  onClose,
}: GlobalMobileMenuProps) {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [animateText, setAnimateText] = useState(false);
  const innerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mount on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle click outside and keyboard
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent | TouchEvent) => {
      const innerClicked = innerRef.current?.contains(e.target as Node);
      const outerClicked = outerRef.current?.contains(e.target as Node);
      if (outerClicked && !innerClicked) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Handle menu open/close state
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isOpen) {
      // Reset states
      setAnimateText(false);
      // Render menu
      requestAnimationFrame(() => {
        setShouldRender(true);
      });
      // Start text animation after menu slide-in completes (300ms transition)
      timeoutRef.current = setTimeout(() => {
        setAnimateText(true);
      }, 300);
    } else {
      // Close menu - animate text out first
      setAnimateText(false);
      // Wait for menu slide-out animation (300ms), then remove from DOM
      timeoutRef.current = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match transition duration
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen]);

  if (!mounted) return null;
  if (!shouldRender && !isOpen) return null; // Don't render when fully closed

  return createPortal(
    <>
      {/* Backdrop - always covers full screen, only fades */}
      <aside
        ref={outerRef}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ease-in-out ${
          isOpen && shouldRender
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Menu Panel - slides in from right */}
        <div
          ref={innerRef}
          className={`fixed inset-y-0 right-0 flex h-full flex-col w-[75%] bg-primary-950 shadow-2xl transition-transform duration-300 ease-in-out ${
            isOpen && shouldRender ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex justify-end p-5 pointer-events-auto">
            <button
              className="flex-center cursor-pointer rounded-full bg-primary-background-400/20 p-2 transition-colors hover:bg-primary-background-400/30"
              onClick={onClose}
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-2 px-5 pt-8 pointer-events-auto">
            {nav_links.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`text-white text-[18px] font-medium py-4 px-4 rounded-sm hover:bg-primary-background-400/20 transition-colors duration-200 ease-in-out cursor-pointer ${
                  animateText
                    ? "mobile-link-in block"
                    : "mobile-link-out hidden"
                }`}
                style={{
                  animationDelay: animateText ? `${index * 80}ms` : "0ms",
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </>,
    document.body
  );
}
