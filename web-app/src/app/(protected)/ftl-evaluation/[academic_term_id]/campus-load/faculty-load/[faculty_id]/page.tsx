import { redirect } from "next/navigation";
import { getUserRole } from "@/features/auth/lib/utils";
import { getTermById } from "@/features/admin/lib/terms";
import {
  getEvaluationsByProposal,
  getLatestCampusLoadContextByFacultyProposal,
  getLatestProposalByUserTerm,
} from "@/features/ftl-evaluation/lib/load-proposal/queries";
import { getFacultyScheduleTermSnapshot } from "@/features/scheduler/lib/schedule/faculty-schedule";
import { getCurrentUserData } from "@/features/profile/lib/user-data/queries";
import { getUserOverviewById } from "@/features/profile/lib/user-overview";
import ProposalDetailedSummary from "@/features/ftl-evaluation/components/faculty-load/proposal-detailed-summary";
import FacultyEvaluationSchedule from "@/features/ftl-evaluation/components/faculty-load/faculty-evaluation-schedule";
import FacultyLoadStatus from "@/features/ftl-evaluation/components/faculty-load/faculty-load-status";
import type { EvaluationStatus, ProposalLifecycleStatus } from "@/features/shared/types/models";

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
  const [
    overview,
    roles,
    currentUserData,
    selectedTerm,
    proposal,
    scheduleSnapshot,
  ] = await Promise.all([
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
    type CampusScopedDesignation = {
      job_title: string;
      campus_id: string | null;
    };

    const allowedCampusIds = new Set(
      (currentUserData?.designations ?? [])
        .filter(
          (designation: CampusScopedDesignation) =>
            designation.job_title === "Campus Director" &&
            designation.campus_id,
        )
        .map(
          (designation: CampusScopedDesignation) =>
            designation.campus_id as string,
        ),
    );

    if (!overview.campus_id || !allowedCampusIds.has(overview.campus_id)) {
      redirect(`/ftl-evaluation/${academic_term_id}/campus-load/faculty-load`);
    }
  }

  const evaluations = proposal
    ? await getEvaluationsByProposal(proposal.id)
    : [];
  const latestEvaluation = evaluations[0] ?? null;
  const linkedCampusContext = proposal
    ? await getLatestCampusLoadContextByFacultyProposal(proposal.id)
    : { campusLoad: null, evaluations: [] };
  const campusDirectorDesignation = overview.campus_id
    ? (currentUserData?.designations ?? []).find(
        (designation: { job_title: string; campus_id: string | null }) =>
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
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <FacultyEvaluationSchedule scheduleSnapshot={scheduleSnapshot} />
        <FacultyLoadStatus
          proposal={proposal}
          latestEvaluation={latestEvaluation}
          campusDirectorStatus={campusDirectorStatus}
          canEvaluateProposal={canEvaluateProposal}
          linkedCampusLoad={linkedCampusContext.campusLoad}
          linkedCampusLoadEvaluations={linkedCampusContext.evaluations}
          academicTermId={academic_term_id}
          facultyId={faculty_id}
        />
      </div>
      <div className="flex flex-col w-94 overflow-hidden">
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
