import React from "react";
import { redirect } from "next/navigation";
import { MajorOfferingsList } from "@/components/admin/major-offerings-list";
import { getProgramOfferingById } from "@/lib/admin/program-offerings";
import { getMajorOfferingsByProgramOffering } from "@/lib/admin/major-offerings";

type CampusProgramMajorOfferingsLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string; offeringId: string }>;
};

const CampusProgramMajorOfferingsLayout = async ({
  children,
  params,
}: CampusProgramMajorOfferingsLayoutProps) => {
  const { id, offeringId } = await params;
  const offering = await getProgramOfferingById(offeringId);

  if (!offering || offering.campus_id !== id) {
    redirect(`/campuses/${id}/program-offerings`);
  }

  const majorOfferings = await getMajorOfferingsByProgramOffering(offeringId);
  const basePath = `/campuses/${id}/program-offerings/${offeringId}/major-offerings`;

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <MajorOfferingsList
          offerings={majorOfferings}
          basePath={basePath}
          createPath={`${basePath}/create`}
        />
      </div>
      {children}
    </div>
  );
};

export default CampusProgramMajorOfferingsLayout;
