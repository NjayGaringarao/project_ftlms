import { redirect } from "next/navigation";
import { getTermsList } from "@/features/admin/lib/terms";

const BlocksPage = async () => {
  const terms = await getTermsList();
  if (terms.length > 0) {
    redirect(`/blocks/${terms[0].id}`);
  }
  return (
    <div className="flex flex-1 h-full items-center justify-center p-6">
      <div className="w-full max-w-3xl rounded-lg border border-dashed p-6">
        <h1 className="text-lg font-semibold">Block Management</h1>
        <p className="mt-2 text-sm text-foreground/70">
          Create an academic term to begin managing blocks.
        </p>
      </div>
    </div>
  );
};

export default BlocksPage;
