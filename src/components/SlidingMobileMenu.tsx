"use client";

import React, { useEffect, useRef, useState, startTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X } from "lucide-react";

import type { SlidingMobileMenuProps, NavLink } from "@/src/lib/global_types";
export default function SlidingMobileMenu({
  isOpen,
  onClose,
  links,
  title,
  footerLinks = [],
  side = "right",
  widthClassName = "w-[78%]",
}: SlidingMobileMenuProps) {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [animateText, setAnimateText] = useState(false);

  const innerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  // outside click + esc
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent | TouchEvent) => {
      const innerClicked = innerRef.current?.contains(e.target as Node);
      const outerClicked = outerRef.current?.contains(e.target as Node);
      if (outerClicked && !innerClicked) onClose();
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

  // open/close animation orchestration
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isOpen) {
      startTransition(() => setAnimateText(false));
      requestAnimationFrame(() => setShouldRender(true));
      timeoutRef.current = setTimeout(() => setAnimateText(true), 280);
    } else {
      startTransition(() => setAnimateText(false));
      timeoutRef.current = setTimeout(() => setShouldRender(false), 280);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen]);

  if (!mounted) return null;
  if (!shouldRender && !isOpen) return null;

  const isRight = side === "right";
  const slideIn =
    isOpen && shouldRender
      ? "translate-x-0"
      : isRight
        ? "translate-x-full"
        : "-translate-x-full";

  return createPortal(
    <aside
      ref={outerRef}
      className={`fixed inset-0 z-60 bg-black/55 transition-opacity duration-300 ease-in-out ${
        isOpen && shouldRender ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        ref={innerRef}
        className={`fixed inset-y-0 ${isRight ? "right-0" : "left-0"} ${widthClassName} bg-primary-950
        border-l ${isRight ? "border-white/10" : "border-white/0"}
        border-r ${!isRight ? "border-white/10" : "border-white/0"}
        shadow-2xl transition-transform duration-300 ease-in-out ${slideIn}
        flex h-full flex-col`}
      >
        {/* top bar */}
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex flex-col gap-1">
            {title ? (
              <div className="text-white font-semibold text-sm">{title}</div>
            ) : (
              <div className="text-white/80 font-medium text-sm">Menu</div>
            )}
            <div className="h-px w-10 bg-white/10" />
          </div>

          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex items-center justify-center rounded-full bg-white/5 border border-white/10 p-2 hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* links */}
        <nav className="flex flex-1 flex-col px-5 pt-6 pb-5 overflow-y-auto">
          <div className="flex flex-col gap-2">
            {links.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white/90 hover:bg-white/10 transition-colors text-sm
                ${animateText ? "mobile-link-in block" : "mobile-link-out hidden"}`}
                style={{
                  animationDelay: animateText ? `${index * 70}ms` : "0ms",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {footerLinks.length > 0 ? (
            <div className="mt-5 pt-5 border-t border-white/10 flex flex-col gap-2">
              {footerLinks.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition-colors text-sm
                  ${animateText ? "mobile-link-in block" : "mobile-link-out hidden"}`}
                  style={{
                    animationDelay: animateText
                      ? `${(links.length + i) * 70}ms`
                      : "0ms",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}
        </nav>
      </div>
    </aside>,
    document.body
  );
}
