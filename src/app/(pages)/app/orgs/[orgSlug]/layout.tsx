import OrgNav from "@/src/components/orgComponents/OrgNav";
import React from "react";

const layout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) => {
  const { orgSlug } = await params;
  return (
    <>
      <OrgNav orgSlug={orgSlug} />
      {children}
    </>
  );
};

export default layout;
