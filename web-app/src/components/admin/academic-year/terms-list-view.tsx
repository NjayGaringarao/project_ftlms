"use client";

import { TermListItem } from "@/lib/admin/terms";
import { TermItem } from "./term-item";

type TermsListViewProps = {
  terms: TermListItem[];
};

export const TermsListView = ({ terms }: TermsListViewProps) => {
  return (
    <section className="space-y-4 border-t pt-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">
        Academic Terms
      </h2>

      {terms.length === 0 ? (
        <p className="text-sm text-foreground/60">No academic terms yet.</p>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
          {terms.map((term) => (
            <TermItem key={term.id} term={term} />
          ))}
        </div>
      )}
    </section>
  );
};
