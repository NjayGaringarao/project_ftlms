import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex flex-col h-full overflow-hidden">{children}</div>
    </div>
  );
};

export default layout;
