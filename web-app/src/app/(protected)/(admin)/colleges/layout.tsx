import React from "react";
import { CollegesList } from "@/features/admin/components/college/colleges-list";
import { getCollegesList } from "@/features/admin/lib/colleges";

const DepartmentsLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const colleges = await getCollegesList();

  return (
    <div className="flex h-full overflow-hidden gap-4">
      <div className="flex-1 overflow-y-auto">
        <CollegesList colleges={colleges} />
      </div>

      {children}
    </div>
  );
};

export default DepartmentsLayout;
