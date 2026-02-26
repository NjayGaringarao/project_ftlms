import { redirect } from "next/navigation";
import { getUserById, getRanks } from "@/lib/users/users";
import { UserEditForm } from "@/components/admin/users/user-edit-form";

export const dynamic = "force-dynamic";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

const EditPage = async ({ params }: EditPageProps) => {
  const { id } = await params;
  const [user, ranks] = await Promise.all([getUserById(id), getRanks()]);

  if (!user) {
    redirect("/users");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <UserEditForm user={user} ranks={ranks} />{" "}
    </div>
  );
};

export default EditPage;
