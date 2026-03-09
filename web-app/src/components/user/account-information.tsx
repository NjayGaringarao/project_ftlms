import FieldView from "@/components/ui/field-view";
import { formatDateTime } from "@/utils/time";
import { Calendar, CheckCircle, Clock, Mail, User } from "lucide-react";

type AccountInformationProps = {
  userId: string;
  email: string | null;
  emailStatus: string;
  accountType: "Admin" | "User";
  accountCreatedAt?: string | null;
  lastSignInAt?: string | null;
};

const AccountInformation = ({
  userId,
  email,
  emailStatus,
  accountType,
  accountCreatedAt,
  lastSignInAt,
}: AccountInformationProps) => {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">
        Account Information
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <User className="w-4 h-4 mt-0.5 text-foreground/60" />
          <FieldView label="User ID" value={userId} />
        </div>

        <div className="flex items-start gap-3">
          <Mail className="w-4 h-4 mt-0.5 text-foreground/60" />
          <FieldView label="Email" value={email || "Not set"} />
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle className="w-4 h-4 mt-0.5 text-foreground/60" />
          <FieldView label="Email Status" value={emailStatus} />
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle className="w-4 h-4 mt-0.5 text-foreground/60" />
          <FieldView label="Account Type" value={accountType} />
        </div>

        <div className="flex items-start gap-3">
          <Calendar className="w-4 h-4 mt-0.5 text-foreground/60" />
          <FieldView
            label="Account Created"
            value={
              accountCreatedAt
                ? formatDateTime(accountCreatedAt)
                : "Not available"
            }
          />
        </div>

        <div className="flex items-start gap-3">
          <Clock className="w-4 h-4 mt-0.5 text-foreground/60" />
          <FieldView
            label="Last Sign-in"
            value={
              lastSignInAt ? formatDateTime(lastSignInAt) : "Not available"
            }
          />
        </div>
      </div>
    </section>
  );
};

export default AccountInformation;
