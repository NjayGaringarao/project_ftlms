import React from "react";
import { TermsList } from "@/components/admin/terms-list";
import { getTermsList } from "@/lib/admin/terms";

const TermsLayout = async ({ children }: { children: React.ReactNode }) => {
  const terms = await getTermsList();

  return (
    <div className="flex h-full overflow-hidden gap-4">
      <div className="flex-1 overflow-y-auto">
        <TermsList terms={terms} />
      </div>

      {children}
    </div>
  );
};

export default TermsLayout;
