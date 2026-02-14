import PersonalInformation from "@/components/me/personal-information";
import ProfessionalInformation from "@/components/me/professional-information";
import { getCurrentUser } from "@/lib/auth/utils";
import {
  getIdentityByUserId,
  getProfessionalInfoByUserId,
} from "@/lib/me/profile";
import { redirect } from "next/navigation";

const ProfilePage = async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [identity, professionalInfo] = await Promise.all([
    getIdentityByUserId(user.id),
    getProfessionalInfoByUserId(user.id),
  ]);

  return (
    <div className="p-6 bg-background w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
      <PersonalInformation initialIdentity={identity} />
      <ProfessionalInformation
        user={professionalInfo.user}
        rank={professionalInfo.rank}
        designations={professionalInfo.designations}
      />
    </div>
  );
};

export default ProfilePage;
