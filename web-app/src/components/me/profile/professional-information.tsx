"use client";

import { Briefcase, WeightTilde } from "lucide-react";
import { ExtendedDesignation } from "@/models/designation";
import { Rank } from "@/models/academic_rank";
import { User } from "@/models/user";
import { SecurityActionCard } from "@/components/me/security/security-action-card";

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
        {designations.length === 0 ? (
          <p className="text-sm text-foreground/60 mt-1">
            No designations on file.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {designations.map((designation) => (
              <div
                key={designation.id}
                className="border border-border rounded-lg p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{designation.job_title}</p>
                    {designation.college?.name && (
                      <p className="text-sm text-foreground/60">
                        {designation.college.name}
                      </p>
                    )}

                    {designation.program?.name && (
                      <p className="text-sm text-foreground/60">
                        {designation.program.name}
                      </p>
                    )}

                    {designation.program_offering && (
                      <>
                        <p className="text-sm text-foreground/60">
                          {designation.program_offering.program.name}
                        </p>
                        <p className="text-sm text-foreground/60">
                          {designation.program_offering.campus.name} Campus
                        </p>
                      </>
                    )}

                    {designation.campus?.name && (
                      <p className="text-sm text-foreground/60">
                        {designation.campus.name} Campus
                      </p>
                    )}
                  </div>
                  {designation.load !== null && (
                    <div className="text-base text-foreground/60 flex flex-row items-center gap-1">
                      <p>{designation.load}</p>
                      <WeightTilde className="w-4" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SecurityActionCard>
  );
};

export default ProfessionalInformation;
