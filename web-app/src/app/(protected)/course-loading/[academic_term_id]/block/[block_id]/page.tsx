import { BlockClassTable } from "@/components/course-loading/block-class-table";
import { getClassesByBlockAndTerm } from "@/lib/course-loading/queries";

type BlockIdPageProps = {
  params: Promise<{ academic_term_id: string; block_id: string }>;
};

const BlockIdPage = async ({ params }: BlockIdPageProps) => {
  const { academic_term_id, block_id } = await params;
  const classRows = await getClassesByBlockAndTerm(block_id, academic_term_id);

  return (
    <div className="h-full overflow-hidden rounded-lg border">
      <BlockClassTable
        rows={classRows}
        academicTermId={academic_term_id}
        blockId={block_id}
      />
    </div>
  );
};

export default BlockIdPage;
