import { getTermById } from "@/lib/admin/terms";
import { getCampusProposalInsightsBundle } from "@/lib/proposal/queries";
import { getCurrentUserData } from "@/lib/user-data/queries";
import CampusLoadInsights from "@/components/ftl-evaluation/shared/campus-load-insights";
import CampusProposalDetailsPanel from "@/components/ftl-evaluation/shared/campus-proposal-details-panel";
import CampusProposalControlActionPanel from "@/components/ftl-evaluation/campus-load/campus-proposal-control-action-panel";

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
      />

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3">
          <CampusProposalDetailsPanel
            academicTermCode={academicTermCode}
            campusCode={campusCode}
            campusName={campusName}
            campusProposal={campusProposal}
            members={members}
            evaluations={evaluations}
          />
        </div>
        <div className="col-span-2">
          <CampusProposalControlActionPanel
            academicTermId={academicTermId}
            campusId={campusId}
            campusCode={campusCode}
            campusName={campusName}
            campusProposal={campusProposal}
            approvedIndividuals={approvedIndividualCount}
            activeIndividuals={activeIndividualCount}
            hasCampusDirectorDesignation={!!campusDirectorDesignation}
          />
        </div>
      </div>
    </div>
  );
};

export default CampusProposalControlWorkspace;
