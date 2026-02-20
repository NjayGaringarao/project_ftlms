import React from "react";
import { RanksList } from "@/components/university/ranks-list";
import { getUniversityRanksList } from "@/lib/university/ranks";

const RanksLayout = async ({ children }: { children: React.ReactNode }) => {
  const ranks = await getUniversityRanksList();

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <RanksList ranks={ranks} />
      </div>

      {children}
    </div>
  );
};

export default RanksLayout;
