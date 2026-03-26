import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth/utils";
import { getTermById } from "@/lib/admin/terms";
import {
  getEvaluationsByProposal,
  getLatestProposalByUserTerm,
} from "@/lib/faculty-load/queries";
import { getFacultyScheduleTermSnapshot } from "@/lib/schedule/faculty-schedule";
import { getCurrentUserData } from "@/lib/user-data/queries";
import { getUserOverviewById } from "@/lib/user-overview";
import ProposalDetailedSummary from "@/components/ftl-evaluation/faculty-load/proposal-detailed-summary";
import FacultyEvaluationSchedule from "@/components/ftl-evaluation/faculty-load/faculty-evaluation-schedule";
import FacultyLoadApproval from "@/components/ftl-evaluation/faculty-load/faculty-load-approval";
import type { EvaluationStatus, ProposalLifecycleStatus } from "@/models";

type CampusFacultyEvaluationPageProps = {
  params: Promise<{ academic_term_id: string; faculty_id: string }>;
};

const resolveCampusDirectorStatus = (
  proposalStatus: ProposalLifecycleStatus,
  latestEvaluationStatus?: EvaluationStatus | null,
): EvaluationStatus | "INVALIDATED" => {
  if (proposalStatus === "INVALIDATED") return "INVALIDATED";
  if (latestEvaluationStatus === "APPROVED") return "APPROVED";
  if (latestEvaluationStatus === "REJECTED") return "REJECTED";
  if (proposalStatus === "APPROVED") return "APPROVED";
  if (proposalStatus === "REJECTED") return "REJECTED";
  return "PENDING";
};

const CampusFacultyEvaluationPage = async ({
  params,
}: CampusFacultyEvaluationPageProps) => {
  const { academic_term_id, faculty_id } = await params;
  const [overview, roles, currentUserData, selectedTerm, proposal, scheduleSnapshot] =
    await Promise.all([
      getUserOverviewById(faculty_id),
      getUserRole(),
      getCurrentUserData({ includeDesignations: true }),
      getTermById(academic_term_id),
      getLatestProposalByUserTerm(faculty_id, academic_term_id),
      getFacultyScheduleTermSnapshot(faculty_id, academic_term_id),
    ]);

  if (!overview) {
    redirect(`/ftl-evaluation/${academic_term_id}/campus-load/faculty-load`);
  }

  const canManageAll = roles.includes("Admin");
  if (!canManageAll) {
    const allowedCampusIds = new Set(
      (currentUserData?.designations ?? [])
        .filter(
          (designation) =>
            designation.job_title === "Campus Director" &&
            designation.campus_id,
        )
        .map((designation) => designation.campus_id as string),
    );

    if (!overview.campus_id || !allowedCampusIds.has(overview.campus_id)) {
      redirect(`/ftl-evaluation/${academic_term_id}/campus-load/faculty-load`);
    }
  }

  const evaluations = proposal ? await getEvaluationsByProposal(proposal.id) : [];
  const latestEvaluation = evaluations[0] ?? null;
  const campusDirectorDesignation = overview.campus_id
    ? (currentUserData?.designations ?? []).find(
        (designation) =>
          designation.job_title === "Campus Director" &&
          designation.campus_id === overview.campus_id,
      )
    : null;

  const canEvaluateProposal =
    !!proposal &&
    proposal.lifecycle_status === "ACTIVE" &&
    !latestEvaluation &&
    !!campusDirectorDesignation;

  const campusDirectorStatus = proposal
    ? resolveCampusDirectorStatus(
        proposal.lifecycle_status,
        latestEvaluation?.status ?? null,
      )
    : "PENDING";
  const academicTermCode = selectedTerm?.code ?? "Unknown term";

  return (
    <div className="flex flex-row gap-4 h-full">
      <div className="min-h-0 flex flex-col gap-4">
        <div className="min-h-0 flex-1 overflow-hidden">
          <FacultyEvaluationSchedule scheduleSnapshot={scheduleSnapshot} />
        </div>
        <FacultyLoadApproval
          proposal={proposal}
          latestEvaluation={latestEvaluation}
          campusDirectorStatus={campusDirectorStatus}
          canEvaluateProposal={canEvaluateProposal}
        />
      </div>

      <div className="min-h-0 w-84 overflow-hidden">
        <ProposalDetailedSummary
          overview={overview}
          academicTermCode={academicTermCode}
          proposal={proposal}
        />
      </div>
    </div>
  );
};

export default CampusFacultyEvaluationPage;
