import { redirect } from "next/navigation";
import { getUserById } from "@/lib/users/users";
import { UserView } from "@/components/users/user-view";

export const dynamic = "force-dynamic";

type ViewPageProps = {
  params: Promise<{ id: string }>;
};

const ViewPage = async ({ params }: ViewPageProps) => {
  const { id } = await params;
  const user = await getUserById(id);

  if (!user) {
    redirect("/users");
  }

  return (
    <div className="flex w-2/3 flex-col">
      <UserView user={user} />;
    </div>
  );
};

export default ViewPage;
