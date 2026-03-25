import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CampusEvaluationWorkspaceProps = {
  academicTermId: string;
  campusId: string;
  campusCode: string;
  campusName: string;
};

const CampusEvaluationWorkspace = ({
  academicTermId,
  campusId,
  campusCode,
  campusName,
}: CampusEvaluationWorkspaceProps) => {
  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campus Proposal Workspace</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-foreground/80 space-y-1">
          <p>
            <b>Campus:</b> {campusName} ({campusCode})
          </p>
          <p>
            <b>Term:</b> {academicTermId}
          </p>
          <p>
            <b>Campus ID:</b> {campusId}
          </p>
        </CardContent>
      </Card>

      <Card className="flex-1 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">DI / VPAA Evaluation Slot</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-foreground/70 space-y-3">
          <p>
            This panel is reserved for consolidated campus proposal summary,
            faculty breakdown, and DI/VPAA approve/reject action.
          </p>
          <p>
            Optional faculty-level drilldown can be rendered here as an accordion
            or table without leaving the campus-level route.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampusEvaluationWorkspace;
