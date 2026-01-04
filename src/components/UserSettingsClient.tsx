"use client";

import React from "react";
import type { SettingsTab, UserDataSettings } from "@/src/lib/global_types";
import SettingsClient from "@/src/components/SettingsClient";
import EditUserProfileSection from "@/src/components/EditUserProfileSection";
import AccountSettingsSection from "@/src/components/AccountSettingsSection";

type UserSettingsView = "PROFILE" | "ACCOUNT";

const tabs: Array<SettingsTab<UserSettingsView>> = [
  {
    key: "PROFILE",
    label: "Profile",
    description: "Name, links, images, and bio.",
  },
  {
    key: "ACCOUNT",
    label: "Account",
    description: "Danger zone: delete your account.",
  },
];

const UserSettingsClient = ({ userData }: { userData: UserDataSettings }) => {
  const sections = [
    {
      key: "PROFILE" as const,
      render: () => <EditUserProfileSection userData={userData} />,
    },
    {
      key: "ACCOUNT" as const,
      render: () => <AccountSettingsSection userEmail={userData.email} />,
    },
  ];

  return (
    <SettingsClient initialView="PROFILE" tabs={tabs} sections={sections} />
  );
};

export default UserSettingsClient;
