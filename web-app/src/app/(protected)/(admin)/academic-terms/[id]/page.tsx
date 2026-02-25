import { redirect } from "next/navigation";
import { TermView } from "@/components/admin/term-view";
import { getTermById } from "@/lib/admin/terms";

export const dynamic = "force-dynamic";

type ViewPageProps = {
  params: Promise<{ id: string }>;
};

const ViewPage = async ({ params }: ViewPageProps) => {
  const { id } = await params;
  const term = await getTermById(id);

  if (!term) {
    redirect("/academic-terms");
  }

  return (
    <div className="flex w-1/3 flex-col">
      <TermView term={term} />
    </div>
  );
};

export default ViewPage;
