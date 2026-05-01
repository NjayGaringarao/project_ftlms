import { redirect } from "next/navigation";
import { getTermsList } from "@/features/admin/lib/terms";
import { getUserRole } from "@/features/auth/lib/utils";

const FacultyTeachingLoadPage = async () => {
  const roles = await getUserRole();
  const canAccess =
    roles.includes("Admin") ||
    roles.includes("Program Chairperson") ||
    roles.includes("College Dean");

  if (!canAccess) {
    redirect("/home");
  }

  const terms = await getTermsList();

  if (terms.length > 0) {
    redirect(`/faculty-teaching-load/${terms[0].id}`);
  }

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-lg border border-dashed p-6 text-center">
        <h1 className="text-lg font-semibold">Faculty Teaching Load</h1>
        <p className="mt-2 text-sm text-foreground/70">
          No academic terms are available yet. Create or activate a term before
          using faculty teaching load.
        </p>
      </div>
    </div>
  );
};

export default FacultyTeachingLoadPage;
