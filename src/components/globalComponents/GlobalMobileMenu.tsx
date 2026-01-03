"use client";

import React from "react";
import { nav_links } from "@/src/constants/globalConstants/global_index";
import SlidingMobileMenu from "@/src/components/SlidingMobileMenu";
import { NavLink } from "@/src/lib/global_types";

export default function GlobalMobileMenu({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <SlidingMobileMenu
      isOpen={isOpen}
      onClose={onClose}
      title="Navigation"
      links={nav_links as NavLink[]}
      widthClassName="w-[75%]"
    />
  );
}
