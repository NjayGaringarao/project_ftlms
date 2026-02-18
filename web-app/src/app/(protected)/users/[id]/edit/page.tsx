import { redirect } from "next/navigation";
import { getUserById } from "@/lib/users/users";
import { UserEditForm } from "@/components/users/user-edit-form";

export const dynamic = "force-dynamic";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

const EditPage = async ({ params }: EditPageProps) => {
  const { id } = await params;
  const user = await getUserById(id);

  if (!user) {
    redirect("/users");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <UserEditForm user={user} />{" "}
    </div>
  );
};

export default EditPage;
