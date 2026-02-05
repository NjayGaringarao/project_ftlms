import UnderConstruction from "@/components/ui/under-construction";

const MePage = () => {
  return (
    <div className="h-full p-4">
      <UnderConstruction />
      <h1 className="text-3xl">Me Page</h1>
      <h2 className="mt-4">
        This page is accessible to all users. With this page, the user will be
        allowed to:
      </h2>
      <ol className="flex-col p-2 text-foreground/80 list-disc list-inside">
        <li>View and update personal profile information</li>
        <li>Change password and password</li>
        <li>View allocated and approved faculty teaching load to this user</li>
      </ol>
    </div>
  );
};

export default MePage;
