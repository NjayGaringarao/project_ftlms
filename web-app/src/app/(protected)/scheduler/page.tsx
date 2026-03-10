import SchedulerUI from "@/components/schedule/scheduler/scheduler-ui";
import { PageHeader } from "@/components/ui/page-header";
import { getUserRole } from "@/lib/auth/utils";
import { UserRole } from "@/models";

const getAccessLabel = (roles: UserRole[]) => {
  if (roles.includes("Admin")) return "Administrator Access";
  if (roles.includes("Program Chairperson")) return "Program Chair Access";
  if (roles.includes("College Dean")) return "Dean Access";
  if (roles.includes("Campus Director")) return "Campus Director Access";
  if (roles.includes("University President"))
    return "University President Access";
  return "Faculty Access";
};

const SchedulerPage = async () => {
  const userRole: UserRole[] = await getUserRole();
  const accessLabel = getAccessLabel(userRole);

  return (
    <div className="relative flex h-full flex-col">
      <PageHeader accessLabel={accessLabel} />
      {userRole.includes("Program Chairperson") ? <SchedulerUI /> : null}
    </div>
  );
};

export default SchedulerPage;
