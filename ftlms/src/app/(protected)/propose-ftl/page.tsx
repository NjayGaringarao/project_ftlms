import UnderConstruction from "@/components/ui/under-construction";

const ProposeFTLPage = () => {
  return (
    <div className="h-full p-4">
      <UnderConstruction />
      <h1 className="text-3xl">Propose FTL Page</h1>
      <h2 className="mt-4">
        This page is only accessible to PROGRAM CHAIR users. With this page,
        program chair will be allowed to:
      </h2>
      <ol className="flex-col p-2 text-foreground/80">
        <li>
          - Create and Modify FTL Proposal for each faculty under their college
        </li>
        <li>- Monitor FTL Proposal's approval status</li>
        <li>- Export Faculty Teaching Load</li>
      </ol>
    </div>
  );
};

export default ProposeFTLPage;
