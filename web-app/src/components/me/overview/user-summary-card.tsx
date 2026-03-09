import { Card, CardContent } from "@/components/ui/card";
import { Identity } from "@/models/identity";
import { AcademicRank } from "@/models/academic_rank";
import { Degree } from "@/models/degree";
import { EmploymentStatus } from "@/models/user";
import { Mail } from "lucide-react";
import { User as AuthUser } from "@supabase/supabase-js";
import PersonalInformation from "@/components/user/personal-information";
import EducationInformation from "@/components/user/education-information";
import EmploymentInformation from "@/components/user/employment-information";
import AccountInformation from "@/components/user/account-information";

type UserSummaryCardProps = {
  user: AuthUser;
  identity: Identity | null;
  employmentStatus: EmploymentStatus | null;
  academicRank: AcademicRank | null;
  accountType: "Admin" | "User";
  degrees: Degree[];
};

const toInitials = (name: string, email?: string) => {
  const normalizedName = name.trim();

  if (normalizedName) {
    const parts = normalizedName.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  return (email ?? "U").slice(0, 2).toUpperCase();
};

const UserSummaryCard = ({
  user,
  identity,
  employmentStatus,
  academicRank,
  accountType,
  degrees,
}: UserSummaryCardProps) => {
  const displayName = identity?.name?.trim() || "No name set";
  const initials = toInitials(identity?.name ?? "", user.email);
  const email = user.email || "Not set";
  const emailStatus = user.email_confirmed_at ? "Verified" : "Not verified";

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
            <span className="truncate">{email}</span>
          </div>
        </div>
      </div>
      <CardContent className="p-6 space-y-6 overflow-y-auto">
        <PersonalInformation identity={identity} />
        <EducationInformation degrees={degrees} />
        <EmploymentInformation
          employmentStatus={employmentStatus}
          academicRank={academicRank}
        />
        <AccountInformation
          userId={user.id}
          email={user.email ?? null}
          emailStatus={emailStatus}
          accountType={accountType}
          accountCreatedAt={user.created_at}
          lastSignInAt={user.last_sign_in_at}
        />
      </CardContent>
    </Card>
  );
};

export default UserSummaryCard;
