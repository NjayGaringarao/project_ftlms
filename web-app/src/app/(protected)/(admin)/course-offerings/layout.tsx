import React from "react";
import { CourseOfferingsList } from "@/components/admin/course-offerings-list";
import { getCourseOfferingsList } from "@/lib/admin/course-offerings";

const CourseOfferingsLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const offerings = await getCourseOfferingsList();

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <CourseOfferingsList offerings={offerings} />
      </div>
      {children}
    </div>
  );
};

export default CourseOfferingsLayout;
