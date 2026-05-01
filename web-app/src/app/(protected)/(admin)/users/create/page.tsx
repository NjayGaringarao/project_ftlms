import { UserCreate } from "@/features/admin/components/users/user-create";
import { getCampusesList } from "@/features/admin/lib/campuses";
import { getCollegesList } from "@/features/admin/lib/colleges";

const CreatePage = async () => {
  const [campuses, colleges] = await Promise.all([
    getCampusesList(),
    getCollegesList(),
  ]);

  return (
    <div className="flex w-2/3 flex-col">
      <UserCreate campuses={campuses} colleges={colleges} />
    </div>
  );
};

export default CreatePage;
