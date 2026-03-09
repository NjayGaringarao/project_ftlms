import UserSummary from "@/components/me/overview/user-summary";
import WorkingLoadMetrics from "@/components/me/overview/working-load-metrics";
import DesignationInformation from "@/components/me/overview/designation-information";
import AssignedClassesInformation from "@/components/me/overview/assigned-classes-information";
import { getCurrentUser, getUserRole } from "@/lib/auth/utils";
import {
  getCurrentTermTeachingLoadByUserId,
  getDegreesByUserId,
  getIdentityByUserId,
  getProfessionalInfoByUserId,
} from "@/lib/me/profile";
import { cn } from "@/utils/style";

import { redirect } from "next/navigation";

const MePage = async () => {
  const authUser = await getCurrentUser();

  if (!authUser) {
    redirect("/auth/login");
  }

  const [identity, professionalInfo, teachingLoadInfo, userRoles, degrees] =
    await Promise.all([
      getIdentityByUserId(authUser.id),
      getProfessionalInfoByUserId(authUser.id),
      getCurrentTermTeachingLoadByUserId(authUser.id),
      getUserRole(),
      getDegreesByUserId(authUser.id),
    ]);

  const accountType: "Admin" | "User" = userRoles.includes("Admin")
    ? "Admin"
    : "User";

  const designationLoad = professionalInfo.designations.reduce(
    (sum, designation) => sum + (designation.load ?? 0),
    0,
  );
  const totalWorkingLoad =
    teachingLoadInfo.actual_teaching_load + designationLoad;

  return (
    <div
      className={cn(
        "bg-background h-full w-full p-6 overflow-y-auto",
        "flex flex-col gap-4",
        "xl:grid xl:grid-cols-2 2xl:grid-cols-3",
      )}
    >
      <UserSummary
        user={authUser}
        identity={identity}
        employmentStatus={professionalInfo.user?.employment_status ?? null}
        academicRank={professionalInfo.rank}
        accountType={accountType}
        degrees={degrees}
      />

      <div className="2xl:col-span-2 space-y-4">
        <WorkingLoadMetrics
          designationLoad={designationLoad}
          actualTeachingLoad={teachingLoadInfo.actual_teaching_load}
          totalWorkingLoad={totalWorkingLoad}
        />

        <DesignationInformation designations={professionalInfo.designations} />

        <AssignedClassesInformation
          term={teachingLoadInfo.term}
          classes={teachingLoadInfo.classes}
        />
      </div>
    </div>
  );
};

export default MePage;
