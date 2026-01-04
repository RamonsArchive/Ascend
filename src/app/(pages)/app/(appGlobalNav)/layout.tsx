import GlobalNav from "@/src/components/globalComponents/GlobalNav";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <GlobalNav />
      <main className="mt-[48px]">{children}</main>
    </>
  );
};

export default layout;
