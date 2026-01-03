"use client";

import React from "react";
import {
  org_mobile_menu_footer_links,
  org_nav_links,
} from "@/src/constants/orgConstants/org_index";
import SlidingMobileMenu from "@/src/components/SlidingMobileMenu";
import { NavLink } from "@/src/lib/global_types";

const OrgMobileMenu = ({
  isOpen,
  onClose,
  orgSlug,
  hasPermissions,
}: {
  isOpen: boolean;
  onClose: () => void;
  orgSlug: string;
  hasPermissions: boolean;
}) => {
  const links = org_nav_links(orgSlug, hasPermissions);
  const footerLinks = org_mobile_menu_footer_links(orgSlug);

  return (
    <SlidingMobileMenu
      isOpen={isOpen}
      onClose={onClose}
      title="Organization"
      links={links as NavLink[]}
      footerLinks={footerLinks as NavLink[]}
    />
  );
};

export default OrgMobileMenu;
