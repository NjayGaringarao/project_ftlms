import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FacultyEvaluationWorkspaceProps = {
  academicTermId: string;
  facultyId: string;
  facultyName: string;
  campusName: string;
  collegeName: string;
};

const FacultyEvaluationWorkspace = ({
  academicTermId,
  facultyId,
  facultyName,
  campusName,
  collegeName,
}: FacultyEvaluationWorkspaceProps) => {
  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Faculty Proposal Workspace</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-foreground/80 space-y-1">
          <p>
            <b>Faculty:</b> {facultyName}
          </p>
          <p>
            <b>Campus:</b> {campusName}
          </p>
          <p>
            <b>College:</b> {collegeName}
          </p>
          <p>
            <b>Term:</b> {academicTermId}
          </p>
          <p>
            <b>Faculty ID:</b> {facultyId}
          </p>
        </CardContent>
      </Card>

      <Card className="flex-1 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Campus Director Evaluation Slot</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-foreground/70">
          This panel is reserved for the individual faculty proposal review,
          comments, and final approve/reject action.
        </CardContent>
      </Card>
    </div>
  );
};

export default FacultyEvaluationWorkspace;
