import React from "react";
import { redirect } from "next/navigation";
import { BlocksList } from "@/components/admin/campus/blocks-list";
import { getBlocksByCampus } from "@/lib/admin/blocks";
import { getCampusById } from "@/lib/admin/campuses";

type CampusBlocksLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

const CampusBlocksLayout = async ({
  children,
  params,
}: CampusBlocksLayoutProps) => {
  const { id } = await params;
  const campus = await getCampusById(id);

  if (!campus) {
    redirect("/campuses");
  }

  const blocks = await getBlocksByCampus(id);
  const basePath = `/campuses/${id}/blocks`;

  return (
    <div className="flex h-full w-2/3 overflow-hidden gap-4">
      <div className="flex-1 overflow-y-auto">
        <BlocksList
          blocks={blocks}
          basePath={basePath}
          createPath={`${basePath}/create`}
        />
      </div>
      {children}
    </div>
  );
};

export default CampusBlocksLayout;
