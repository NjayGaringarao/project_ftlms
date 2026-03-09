import { AcademicRank } from "@/models/academic_rank";
import { Degree } from "@/models/degree";
import { Identity } from "@/models/identity";
import { EmploymentStatus } from "@/models/user";
import PersonalInformation from "@/components/user/personal-information";
import EducationInformation from "@/components/user/education-information";
import EmploymentInformation from "@/components/user/employment-information";
import AccountInformation from "@/components/user/account-information";

type UserSummaryContentProps = {
  userId: string;
  email: string | null;
  emailStatus: string;
  accountType: "Admin" | "User";
  accountCreatedAt?: string | null;
  lastSignInAt?: string | null;
  identity: Identity | null;
  employmentStatus: EmploymentStatus | string | null;
  academicRank: AcademicRank | null;
  degrees: Degree[];
};

const UserSummaryContent = ({
  userId,
  email,
  emailStatus,
  accountType,
  accountCreatedAt,
  lastSignInAt,
  identity,
  employmentStatus,
  academicRank,
  degrees,
}: UserSummaryContentProps) => {
  return (
    <>
      <PersonalInformation identity={identity} />
      <EducationInformation degrees={degrees} />
      <EmploymentInformation
        employmentStatus={employmentStatus}
        academicRank={academicRank}
      />
      <AccountInformation
        userId={userId}
        email={email}
        emailStatus={emailStatus}
        accountType={accountType}
        accountCreatedAt={accountCreatedAt}
        lastSignInAt={lastSignInAt}
      />
    </>
  );
};

export default UserSummaryContent;
