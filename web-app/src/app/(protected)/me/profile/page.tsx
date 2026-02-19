import PersonalInformation from "@/components/me/personal-information";
import ProfessionalInformation from "@/components/me/professional-information";
import EducationInformation from "@/components/me/education-information";
import { getCurrentUser } from "@/lib/auth/utils";
import {
  getDegreesByUserId,
  getIdentityByUserId,
  getProfessionalInfoByUserId,
} from "@/lib/me/profile";
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
      />
      <EducationInformation initialDegrees={degrees} />
    </div>
  );
};

export default ProfilePage;
