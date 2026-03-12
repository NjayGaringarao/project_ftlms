import React from "react";


type ClassMakerProp = {
    academicTermId : string,
    mode: "Edit" | "Insert",
    facultyId: string | undefined,
    blockId: string | undefined
}

const ClassMaker = () => {
  return (
    <div>
      <p>
        ClassMaker is based on /components/ui/app-dialog.
        It is responsible for inserting or editing a class for the table in course-loading/[academic-termId]/faculty/[facultyId] and course-loading/[academic-termId]/block/[blockId] 
        In order to create a class; a faculty, campus, course, and block(s) should be picked. 
        It has two ui: Faculty-aware and Block-aware. It was determined if facultyId or blockId is supplied.
      </p>

      <p> Below is the UI for Faculty-aware:</p>
      <ul className="list-disc list-inside mt-2 text-foreground/80">
        <li>
          Campus dropdown will be populated with the campuses in the database
        </li>
      </ul>

      <p>
        The following will be rendered after the camnpus drop down as grid with
        2 columns wherein the design is similar to many list that defined in
        layout.tsx in /app that uses /components/ui/list-container.{" "}
      </p>
      <ul className="list-disc list-inside mt-2 text-foreground/80">
        <li>
          Course: A list of searchable courses. only 1 course is selectable
        </li>
        <li>
          Block(s): A list of searchable blocks within the campus. it should
          come with program-offering and year-level filter. More than 1 blocks
          can be selected.
        </li>
      </ul>

      <p> Below is the UI for Block-aware:</p>
      <ul className="list-disc list-inside mt-2 text-foreground/80">
        <li>
          Campus dropdown will be populated with the campuses in the database
        </li>
      </ul>

      <p>
        The following will be rendered after the camnpus drop down as grid with
        2 columns wherein the design is similar to many list that defined in
        layout.tsx in /app that uses /components/ui/list-container.{" "}
      </p>
      <ul className="list-disc list-inside mt-2 text-foreground/80">
        <li>
          Course: A list of searchable courses. only 1 course is selectable
        </li>
        <li>
          Faculty: A list of searchable faculty. only 1 faculty is selectable.
        </li>
      </ul>

        <p>This part should be rendered in all ui:</p>
      <p>
        The summary will be displayed along with Insert Class
        button
      </p>
    </div>
  );
};

export default ClassMaker;
