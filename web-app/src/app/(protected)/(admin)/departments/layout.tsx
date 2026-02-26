import React from "react";
import { DepartmentsList } from "@/components/admin/departments-list";
import { getDepartmentsList } from "@/lib/admin/departments";

const DepartmentsLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const departments = await getDepartmentsList();

  return (
    <div className="flex h-full overflow-hidden gap-4">
      <div className="flex-1 overflow-y-auto">
        <DepartmentsList departments={departments} />
      </div>

      {children}
    </div>
  );
};

export default DepartmentsLayout;
