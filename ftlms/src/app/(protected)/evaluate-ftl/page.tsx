import UnderConstruction from "@/components/ui/under-construction";

const EvaluateFTLPage = () => {
  return (
    <div className="h-full p-4">
      <UnderConstruction />
      <h1 className="text-3xl">Evaluate FTL Page</h1>
      <h2 className="mt-4">
        This page is only accessible to EVALUATOR and CAMPUS DIRECTOR users.
        With this page, those user will be allowed to:
      </h2>
      <ol className="flex-col p-2 text-foreground/80">
        <li>- Review and Evaluate FTL Proposals submitted by Program Chairs</li>
        <li>- Approve or Reject FTL Proposals based on evaluation criteria</li>
        <li>- Provide feedback and comments on FTL Proposals</li>
        <li>- Monitor the status of evaluated FTL Proposals</li>
        <li>- Export FTL Proposals as a PDF</li>
      </ol>
    </div>
  );
};

export default EvaluateFTLPage;
