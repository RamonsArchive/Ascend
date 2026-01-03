"use client";

import React from "react";
import {
  event_mobile_menu_footer_links,
  event_nav_links,
} from "@/src/constants/eventConstants/event_index";
import SlidingMobileMenu from "@/src/components/SlidingMobileMenu";
import { NavLink } from "@/src/lib/global_types";

const EventMobileMenu = ({
  isOpen,
  onClose,
  orgSlug,
  eventSlug,
  hasPermissions,
}: {
  isOpen: boolean;
  onClose: () => void;
  orgSlug: string;
  eventSlug: string;
  hasPermissions: boolean;
}) => {
  const links = event_nav_links(orgSlug, eventSlug, hasPermissions);
  const footerLinks = event_mobile_menu_footer_links(orgSlug);

  return (
    <SlidingMobileMenu
      isOpen={isOpen}
      onClose={onClose}
      title="Event"
      links={links as NavLink[]}
      footerLinks={footerLinks as NavLink[]}
    />
  );
};

export default EventMobileMenu;
