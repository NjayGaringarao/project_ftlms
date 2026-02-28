import {
  getFacultyList,
  getProgramChairBootstrapData,
} from "@/lib/ftl/actions";
import ProgramChairPlanner from "./program-chair-planner";

const ProgramChairInterface = async () => {
  const [bootstrap, initialFaculty] = await Promise.all([
    getProgramChairBootstrapData(),
    getFacultyList(),
  ]);

  return (
    <div className="h-full overflow-hidden">
      <ProgramChairPlanner
        bootstrap={bootstrap}
        initialFaculty={initialFaculty}
      />
    </div>
  );
};

export default ProgramChairInterface;
