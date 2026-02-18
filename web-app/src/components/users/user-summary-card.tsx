import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersListItem } from "@/lib/users/users";
import { Edit, UserCircle, X } from "lucide-react";
import Link from "next/link";

const getFullName = (user: UsersListItem | null) => {
  const identity = user?.identity;
  if (!identity) return "Unknown User";
  const parts = [
    identity.first_name,
    identity.middle_name,
    identity.last_name,
    identity.extension,
  ].filter(Boolean);
  return parts.join(" ");
};

const formatStatus = (status: string | null | undefined) => {
  if (!status) return "Unspecified";
  return status
    .split("_")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
};

type UserSummaryCardProps = {
  user: UsersListItem | null;
};

export const UserSummaryCard = ({ user }: UserSummaryCardProps) => {
  const name = getFullName(user);

  return (
    <Card className="overflow-hidden m-4 -mb-2">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle className="flex items-center gap-2">
          <UserCircle className="w-5 h-5" />
          User Information
        </CardTitle>
        <div className="flex flex-row items-center gap-4">
          <Link href={`/users/${user?.id}/edit`} className="text-foreground">
            <Edit />
          </Link>
          <Link href={`/users/`} className="text-foreground">
            <X />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="overflow-y-auto">
        <div>
          <p className="text-sm text-foreground/60">Name</p>
          <p className="text-base font-medium">{name}</p>
        </div>
        <div>
          <p className="text-sm text-foreground/60">Email</p>
          <p className="text-base font-medium">
            {user?.email ?? "Email not available"}
          </p>
        </div>
        <div>
          <p className="text-sm text-foreground/60">Employment Status</p>
          <p className="text-base font-medium">
            {formatStatus(user?.employment_status)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
