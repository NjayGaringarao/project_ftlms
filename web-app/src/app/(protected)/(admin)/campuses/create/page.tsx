import { CampusCreate } from "@/components/admin/campus/campus-create";

const CreatePage = async () => {
  return (
    <div className="flex w-1/3 flex-col">
      <CampusCreate />
    </div>
  );
};

export default CreatePage;
