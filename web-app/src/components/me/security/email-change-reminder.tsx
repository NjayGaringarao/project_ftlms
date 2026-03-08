import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { AlertCircle, Clock, TimerOff } from "lucide-react";
import { formatDateTime } from "@/utils/time";

interface EmailChangeReminderProps {
  user: User;
}

const EmailChangeReminder = ({ user }: EmailChangeReminderProps) => {
  const isRequestValid = user.email_change_sent_at
    ? new Date().getTime() - new Date(user.email_change_sent_at).getTime() <
      24 * 60 * 60 * 1000
    : false;

  if (user.new_email && isRequestValid) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <AlertCircle className="w-5 h-5" />
            Action Required: Pending Email Change
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-orange-800">
              <p className="mb-3">
                You have requested to change your email address. To complete
                this process, please check and confirm both email addresses:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>Current email:</strong> {user.email}
                </li>
                <li>
                  <strong>New email:</strong> {user.new_email}
                </li>
              </ul>
            </div>

            {user.email_change_sent_at && (
              <div className="flex items-start gap-3 pt-3 border-t border-orange-200">
                <div className="flex-1 flex gap-3">
                  <Clock className="w-4 h-4 text-orange-700 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-orange-700 font-medium">
                      Email Change Requested
                    </p>
                    <p className="text-orange-800">
                      {formatDateTime(user.email_change_sent_at)}
                    </p>
                  </div>
                </div>

                <div className="flex-1 flex gap-3">
                  <TimerOff className="w-4 h-4 text-orange-700 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-orange-700 font-medium">
                      Request Expiration
                    </p>
                    <p className="text-orange-800">
                      {formatDateTime(
                        new Date(
                          new Date(user.email_change_sent_at).getTime() +
                            24 * 60 * 60 * 1000,
                        ),
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  } else {
    return null;
  }
};

export default EmailChangeReminder;
