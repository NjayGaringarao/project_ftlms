import { TopBarNav } from "@/components/me/topbar-nav";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <TopBarNav
        title="Me"
        items={[
          { label: "Overview", href: "/me/" },
          { label: "Profile", href: "/me/profile" },
          { label: "Schedule", href: "/me/schedule" },
          { label: "Security", href: "/me/security" },
        ]}
      />
      <div className="flex flex-col h-full overflow-hidden">{children}</div>
    </div>
  );
};

export default layout;
