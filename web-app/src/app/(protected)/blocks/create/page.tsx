import React from "react";
import { BlockCreate } from "@/components/blocks/block-create";

type CreateBlockPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const buildQueryString = (
  searchParams: Record<string, string | string[] | undefined>,
) => {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else {
      params.set(key, value);
    }
  });
  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

const CreateBlockPage = async ({ searchParams }: CreateBlockPageProps) => {
  const resolvedSearchParams = await searchParams;
  const queryString = buildQueryString(resolvedSearchParams);
  const campusId = resolvedSearchParams.campus_id;
  const fixedCampusId =
    typeof campusId === "string" && campusId.trim() ? campusId : undefined;

  return (
    <div className="flex-1 flex-col">
      <BlockCreate
        basePath={`/blocks${queryString}`}
        fixedCampusId={fixedCampusId}
      />
    </div>
  );
};

export default CreateBlockPage;
