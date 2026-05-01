import DegreeListItem from "@/features/shared/components/user/degree-list-item";
import { Degree } from "@/features/shared/types/models/degree";

type EducationInformationProps = {
  degrees: Degree[];
};

const EducationInformation = ({ degrees }: EducationInformationProps) => {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">
        Education
      </h2>

      {degrees.length === 0 ? (
        <p className="text-sm text-foreground/60">No degree on file.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {degrees.map((degree) => (
            <DegreeListItem key={degree.id} degree={degree} />
          ))}
        </div>
      )}
    </section>
  );
};

export default EducationInformation;
