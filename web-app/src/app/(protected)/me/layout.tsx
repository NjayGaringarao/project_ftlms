import { TopBarNav } from "@/components/ui/topbar-nav";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <TopBarNav
        title="Me"
        items={[
          { label: "Overview", href: "/me" },
          { label: "Profile", href: "/me/profile" },
          { label: "Teaching Load", href: "/me/teaching-load" },
          { label: "Security", href: "/me/security" },
        ]}
        icon="user"
      />
      <div className="flex flex-col h-full overflow-hidden">{children}</div>
    </div>
  );
};

export default layout;
