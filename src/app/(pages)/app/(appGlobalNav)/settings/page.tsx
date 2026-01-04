import React from "react";
import { getCachedSession } from "@/src/lib/cached-auth";
import { redirect } from "next/navigation";
import {
  fetchUserDataSettings,
  assertValidUser,
} from "@/src/actions/user_actions";
import Link from "next/link";
import UserSettingsHero from "@/src/components/UserSettingsHero";
import UserSettingsClient from "@/src/components/UserSettingsClient";
import type { UserDataSettings } from "@/src/lib/global_types";

const UserSettingsPage = async () => {
  const session = await getCachedSession();
  if (!session?.user?.id) redirect(`/login?next=/app/settings`);

  const perms = await assertValidUser();
  if (perms.status === "ERROR") {
    return (
      <div className="relative w-full min-h-[calc(100vh-48px)]">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
          <div className="text-white text-xl font-semibold">Error</div>
          <div className="text-white/70 text-sm leading-relaxed">
            Failed to assert valid user
          </div>
          <Link href="/app" className="text-white/70 text-sm leading-relaxed">
            Back to app dashboard
          </Link>
        </div>
      </div>
    );
  }

  const userDataRes = await fetchUserDataSettings();
  if (userDataRes.status === "ERROR" || !userDataRes.data) {
    return (
      <div className="relative w-full min-h-[calc(100vh-48px)]">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
          <div className="text-white text-xl font-semibold">Error</div>
          <div className="text-white/70 text-sm leading-relaxed">
            Failed to fetch user data settings
          </div>
          <Link href="/app" className="text-white/70 text-sm leading-relaxed">
            Back to app dashboard
          </Link>
        </div>
      </div>
    );
  }

  const userData = userDataRes.data as UserDataSettings;

  return (
    <div className="relative w-full min-h-[calc(100vh-48px)]">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <UserSettingsHero
          createdAt={userData.createdAt}
          updatedAt={userData.updatedAt}
        />
        <UserSettingsClient userData={userData} />
      </div>
    </div>
  );
};

export default UserSettingsPage;
