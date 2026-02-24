import React from "react";

const UniversityLayout = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex h-full flex-col">{children}</div>;
};

export default UniversityLayout;
