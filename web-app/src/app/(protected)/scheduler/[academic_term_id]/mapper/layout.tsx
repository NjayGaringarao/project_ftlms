import React from "react";

type MapperLayoutProps = {
  children: React.ReactNode;
};

const MapperLayout = ({ children }: MapperLayoutProps) => {
  return (
    <div className="flex h-full gap-4 overflow-hidden p-4">
      <div className="flex w-1/4 shrink-0 items-center justify-center rounded-lg border border-dashed p-4 text-sm text-foreground/70">
        <p>
          Class list component will be rendered here. It should look the similar
          to the component that uses /components/ui/list-container.
        </p>

        <p> Class should be filterable by:</p>
        <ul>
          <li>Faculty (user): Use components/ui/app-dialog.tsx to show a list of faculties with search functionality the same with the components/course-loading/class-maker-faculty-pane.tsx</li>
          <li>Room: Use components/ui/app-dialog.tsx to show a list of rooms with search functionality. include a filter of campuses</li>
          <li>Block: Use components/ui/app-dialog.tsx to show a list of blocks with search functionality. include a filter of campuses</li>
        </ul>
        <p>The changes on the filters above should reflect on the URL and back n fort. i am talking about query parameters. it is because it will be used by the children. </p>

        <p>after the filters, Class should be sortable using select by:</p>
        <ul>
          <li>ASC or DESC of class code</li>
          <li>ASC or Desc of Total hours (Lecture (course.lecture_unit) + Laboratory (course.laboratory_unit x 3))</li>
          <li>ASC or DESC of Total unscheduled hours</li>
        </ul>

        <p>
          Class Item should be rendered using components/ui/list-item-small.tsx. It should have a click action that opens the components/scheduler/class-schedule-dialog.tsx. the item should have the following information:
        </p>

        <ul>
          <li>Title: Class Code</li>
          <li>Subtitle: Unscheduled:(space)Lecture_hours(space)Laboratory_hours(space) </li>
          <li>Annotation: Total hours (Lecture (course.lecture_unit) + Laboratory (course.laboratory_unit x 3))</li>
        </ul>
        
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

export default MapperLayout;
