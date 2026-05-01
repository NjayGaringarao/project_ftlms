import React from "react";
import { UsersList } from "@/features/admin/components/users/users-list";
import { getUsersList } from "@/features/admin/lib/users/users";

const UsersLayout = async ({ children }: { children: React.ReactNode }) => {
  const users = await getUsersList();

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 overflow-hidden gap-4">
        <div className="flex-1 overflow-y-auto">
          <UsersList users={users} />
        </div>

        {children}
      </div>
    </div>
  );
};

export default UsersLayout;
