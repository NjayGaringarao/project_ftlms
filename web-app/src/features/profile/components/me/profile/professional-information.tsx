"use client";

import { Briefcase } from "lucide-react";
import { ExtendedDesignation } from "@/features/shared/types/models/designation";
import { Rank } from "@/features/shared/types/models/academic_rank";
import { Campus } from "@/features/shared/types/models/campus";
import { College } from "@/features/shared/types/models/college";
import { User } from "@/features/shared/types/models/user";
import { SecurityActionCard } from "@/features/profile/components/me/security/security-action-card";
import DesignationSection from "@/features/shared/components/user/designation-section";

type ProfessionalDesignation = Omit<ExtendedDesignation, "user">;

type ProfessionalInformationProps = {
  user: User | null;
  rank: Rank | null;
  designations: ProfessionalDesignation[];
  campus: Campus | null;
  college: College | null;
};

const ProfessionalInformation = ({
  user,
  rank,
  designations,
  campus,
  college,
}: ProfessionalInformationProps) => {
  const employmentStatus = user?.employment_status ?? "Not set";
  const rankTitle = rank?.title ?? "Not set";
  const campusName = campus?.name ?? "Not set";
  const collegeName = college?.name ?? "Not set";

  return (
    <SecurityActionCard
      title="Professional Information"
      icon={Briefcase}
      infoTitle="Contact administrator"
      infoDescription="Professional information updates are managed by the admin. Please reach out to request changes."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-foreground/60">Academic Rank</p>
          <p className="font-medium">{rankTitle}</p>
        </div>

        <div>
          <p className="text-sm text-foreground/60">Employment Status</p>
          <p className="font-medium">{employmentStatus}</p>
        </div>

        <div>
          <p className="text-sm text-foreground/60">Campus</p>
          <p className="font-medium">{campusName}</p>
        </div>

        <div>
          <p className="text-sm text-foreground/60">College</p>
          <p className="font-medium">{collegeName}</p>
        </div>
      </div>

      <p className="text-sm text-foreground/60">Designations</p>
      <div className="lg:max-h-96 overflow-auto">
        <DesignationSection mode="view" designations={designations} />
      </div>
    </SecurityActionCard>
  );
};

export default ProfessionalInformation;
