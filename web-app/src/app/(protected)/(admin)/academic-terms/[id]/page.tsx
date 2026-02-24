import { redirect } from "next/navigation";
import { TermView } from "@/components/university/term-view";
import { getTermById } from "@/lib/university/terms";

export const dynamic = "force-dynamic";

type ViewPageProps = {
  params: Promise<{ id: string }>;
};

const ViewPage = async ({ params }: ViewPageProps) => {
  const { id } = await params;
  const term = await getTermById(id);

  if (!term) {
    redirect("/university/terms");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <TermView term={term} />
    </div>
  );
};

export default ViewPage;
