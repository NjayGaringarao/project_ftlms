import React from "react";

const BlockLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-full gap-4 overflow-hidden p-4">
      <div className="flex w-1/4 shrink-0 items-center justify-center rounded-lg border border-dashed p-4 text-sm text-foreground/70">
        Block list component will be rendered here. It should look the similar to the component that uses /components/ui/list-container.
        Block should be searchable and filterable by campus, program offering, and year level. Another filter is the academic-term in which is not controllable here but controllable in components/course-loading/term-switcher
        Items should have a title of Block code, subtitle of program offering code, an annotation of total unit.
        when a block is clicked, the page will navigate to course-loading/[academic-termId]/block/[blockId] and the class management for the block will be rendered in the right pane (the children)
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

export default BlockLayout;
