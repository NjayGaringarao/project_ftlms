import React from "react";

type MapperLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ academic_term_id: string }>;
};

const MapperLayout = async ({ children }: MapperLayoutProps) => {
  return (
    <div className="flex w-full h-full overflow-hidden p-4">
      <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

export default MapperLayout;
