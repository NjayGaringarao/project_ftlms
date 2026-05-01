import React from "react";
import { RanksList } from "@/features/admin/components/academic-rank/ranks-list";
import { getUniversityRanksList } from "@/features/admin/lib/ranks";

const RanksLayout = async ({ children }: { children: React.ReactNode }) => {
  const ranks = await getUniversityRanksList();

  return (
    <div className="flex h-full overflow-hidden gap-4">
      <div className="flex-1 overflow-y-auto">
        <RanksList ranks={ranks} />
      </div>
      {children}
    </div>
  );
};

export default RanksLayout;
