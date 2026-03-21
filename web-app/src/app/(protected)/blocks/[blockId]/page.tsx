import React from "react";
import { notFound } from "next/navigation";
import { BlockView } from "@/components/blocks/block-view";
import { getBlockById } from "@/lib/admin/blocks";

type BlockPageProps = {
  params: Promise<{ blockId: string }>;
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

const BlockPage = async ({ params, searchParams }: BlockPageProps) => {
  const [{ blockId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const block = await getBlockById(blockId);

  if (!block) {
    notFound();
  }

  const academicTermId =
    block.academic_term_id ?? block.academic_term?.id ?? null;

  const queryString = buildQueryString(resolvedSearchParams);

  return (
    <div className="flex-1 flex-col">
      <BlockView
        block={block}
        academicTermId={academicTermId}
        basePath={`/blocks${queryString}`}
      />
    </div>
  );
};

export default BlockPage;
