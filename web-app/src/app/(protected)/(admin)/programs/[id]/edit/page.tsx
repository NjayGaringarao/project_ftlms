import { redirect } from "next/navigation";
import { ProgramEdit } from "@/components/admin/program-edit";
import { getProgramById } from "@/lib/admin/programs";

export const dynamic = "force-dynamic";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

const EditPage = async ({ params }: EditPageProps) => {
  const { id } = await params;
  const program = await getProgramById(id);

  if (!program) {
    redirect("/programs");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <ProgramEdit program={program} />
    </div>
  );
};

export default EditPage;
