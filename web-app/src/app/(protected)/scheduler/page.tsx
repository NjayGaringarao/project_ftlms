import { getTermsList } from "@/lib/admin/terms";
import { redirect } from "next/navigation";

const SchedulerPage = async () => {
  const terms = await getTermsList();

  if (terms.length > 0) {
    redirect(`/scheduler/${terms[0].id}`);
  }

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-lg border border-dashed p-6 text-center">
        <h1 className="text-lg font-semibold">Scheduler</h1>
        <p className="mt-2 text-sm text-foreground/70">
          No academic terms are available yet. Create or activate a term before
          using scheduler.
        </p>
      </div>
    </div>
  );
};

export default SchedulerPage;
