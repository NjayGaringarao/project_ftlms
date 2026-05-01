import PersonalInformation from "@/features/profile/components/me/profile/personal-information";
import ProfessionalInformation from "@/features/profile/components/me/profile/professional-information";
import EducationInformation from "@/features/profile/components/me/profile/education-information";
import { getCurrentUser } from "@/features/auth/lib/utils";
import {
  getDegreesByUserId,
  getIdentityByUserId,
  getProfessionalInfoByUserId,
} from "@/features/profile/lib/me/profile";
import { redirect } from "next/navigation";

const ProfilePage = async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [identity, professionalInfo, degrees] = await Promise.all([
    getIdentityByUserId(user.id),
    getProfessionalInfoByUserId(user.id),
    getDegreesByUserId(user.id),
  ]);

  return (
    <div className="p-6 bg-background w-full grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto">
      <PersonalInformation initialIdentity={identity} />
      <ProfessionalInformation
        user={professionalInfo.user}
        rank={professionalInfo.rank}
        designations={professionalInfo.designations}
        campus={professionalInfo.campus}
        college={professionalInfo.college}
      />
      <EducationInformation initialDegrees={degrees} />
    </div>
  );
};

export default ProfilePage;
