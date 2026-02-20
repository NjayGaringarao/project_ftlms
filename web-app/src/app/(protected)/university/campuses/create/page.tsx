import { CampusCreateForm } from "@/components/university/campus-create-form";
import { getDirectorOptions } from "@/lib/university/campuses";

const CreatePage = async () => {
  const directors = await getDirectorOptions();

  return (
    <div className="flex w-2/3 flex-col">
      <CampusCreateForm directors={directors} />
    </div>
  );
};

export default CreatePage;
