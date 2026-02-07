import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Briefcase, BookOpen, Award } from "lucide-react";

const MePage = () => {
  // Mock user data - replace with actual data from auth/database
  const user = {
    name: "John Doe",
    email: "john.doe@university.edu",
    roles: ["FACULTY", "EVALUATOR"],
    designation: "Assistant Professor",
    education: "PhD in Computer Science",
  };

  const facultyInfo = {
    department: "Computer Science",
    college: "College of Engineering",
    specialization: "Artificial Intelligence",
  };

  const chairInfo = {
    program: "Computer Science Major",
    startDate: "January 2023",
  };

  const directorInfo = {
    campus: "Main Campus",
    startDate: "August 2023",
  };

  const isFaculty = user.roles.includes("FACULTY");
  const isChair = user.roles.includes("CHAIR");
  const isDirector = user.roles.includes("DIRECTOR");

  return (
    <div className="h-full p-6 bg-background max-w-6xl mx-auto">
      {/* User Profile Card */}
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
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className="px-3 py-1 bg-foreground/10 text-foreground text-sm rounded-full"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role-Based Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Faculty Information */}
        {isFaculty && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Faculty Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-foreground/60">Department</p>
                  <p className="font-medium">{facultyInfo.department}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground/60">College</p>
                  <p className="font-medium">{facultyInfo.college}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground/60">Specialization</p>
                  <p className="font-medium">{facultyInfo.specialization}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Program Chair Information */}
        {isChair && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Program Chair
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-foreground/60">Program</p>
                  <p className="font-medium">{chairInfo.program}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground/60">Chair Since</p>
                  <p className="font-medium">{chairInfo.startDate}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Campus Director Information */}
        {isDirector && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Campus Director
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-foreground/60">Campus</p>
                  <p className="font-medium">{directorInfo.campus}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground/60">Director Since</p>
                  <p className="font-medium">{directorInfo.startDate}</p>
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
