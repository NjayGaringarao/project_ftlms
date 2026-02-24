import React from "react";
import { DepartmentsList } from "@/components/university/departments-list";
import { getDepartmentsList } from "@/lib/university/departments";

const DepartmentsLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const departments = await getDepartmentsList();

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <DepartmentsList departments={departments} />
      </div>

      {children}
    </div>
  );
};

export default DepartmentsLayout;
