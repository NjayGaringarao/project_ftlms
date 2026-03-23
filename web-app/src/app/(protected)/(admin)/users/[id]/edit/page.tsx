import { redirect } from "next/navigation";
import { getUserById, getRanks } from "@/lib/users/users";
import { getCampusesList } from "@/lib/admin/campuses";
import { getCollegesList } from "@/lib/admin/colleges";
import { UserEdit } from "@/components/admin/users/user-edit";

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
