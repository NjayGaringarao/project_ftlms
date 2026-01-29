import UnderConstruction from "@/components/ui/under-construction";

const CampusPage = () => {
  return (
    <div className="h-full p-4">
      <UnderConstruction />
      <h1 className="text-3xl">Campus Page</h1>
      <h2 className="mt-4">
        This page is only accessible to ADMIN users. With this page, admin will
        be allowed to:
      </h2>
      <ol className="flex-col p-2 text-foreground/80">
        <li>- Create and Modify Campuses</li>
        <li>- Create and Modify Departments</li>
        <li>- Create and Modify Rooms for each campus</li>
        <li>- Create and Modify Colleges into each campus</li>
        <li>- Create, Modify, and Assign Courses into Colleges</li>
      </ol>
    </div>
  );
};

export default CampusPage;
