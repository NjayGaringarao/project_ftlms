import React from "react";
import { MajorOfferingsList } from "@/components/admin/major-offerings-list";
import { getMajorOfferingsList } from "@/lib/admin/major-offerings";

const MajorOfferingsLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const offerings = await getMajorOfferingsList();

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <MajorOfferingsList offerings={offerings} />
      </div>
      {children}
    </div>
  );
};

export default MajorOfferingsLayout;
