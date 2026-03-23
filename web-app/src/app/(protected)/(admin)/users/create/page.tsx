import { UserCreate } from "@/components/admin/users/user-create";
import { getCampusesList } from "@/lib/admin/campuses";
import { getCollegesList } from "@/lib/admin/colleges";

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
