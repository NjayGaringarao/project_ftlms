import FacultyLoadApproval from "@/components/ftl-evaluation/faculty-load/faculty-load-approval";
import {
  getEvaluationsByProposal,
  getLatestProposalByUserTerm,
} from "@/lib/proposal/queries";
import { getUserRole } from "@/lib/auth/utils";
import { getCurrentUserData } from "@/lib/user-data/queries";
import type { ProposalLifecycleStatus, EvaluationStatus } from "@/models";

type FacultyLoadStatusProps = {
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

const FacultyLoadStatus = async ({
  academicTermId,
  facultyId,
  facultyCampusCode,
}: FacultyLoadStatusProps) => {
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

  const campusDirectorStatus = proposal
    ? resolveCampusDirectorStatus(
        proposal.lifecycle_status,
        latestEvaluation?.status ?? null,
      )
    : "PENDING";

  const matchingDesignation = proposal
    ? currentUserData?.designations.find(
        (designation) =>
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
    <FacultyLoadApproval
      proposal={proposal}
      latestEvaluation={latestEvaluation}
      campusDirectorStatus={campusDirectorStatus}
      canEvaluateProposal={canApprove}
      academicTermId={academicTermId}
      facultyId={facultyId}
      canCreateProposal={canCreateProposal}
      canRecreateProposal={canRecreate}
    />
  );
};

export default FacultyLoadStatus;

