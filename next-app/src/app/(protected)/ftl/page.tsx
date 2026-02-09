import UnderConstruction from "@/components/ui/under-construction";

const EvaluateFTLPage = () => {
  return (
    <div className="h-full p-4 overflow-y-auto">
      <UnderConstruction />
      <h1 className="text-3xl">Faculty Teaching Load Page</h1>
      <h2>
        This page is accessible to EVALUATOR, CAMPUS DIRECTOR, and PROGRAM CHAIR
        users. This page should render different UI for each role.
      </h2>

      <div className="ml-4">
        <p className="text-xl mt-4">EVALUATOR</p>
        <ol className="flex-col p-2 text-foreground/80 list-disc list-inside">
          <li>
            Review and Evaluate FTL Proposals approved by campus directors
          </li>
        </ol>

        <p className="text-xl mt-4">CAMPUS DIRECTOR</p>
        <ol className="flex-col p-2 text-foreground/80 list-disc list-inside">
          <li>Review and Evaluate FTL Proposals submitted by program chairs</li>
        </ol>

        <p className="text-xl mt-4">PROGRAM CHAIR</p>
        <ol className="flex-col p-2 text-foreground/80 list-disc list-inside">
          <li>Create and submit FTL proposal</li>
          <li>Monitor FTL Proposal's approval progress</li>
        </ol>

        <p className="text-xl mt-4">ALL THREE</p>
        <ol className="flex-col p-2 text-foreground/80 list-disc list-inside">
          <li>Export visible FTL Proposals into PDF</li>
        </ol>
      </div>
    </div>
  );
};

export default EvaluateFTLPage;
