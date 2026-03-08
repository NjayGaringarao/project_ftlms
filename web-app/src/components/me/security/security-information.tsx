import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";
import {
  Verified,
  Mail,
  Calendar,
  Clock,
  Shield,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { formatDateTime } from "@/utils/time";

interface SecurityInformationProps {
  user: User;
}

const SecurityInformation = ({ user }: SecurityInformationProps) => {
  const isEmailConfirmed = !!user.email_confirmed_at;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5" />
          Security Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Email Status */}
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-foreground/60 mt-0.5" />
            <div>
              <p className="text-sm text-foreground/60">Email Address</p>
              <p className="font-medium">{user.email || "Not set"}</p>
              <div className="flex items-center gap-1 mt-1">
                {isEmailConfirmed ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600">Verified</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 text-red-600" />
                    <span className="text-xs text-red-600">Not verified</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Email Confirmed At */}
          {isEmailConfirmed && (
            <div className="flex items-start gap-3">
              <Verified className="w-5 h-5 text-foreground/60 mt-0.5" />
              <div>
                <p className="text-sm text-foreground/60">Email Verified On</p>
                <p className="font-medium text-sm">
                  {formatDateTime(user.email_confirmed_at)}
                </p>
              </div>
            </div>
          )}

          {/* Last Sign In */}
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-foreground/60 mt-0.5" />
            <div>
              <p className="text-sm text-foreground/60">Last Sign In</p>
              <p className="font-medium text-sm">
                {formatDateTime(user.last_sign_in_at)}
              </p>
            </div>
          </div>

          {/* Account Created */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-foreground/60 mt-0.5" />
            <div>
              <p className="text-sm text-foreground/60">Account Created</p>
              <p className="font-medium text-sm">
                {formatDateTime(user.created_at)}
              </p>
            </div>
          </div>

          {/* Account Status */}
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-foreground/60 mt-0.5" />
            <div>
              <p className="text-sm text-foreground/60">Account Status</p>
              <span className="inline-block px-3 py-1 bg-green-50 text-green-900 text-sm rounded-full border border-green-200">
                Active
              </span>
            </div>
          </div>

          {/* User ID */}
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-foreground/60 mt-0.5" />
            <div>
              <p className="text-sm text-foreground/60">User ID</p>
              <p className="font-mono font-medium text-xs break-all">
                {user.id}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityInformation;
