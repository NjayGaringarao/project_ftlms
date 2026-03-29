import type { ReactNode } from "react";
import AutoPrintTrigger from "@/components/document-export/auto-print-trigger";

type DocumentPrintShellProps = {
  autoPrint: boolean;
  documents: ReactNode[];
};

const DocumentPrintShell = ({ autoPrint, documents }: DocumentPrintShellProps) => {
  return (
    <main className="min-h-screen bg-slate-100 p-4 print:bg-white print:p-0">
      <AutoPrintTrigger enabled={autoPrint} />
      <div className="flex flex-col gap-4 print:gap-0">
        {documents.map((document, index) => (
          <section
            key={index}
            className={index > 0 ? "print:break-before-page" : undefined}
            style={index > 0 ? { pageBreakBefore: "always" } : undefined}
          >
            {document}
          </section>
        ))}
      </div>
    </main>
  );
};

export default DocumentPrintShell;
