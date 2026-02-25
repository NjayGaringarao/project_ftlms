import React from "react";
import { redirect } from "next/navigation";
import { ProgramOfferingsList } from "@/components/admin/program-offerings-list";
import { getProgramOfferingsByCampus } from "@/lib/admin/program-offerings";
import { getCampusById } from "@/lib/admin/campuses";

type CampusProgramOfferingsLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

const CampusProgramOfferingsLayout = async ({
  children,
  params,
}: CampusProgramOfferingsLayoutProps) => {
  const { id } = await params;
  const campus = await getCampusById(id);

  if (!campus) {
    redirect("/campuses");
  }

  const offerings = await getProgramOfferingsByCampus(id);
  const basePath = `/campuses/${id}/program-offerings`;

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <ProgramOfferingsList
          offerings={offerings}
          basePath={basePath}
          createPath={`${basePath}/create`}
        />
      </div>
      {children}
    </div>
  );
};

export default CampusProgramOfferingsLayout;
