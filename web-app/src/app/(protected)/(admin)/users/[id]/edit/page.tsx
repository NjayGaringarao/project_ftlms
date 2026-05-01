import { redirect } from "next/navigation";
import { getUserById, getRanks } from "@/features/admin/lib/users/users";
import { getCampusesList } from "@/features/admin/lib/campuses";
import { getCollegesList } from "@/features/admin/lib/colleges";
import { UserEdit } from "@/features/admin/components/users/user-edit";

export const dynamic = "force-dynamic";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

const EditPage = async ({ params }: EditPageProps) => {
  const { id } = await params;
  const [user, ranks, campuses, colleges] = await Promise.all([
    getUserById(id),
    getRanks(),
    getCampusesList(),
    getCollegesList(),
  ]);

  if (!user) {
    redirect("/users");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <UserEdit user={user} ranks={ranks} campuses={campuses} colleges={colleges} />
    </div>
  );
};

export default EditPage;
