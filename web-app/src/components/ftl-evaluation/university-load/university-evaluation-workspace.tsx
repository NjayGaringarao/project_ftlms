import { getTermById } from "@/lib/admin/terms";
import { getCampusLoadInsightsBundle } from "@/lib/load-proposal/queries";
import { getCurrentUserData } from "@/lib/user-data/queries";
import CampusLoadInsights from "@/components/ftl-evaluation/shared/campus-load-insights";
import CampusLoadStatus from "@/components/ftl-evaluation/shared/campus-load-status";

type UniversityEvaluationWorkspaceProps = {
  academicTermId: string;
  campusId: string;
  campusCode: string;
  campusName: string;
};

const UniversityEvaluationWorkspace = async ({
  academicTermId,
  campusId,
  campusCode,
  campusName,
}: UniversityEvaluationWorkspaceProps) => {
  const [bundle, currentUserData, selectedTerm] = await Promise.all([
    getCampusLoadInsightsBundle(campusId, academicTermId),
    getCurrentUserData({ includeDesignations: true }),
    getTermById(academicTermId),
  ]);

  const {
    campusLoad,
    evaluations,
    etlAtlPerFaculty,
    latestIndividualProposals,
  } = bundle;
  const proposalFacultyIds = latestIndividualProposals.map(
    (item) => item.user_id,
  );
  const approvedFacultyIds = latestIndividualProposals
    .filter((item) => item.lifecycle_status === "APPROVED")
    .map((item) => item.user_id);

  const hasDiDesignation = (currentUserData?.designations ?? []).some(
    (designation) => designation.job_title === "Director for Instruction",
  );
  const hasVpaaDesignation = (currentUserData?.designations ?? []).some(
    (designation) =>
      designation.job_title === "Vice President for Academic Affairs",
  );

  const academicTermCode = selectedTerm?.code ?? "Unknown term";

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4">
      <CampusLoadInsights
        etlAtlPerFaculty={etlAtlPerFaculty}
        proposalFacultyIds={proposalFacultyIds}
        approvedFacultyIds={approvedFacultyIds}
        campusCode={campusCode}
        campusName={campusName}
        academicTermCode={academicTermCode}
      />

      <CampusLoadStatus
        campusLoad={campusLoad}
        evaluations={evaluations}
        evaluationControl={{
          hasDiDesignation,
          hasVpaaDesignation,
        }}
      />
    </div>
  );
};

export default UniversityEvaluationWorkspace;
