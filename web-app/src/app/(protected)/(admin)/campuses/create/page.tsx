import { CampusCreate } from "@/components/admin/campus-create";

const CreatePage = async () => {
  return (
    <div className="flex w-2/3 flex-col">
      <CampusCreate />
    </div>
  );
};

export default CreatePage;
