import React from "react";
import { notFound } from "next/navigation";
import { BlockEdit } from "@/features/blocks/components/block-edit";
import { getBlockById } from "@/features/admin/lib/blocks";

type EditBlockPageProps = {
  params: Promise<{ academic_term_id: string; blockId: string }>;
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

const EditBlockPage = async ({ params, searchParams }: EditBlockPageProps) => {
  const [{ academic_term_id, blockId }, resolvedSearchParams] =
    await Promise.all([params, searchParams]);
  const block = await getBlockById(blockId);

  if (!block) {
    notFound();
  }

  const queryString = buildQueryString(resolvedSearchParams);

  return (
    <div className="flex-1 flex-col">
      <BlockEdit
        block={block}
        basePath={`/blocks/${academic_term_id}${queryString}`}
      />
    </div>
  );
};

export default EditBlockPage;
