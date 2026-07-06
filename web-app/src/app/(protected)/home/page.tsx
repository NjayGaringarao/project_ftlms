import AdminDashboard from "@/features/home/components/dashboards/admin-dashboard";
import CampusDirectorDashboard from "@/features/home/components/dashboards/campus-director-dashboard";
import CollegeDeanDashboard from "@/features/home/components/dashboards/college-dean-dashboard";
import ExecutiveDashboard from "@/features/home/components/dashboards/executive-dashboard";
import FacultyDashboard from "@/features/home/components/dashboards/faculty-dashboard";
import ProgramChairDashboard from "@/features/home/components/dashboards/program-chair-dashboard";
import WelcomeBanner from "@/features/home/components/welcome-banner";
import { getDashboardContext } from "@/features/home/lib/context";
import { DashboardContext } from "@/features/home/lib/types";
import { redirect } from "next/navigation";

const TERM_DEPENDENT_ROLES = [
  "Vice President for Academic Affairs",
  "Director for Instruction",
  "Campus Director",
  "College Dean",
  "Program Chairperson",
];

const renderDashboard = (context: DashboardContext) => {
  if (TERM_DEPENDENT_ROLES.includes(context.role) && !context.term) {
    return (
      <div className="p-6">
        <p className="text-sm text-foreground/60">
          No active academic term is configured. Insights will appear once a
          default academic term is set in the academic calendar.
        </p>
      </div>
    );
  }

  switch (context.role) {
    case "Admin":
      return <AdminDashboard />;
    case "Vice President for Academic Affairs":
      return (
        <ExecutiveDashboard
          context={context}
          step="VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS"
        />
      );
    case "Director for Instruction":
      return (
        <ExecutiveDashboard context={context} step="DIRECTOR_FOR_INSTRUCTION" />
      );
    case "Campus Director":
      return <CampusDirectorDashboard context={context} />;
    case "College Dean":
      return <CollegeDeanDashboard context={context} />;
    case "Program Chairperson":
      return <ProgramChairDashboard context={context} />;
    default:
      return <FacultyDashboard />;
  }
};

const HomePage = async () => {
  const context = await getDashboardContext();

  if (!context) {
    redirect("/auth/login");
  }

  return (
    <>
      <WelcomeBanner firstName={context.firstName} />
      {renderDashboard(context)}
    </>
  );
};

export default HomePage;
