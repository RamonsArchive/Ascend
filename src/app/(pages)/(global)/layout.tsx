import React from "react";
import GlobalNav from "@/src/components/globalComponents/GlobalNav";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <GlobalNav />
      {children}
    </>
  );
};

export default layout;
