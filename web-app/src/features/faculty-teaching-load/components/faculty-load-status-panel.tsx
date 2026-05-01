import FacultyLoadStatus from "@/features/ftl-evaluation/components/faculty-load/faculty-load-status";
import {
  getEvaluationsByProposal,
  getLatestCampusLoadContextByFacultyProposal,
  getLatestProposalByUserTerm,
} from "@/features/ftl-evaluation/lib/load-proposal/queries";
import { getUserRole } from "@/features/auth/lib/utils";
import { getCurrentUserData } from "@/features/profile/lib/user-data/queries";
import type { ProposalLifecycleStatus, EvaluationStatus } from "@/features/shared/types/models";

type FacultyLoadStatusPanelProps = {
  academicTermId: string;
  facultyId: string;
  facultyCampusCode: string | null;
};

const resolveCampusDirectorStatus = (
  lifecycleStatus: ProposalLifecycleStatus,
  latestEvaluationStatus?: EvaluationStatus | null,
): EvaluationStatus | "INVALIDATED" => {
  if (lifecycleStatus === "INVALIDATED") return "INVALIDATED";
  if (latestEvaluationStatus === "APPROVED") return "APPROVED";
  if (latestEvaluationStatus === "REJECTED") return "REJECTED";
  if (lifecycleStatus === "APPROVED") return "APPROVED";
  if (lifecycleStatus === "REJECTED") return "REJECTED";
  return "PENDING";
};

const FacultyLoadStatusPanel = async ({
  academicTermId,
  facultyId,
  facultyCampusCode,
}: FacultyLoadStatusPanelProps) => {
  const [proposal, roles, currentUserData] = await Promise.all([
    getLatestProposalByUserTerm(facultyId, academicTermId),
    getUserRole(),
    getCurrentUserData({ includeDesignations: true }),
  ]);

  const canCreateProposal =
    roles.includes("Admin") ||
    roles.includes("Program Chairperson") ||
    roles.includes("College Dean");

  const evaluations = proposal
    ? await getEvaluationsByProposal(proposal.id)
    : [];
  const latestEvaluation = evaluations[0] ?? null;

  const linkedCampusContext = proposal
    ? await getLatestCampusLoadContextByFacultyProposal(proposal.id)
    : { campusLoad: null, evaluations: [] };

  const campusDirectorStatus = proposal
    ? resolveCampusDirectorStatus(
        proposal.lifecycle_status,
        latestEvaluation?.status ?? null,
      )
    : "PENDING";

  const matchingDesignation = proposal
    ? currentUserData?.designations.find(
        (designation: {
          job_title: string;
          campus: { code: string | null } | null;
        }) =>
          designation.job_title === "Campus Director" &&
          designation.campus?.code === facultyCampusCode,
      )
    : null;

  const canApprove =
    !!proposal &&
    proposal.lifecycle_status === "ACTIVE" &&
    !latestEvaluation &&
    !!matchingDesignation;

  const canRecreate =
    !!proposal &&
    canCreateProposal &&
    (proposal.lifecycle_status === "INVALIDATED" ||
      proposal.lifecycle_status === "REJECTED");

  return (
    <FacultyLoadStatus
      proposal={proposal}
      latestEvaluation={latestEvaluation}
      campusDirectorStatus={campusDirectorStatus}
      canEvaluateProposal={canApprove}
      linkedCampusLoad={linkedCampusContext.campusLoad}
      linkedCampusLoadEvaluations={linkedCampusContext.evaluations}
      academicTermId={academicTermId}
      facultyId={facultyId}
      canCreateProposal={canCreateProposal}
      canRecreateProposal={canRecreate}
    />
  );
};

export default FacultyLoadStatusPanel;
