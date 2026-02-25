import React from "react";
import { notFound } from "next/navigation";
import { BlockView } from "@/components/admin/block-view";
import { getBlockById } from "@/lib/admin/blocks";

type BlockPageProps = {
  params: Promise<{ id: string }>;
};

const BlockPage = async ({ params }: BlockPageProps) => {
  const { id } = await params;
  const block = await getBlockById(id);

  if (!block) {
    notFound();
  }

  return <BlockView block={block} />;
};

export default BlockPage;
