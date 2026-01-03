import GlobalNav from "@/src/components/globalComponents/GlobalNav";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <GlobalNav />
      {children}
    </>
  );
};

export default layout;
