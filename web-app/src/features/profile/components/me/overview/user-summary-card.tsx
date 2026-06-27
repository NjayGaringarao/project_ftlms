import { Card, CardContent } from "@/components/ui/card";
import { Identity } from "@/features/shared/types/models/identity";
import { AcademicRank } from "@/features/shared/types/models/academic_rank";
import { Degree } from "@/features/shared/types/models/degree";
import { EmploymentStatus } from "@/features/shared/types/models/user";
import { Mail } from "lucide-react";
import { formatFullName, nameInitials } from "@/features/shared/lib/format-name";
import PersonalInformation from "@/features/shared/components/user/personal-information";
import EducationInformation from "@/features/shared/components/user/education-information";
import EmploymentInformation from "@/features/shared/components/user/employment-information";
import AccountInformation from "@/features/shared/components/user/account-information";
import { UserOverviewReadModel } from "@/features/profile/lib/user-overview/types";

type UserSummaryCardProps = {
  userOverview: UserOverviewReadModel;
};

const UserSummaryCard = ({
  userOverview: {
    id,
    email,
    emailConfirmedAt,
    accountCreatedAt,
    lastSignInAt,
    identity,
    employmentStatus,
    rank: academicRank,
    accountType,
    degrees,
    campus,
    college,
  },
}: UserSummaryCardProps) => {
  const displayName = formatFullName(identity) || "No name set";
  const initials = nameInitials(identity, email ?? undefined);
  const displayEmail = email || "Not set";
  const emailStatus = emailConfirmedAt ? "Verified" : "Not verified";

  return (
    <Card className="h-auto xl:h-full xl:overflow-hidden gap-0 pb-0">
      <div className="flex items-end gap-4 border-b border-border pb-4 p-6">
        <div className="w-20 h-20 rounded-xl bg-foreground/90 text-background flex items-center justify-center text-2xl font-semibold">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-foreground/60">
            Profile Summary
          </p>
          <h1 className="text-2xl font-bold truncate">{displayName}</h1>
          <div className="flex items-center gap-2 text-sm text-foreground/70 mt-1">
            <Mail className="w-4 h-4" />
            <span className="truncate">{displayEmail}</span>
          </div>
        </div>
      </div>
      <CardContent className="p-6 space-y-6 overflow-y-auto">
        <PersonalInformation identity={identity} />
        <EducationInformation degrees={degrees} />
        <EmploymentInformation
          employmentStatus={employmentStatus}
          academicRank={academicRank}
          campus={campus}
          college={college}
        />
        <AccountInformation
          userId={id}
          email={email}
          emailStatus={emailStatus}
          accountType={accountType}
          accountCreatedAt={accountCreatedAt}
          lastSignInAt={lastSignInAt}
        />
      </CardContent>
    </Card>
  );
};

export default UserSummaryCard;
