import { getTermById } from "@/lib/admin/terms";
import { getCampusProposalInsightsBundle } from "@/lib/proposal/queries";
import { getCurrentUserData } from "@/lib/user-data/queries";
import CampusLoadInsights from "@/components/ftl-evaluation/shared/campus-load-insights";
import CampusProposalDetailsPanel from "@/components/ftl-evaluation/shared/campus-proposal-details-panel";

type CampusProposalControlWorkspaceProps = {
  academicTermId: string;
  campusId: string;
  campusCode: string;
  campusName: string;
};

const CampusProposalControlWorkspace = async ({
  academicTermId,
  campusId,
  campusCode,
  campusName,
}: CampusProposalControlWorkspaceProps) => {
  const [bundle, currentUserData, selectedTerm] = await Promise.all([
    getCampusProposalInsightsBundle(campusId, academicTermId),
    getCurrentUserData({ includeDesignations: true }),
    getTermById(academicTermId),
  ]);

  const {
    campusProposal,
    members,
    evaluations,
    etlAtlPerFaculty,
    approvedIndividualCount,
    activeIndividualCount,
    latestIndividualProposals,
  } = bundle;
  const academicTermCode = selectedTerm?.code ?? "Unknown term";
  const proposalFacultyIds = latestIndividualProposals.map((item) => item.user_id);
  const approvedFacultyIds = latestIndividualProposals
    .filter((item) => item.lifecycle_status === "APPROVED")
    .map((item) => item.user_id);

  const campusDirectorDesignation = (currentUserData?.designations ?? []).find(
    (designation) =>
      designation.job_title === "Campus Director" &&
      designation.campus_id === campusId,
  );

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

      <CampusProposalDetailsPanel
        campusProposal={campusProposal}
        members={members}
        evaluations={evaluations}
        control={{
          academicTermId,
          campusId,
          hasCampusDirectorDesignation: !!campusDirectorDesignation,
          approvedIndividuals: approvedIndividualCount,
          activeIndividuals: activeIndividualCount,
        }}
      />
    </div>
  );
};

export default CampusProposalControlWorkspace;
