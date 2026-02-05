import UnderConstruction from "@/components/ui/under-construction";
import React from "react";

const UserPage = () => {
  return (
    <div className="h-full p-4">
      <UnderConstruction />
      <h1 className="text-3xl">Users Page</h1>
      <h2 className="mt-4">
        This page is only accessible to ADMIN users. With this page, admin will
        be allowed to:
      </h2>
      <ol className="flex-col p-2 text-foreground/80 list-disc list-inside">
        <li>Create User profile (name, role, employment status)</li>
        <li>Setup authentication (email and password)</li>
        <li>Assign and modify roles</li>
        <li>Delete user accounts</li>
      </ol>
    </div>
  );
};

export default UserPage;
