import { UserSummaryCard } from "@/components/users/user-summary-card";
import { getUserById } from "@/lib/users/users";

export const dynamic = "force-dynamic";

type UserPageProps = {
  params: Promise<{ id: string }>;
};

const UserPage = async ({ params }: UserPageProps) => {
  const { id } = await params;
  const user = await getUserById(id);

  return (
    <div className="flex w-1/2 flex-col">
      <UserSummaryCard user={user} />
    </div>
  );
};

export default UserPage;
