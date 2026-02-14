import PersonalInformation from "@/components/me/personal-information";
import { getCurrentUser } from "@/lib/auth/utils";
import { getIdentityByUserId } from "@/lib/me/profile";
import { redirect } from "next/navigation";

const ProfilePage = async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const identity = await getIdentityByUserId(user.id);

  return (
    <div className="p-6 bg-background w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
      <PersonalInformation initialIdentity={identity} />
    </div>
  );
};

export default ProfilePage;
