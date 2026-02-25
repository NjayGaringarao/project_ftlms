import { redirect } from "next/navigation";
import { ProgramView } from "@/components/admin/program-view";
import { getProgramById } from "@/lib/admin/programs";

export const dynamic = "force-dynamic";

type ViewPageProps = {
  params: Promise<{ id: string }>;
};

const ViewPage = async ({ params }: ViewPageProps) => {
  const { id } = await params;
  const program = await getProgramById(id);

  if (!program) {
    redirect("/programs");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <ProgramView program={program} />
    </div>
  );
};

export default ViewPage;
