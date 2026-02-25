import React from "react";
import { ProgramOfferingsList } from "@/components/admin/program-offerings-list";
import { getProgramOfferingsList } from "@/lib/admin/program-offerings";

const ProgramOfferingsLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const offerings = await getProgramOfferingsList();

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <ProgramOfferingsList offerings={offerings} />
      </div>
      {children}
    </div>
  );
};

export default ProgramOfferingsLayout;
