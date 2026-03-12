import React from "react";

const FacultyIdPage = () => {
  return (
    <div className="flex h-full items-center rounded-lg gap-4">
      <div className="text-start text-sm text-foreground/70 p-4 h-full flex-1 flex flex-col items-center justify-center border rounded-md">
        <p>
          Class management for faculty-aware will be rendered here (a component)
        </p>

        <p>
          This should be a component that holds a table.The table will have the
          following columns:
        </p>
        <ul className="list-disc list-inside mt-2 text-foreground/80">
          <li>Campus (code)</li>
          <li>Course (code)</li>
          <li>Block(s) (might contain multiple blocks)</li>
          <li>Laboratory (course.laboratory_unit x 0.75)</li>
          <li>Lecture (course.lecture_unit)</li>
          <li>ATL (Laboratory + Lecture)</li>
          <li>Merge Button (If there was a class with the same course and campus) or Unmerge Button (if the current row is a merged class wherein class having more than one class_block)</li>
          <li>Edit Button</li>
          <li>Delete Button</li>
        </ul>

        <p> after the rows, /components/ui/add-tile will be rendered. when clicked, the components/course-loading/class-maker.tsx will show up.</p>

        <p>Every changes in the table should cause the working loads to refresh</p>
      </div>
      
      <div className="p-4 h-full w-1/3 flex flex-col items-center justify-center border rounded-md">
        <p className="text-sm text-foreground/70">
          User Overview similar to /components/admin/users/user-view.tsx will be
          rendered here with the emphasis on working load and designations especially the components/user/working-load.
        </p>
      </div>
    </div>
  );
};

export default FacultyIdPage;
