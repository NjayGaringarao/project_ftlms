"use client";

import { Briefcase } from "lucide-react";
import { ExtendedDesignation } from "@/models/designation";
import { Rank } from "@/models/academic_rank";
import { User } from "@/models/user";
import { SecurityActionCard } from "@/components/me/security/security-action-card";
import DesignationSection from "@/components/user/designation-section";

type ProfessionalDesignation = Omit<ExtendedDesignation, "user">;

type ProfessionalInformationProps = {
  user: User | null;
  rank: Rank | null;
  designations: ProfessionalDesignation[];
};

const ProfessionalInformation = ({
  user,
  rank,
  designations,
}: ProfessionalInformationProps) => {
  const employmentStatus = user?.employment_status ?? "Not set";
  const rankTitle = rank?.title ?? "Not set";

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
      </div>

      <p className="text-sm text-foreground/60">Designations</p>
      <div className="lg:max-h-96 overflow-auto">
        <DesignationSection mode="view" designations={designations} />
      </div>
    </SecurityActionCard>
  );
};

export default ProfessionalInformation;
