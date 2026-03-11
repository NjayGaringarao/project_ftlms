import { redirect } from "next/navigation";
import { getTermsList } from "@/lib/admin/terms";

const CourseLoadingPage = async () => {
  const terms = await getTermsList();

  if (terms.length > 0) {
    redirect(`/course-loading/${terms[0].id}`);
  }

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-lg border border-dashed p-6 text-center">
        <h1 className="text-lg font-semibold">Course Loading</h1>
        <p className="mt-2 text-sm text-foreground/70">
          No academic terms are available yet. Create or activate a term before
          using course loading.
        </p>
      </div>
    </div>
  );
};

export default CourseLoadingPage;