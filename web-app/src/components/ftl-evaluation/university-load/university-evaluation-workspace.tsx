import { getTermById } from "@/lib/admin/terms";
import { getCampusProposalInsightsBundle } from "@/lib/proposal/queries";
import { getCurrentUserData } from "@/lib/user-data/queries";
import CampusLoadInsights from "@/components/ftl-evaluation/shared/campus-load-insights";
import CampusProposalDetailsPanel from "@/components/ftl-evaluation/shared/campus-proposal-details-panel";
import UniversityProposalEvaluationActionPanel from "@/components/ftl-evaluation/university-load/university-proposal-evaluation-action-panel";

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
    getCampusProposalInsightsBundle(campusId, academicTermId),
    getCurrentUserData({ includeDesignations: true }),
    getTermById(academicTermId),
  ]);

  const {
    campusProposal,
    members,
    evaluations,
    etlAtlPerFaculty,
    latestIndividualProposals,
  } = bundle;
  const proposalFacultyIds = latestIndividualProposals.map((item) => item.user_id);
  const approvedFacultyIds = latestIndividualProposals
    .filter((item) => item.lifecycle_status === "APPROVED")
    .map((item) => item.user_id);

  const hasDfiDesignation = (currentUserData?.designations ?? []).some(
    (designation) => designation.job_title === "Director for Instruction",
  );
  const hasVpaaDesignation = (currentUserData?.designations ?? []).some(
    (designation) =>
      designation.job_title === "Vice President for Academic Affairs",
  );

  const academicTermCode = selectedTerm?.code ?? "Unknown term";

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4">
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-5">
        <div className="min-h-0 lg:col-span-2">
          <CampusLoadInsights
            etlAtlPerFaculty={etlAtlPerFaculty}
            proposalFacultyIds={proposalFacultyIds}
            approvedFacultyIds={approvedFacultyIds}
          />
        </div>

        <div className="min-h-0 lg:col-span-3">
          <CampusProposalDetailsPanel
            academicTermCode={academicTermCode}
            campusCode={campusCode}
            campusName={campusName}
            campusProposal={campusProposal}
            members={members}
            evaluations={evaluations}
          />
        </div>
      </div>

      <UniversityProposalEvaluationActionPanel
        campusProposal={campusProposal}
        evaluations={evaluations}
        hasDfiDesignation={hasDfiDesignation}
        hasVpaaDesignation={hasVpaaDesignation}
      />
    </div>
  );
};

export default UniversityEvaluationWorkspace;
