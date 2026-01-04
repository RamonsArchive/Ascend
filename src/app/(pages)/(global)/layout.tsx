import React from "react";
import GlobalNav from "@/src/components/globalComponents/GlobalNav";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <GlobalNav />
      <main className="mt-[48px]">{children}</main>
    </>
  );
};

export default layout;
