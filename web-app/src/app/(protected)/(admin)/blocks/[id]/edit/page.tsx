import React from "react";
import { notFound } from "next/navigation";
import { BlockEdit } from "@/components/admin/campus/block-edit";
import { getBlockById } from "@/lib/admin/blocks";

type EditBlockPageProps = {
  params: Promise<{ id: string }>;
};

const EditBlockPage = async ({ params }: EditBlockPageProps) => {
  const { id } = await params;
  const block = await getBlockById(id);

  if (!block) {
    notFound();
  }

  return <BlockEdit block={block} />;
};

export default EditBlockPage;
