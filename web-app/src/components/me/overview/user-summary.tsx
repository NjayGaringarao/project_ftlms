import { Card, CardContent } from "@/components/ui/card";
import { Identity } from "@/models/identity";
import { AcademicRank } from "@/models/academic_rank";
import { Degree } from "@/models/degree";
import { EmploymentStatus } from "@/models/user";
import { formatDate, formatDateTime } from "@/utils/time";
import { Calendar, CheckCircle, Clock, Mail, User } from "lucide-react";
import { User as AuthUser } from "@supabase/supabase-js";
import DegreeListItem from "@/components/users/degree-list-item";

type UserSummaryProps = {
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

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <p className="text-xs uppercase tracking-wide text-foreground/60">
      {label}
    </p>
    <p className="text-sm font-medium wrap-break-word">{value}</p>
  </div>
);

const UserSummary = ({
  user,
  identity,
  employmentStatus,
  academicRank,
  accountType,
  degrees,
}: UserSummaryProps) => {
  const displayName = identity?.name?.trim() || "No name set";
  const initials = toInitials(identity?.name ?? "", user.email);
  const birthDate = identity?.birth_date
    ? formatDate(identity.birth_date)
    : "Not set";
  const contactNumber = identity?.contact_number?.trim() || "Not set";
  const address = identity?.address?.trim() || "Not set";
  const email = user.email || "Not set";
  const emailStatus = user.email_confirmed_at ? "Verified" : "Not verified";
  const rank = academicRank?.title ?? "Not set";
  const status = employmentStatus ?? "Not set";

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
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">
            Personal Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" value={displayName} />
            <Field label="Contact Number" value={contactNumber} />
            <Field label="Birth Date" value={birthDate} />
            <Field label="Address" value={address} />
          </div>
        </section>

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

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">
            Employment Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Employment Status" value={status} />
            <Field label="Academic Rank" value={rank} />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">
            Account Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 mt-0.5 text-foreground/60" />
              <Field label="User ID" value={user.id} />
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 mt-0.5 text-foreground/60" />
              <Field label="Email Status" value={emailStatus} />
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 mt-0.5 text-foreground/60" />
              <Field label="Account Type" value={accountType} />
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 mt-0.5 text-foreground/60" />
              <Field
                label="Account Created"
                value={formatDateTime(user.created_at)}
              />
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 mt-0.5 text-foreground/60" />
              <Field
                label="Last Sign-in"
                value={formatDateTime(user.last_sign_in_at)}
              />
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
};

export default UserSummary;
