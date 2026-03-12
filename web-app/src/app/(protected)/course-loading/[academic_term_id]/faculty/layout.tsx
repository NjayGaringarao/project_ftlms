import React from "react";

const FacultyLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-full gap-4 overflow-hidden p-4">
      <div className="flex w-1/4 shrink-0 items-center justify-center rounded-lg border border-dashed p-4 text-sm text-foreground/70">
        Faculty list component will be rendered here. It should look the similar to the component that uses /components/ui/list-container.
        Faculty should be searchable.
         Items should have a title of faculty name, subtitle of latest degree.title, an annotation of total teaching load.
        when a faculty is clicked, the page will navigate to course-loading/[academic-termId]/faculty/[facultyId] and the class management and user overview for the faculty will be rendered in the right pane (the children)
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

export default FacultyLayout;
