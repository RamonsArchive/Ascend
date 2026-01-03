import React from "react";
import EventNav from "@/src/components/eventComponents/EventNav";
import { assertEventAdminOrOwner } from "@/src/actions/event_actions";
import { getCachedSession } from "@/src/lib/cached-auth";

const layout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string; eventSlug: string }>;
}) => {
  const { orgSlug, eventSlug } = await params;
  const session = await getCachedSession();
  const userId = session?.user?.id ?? "";
  const isLoggedIn = !!userId;
  let hasPermissions = false;
  if (isLoggedIn) {
    const prems = await assertEventAdminOrOwner(orgSlug, eventSlug, userId);
    if (prems.status === "SUCCESS") {
      hasPermissions = true;
    }
  }
  return (
    <>
      <EventNav
        orgSlug={orgSlug}
        eventSlug={eventSlug}
        hasPermissions={hasPermissions}
      />
      {children}
    </>
  );
};

export default layout;
