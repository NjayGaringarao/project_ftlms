import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Briefcase, BookOpen, Award } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/utils";
import {
  getDegreesByUserId,
  getIdentityByUserId,
  getProfessionalInfoByUserId,
} from "@/lib/me/profile";
import { redirect } from "next/navigation";

const MePage = async () => {
  const authUser = await getCurrentUser();

  if (!authUser) {
    redirect("/auth/login");
  }

  const [identity, professionalInfo, degrees] = await Promise.all([
    getIdentityByUserId(authUser.id),
    getProfessionalInfoByUserId(authUser.id),
    getDegreesByUserId(authUser.id),
  ]);

  const user = {
    name: identity?.name?.trim() || "No profile name set",
    email: authUser.email ?? "No email set",
    roles: professionalInfo.designations.map(
      (designation) => designation.job_title,
    ),
    designation:
      professionalInfo.designations[0]?.job_title ?? "No designation assigned",
    education: degrees[0]?.title ?? "No degree record",
  };

  const primaryDesignation = professionalInfo.designations[0] ?? null;
  const hasDesignation = professionalInfo.designations.length > 0;
  const hasProgramContext = professionalInfo.designations.some(
    (designation) => designation.program?.name,
  );
  const hasCampusContext = professionalInfo.designations.some(
    (designation) => designation.campus?.name,
  );

  const designationCount = professionalInfo.designations.length;

  const uniqueRoles = Array.from(new Set(user.roles));

  return (
    <div className="h-full p-6 bg-background max-w-6xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-foreground/10 rounded-lg flex items-center justify-center">
                <Briefcase className="w-10 h-10 text-foreground/60" />
              </div>
              <div>
                <CardTitle className="text-2xl mb-1">{user.name}</CardTitle>
                <p className="text-foreground/70 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-foreground/60 mb-1">Designation</p>
              <p className="font-medium">{user.designation}</p>
            </div>
            <div>
              <p className="text-sm text-foreground/60 mb-1">Education</p>
              <p className="font-medium">{user.education}</p>
            </div>
            <div>
              <p className="text-sm text-foreground/60 mb-1">Roles</p>
              <div className="flex gap-2 flex-wrap">
                {uniqueRoles.length === 0 ? (
                  <span className="text-sm text-foreground/60">
                    No designation roles
                  </span>
                ) : (
                  uniqueRoles.map((role) => (
                    <span
                      key={role}
                      className="px-3 py-1 bg-foreground/10 text-foreground text-sm rounded-full"
                    >
                      {role}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hasDesignation && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Designation Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-foreground/60">Primary Role</p>
                  <p className="font-medium">{user.designation}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground/60">College</p>
                  <p className="font-medium">
                    {primaryDesignation?.college?.name ?? "Not assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-foreground/60">
                    Total Designations
                  </p>
                  <p className="font-medium">{designationCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {hasProgramContext && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Program Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-foreground/60">Program</p>
                  <p className="font-medium">
                    {primaryDesignation?.program?.name ?? "Not assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-foreground/60">Program Code</p>
                  <p className="font-medium">
                    {primaryDesignation?.program?.code ?? "Not assigned"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {hasCampusContext && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Campus Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-foreground/60">Campus</p>
                  <p className="font-medium">
                    {primaryDesignation?.campus?.name ?? "Not assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-foreground/60">Address</p>
                  <p className="font-medium">
                    {primaryDesignation?.campus?.address ?? "Not assigned"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MePage;
