import FieldView from "@/components/ui/field-view";
import { AcademicRank } from "@/models/academic_rank";
import { EmploymentStatus } from "@/models/user";

type EmploymentInformationProps = {
  employmentStatus: EmploymentStatus | string | null;
  academicRank: AcademicRank | null;
};

const EmploymentInformation = ({
  employmentStatus,
  academicRank,
}: EmploymentInformationProps) => {
  const rank = academicRank?.title ?? "Not set";
  const status = employmentStatus ?? "Not set";

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">
        Employment Information
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldView label="Employment Status" value={status} />
        <FieldView label="Academic Rank" value={rank} />
      </div>
    </section>
  );
};

export default EmploymentInformation;
