import React from "react";
import { redirect } from "next/navigation";
import { CourseOfferingsList } from "@/components/admin/campus/course-offerings-list";
import { getCourseOfferingsByCampus } from "@/lib/admin/course-offerings";
import { getCampusById } from "@/lib/admin/campuses";

type CampusCourseOfferingsLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

const CampusCourseOfferingsLayout = async ({
  children,
  params,
}: CampusCourseOfferingsLayoutProps) => {
  const { id } = await params;
  const campus = await getCampusById(id);

  if (!campus) {
    redirect("/campuses");
  }

  const offerings = await getCourseOfferingsByCampus(id);
  const basePath = `/campuses/${id}/course-offerings`;

  return (
    <div className="flex h-full w-2/3 overflow-hidden gap-4">
      <div className="flex-1 overflow-y-auto">
        <CourseOfferingsList
          offerings={offerings}
          basePath={basePath}
          createPath={`${basePath}/create`}
        />
      </div>
      {children}
    </div>
  );
};

export default CampusCourseOfferingsLayout;
