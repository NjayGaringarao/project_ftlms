import React from "react";

const FacultyLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-full gap-4 overflow-hidden p-4">
      <div className="flex w-1/4 shrink-0 items-center justify-center rounded-lg border border-dashed p-4 text-sm text-foreground/70">
        Faculty list pane will be rendered here.
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

export default FacultyLayout;
