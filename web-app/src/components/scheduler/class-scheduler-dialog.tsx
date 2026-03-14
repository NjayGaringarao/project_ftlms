import React from "react";

const ClassSchedulerDialog = () => {
  return (
    <div>
      <p>
        ClassSchedulerDialog is based on /components/ui/app-dialog. It is
        responsible for inserting or editing (mode) a session and showing the
        class information. It should have two modes, create and edit.
      </p>

      <p>
        The overall layout should be divided into two columns. Left is for
        Session Management and the right is for Class Information.
      </p>
      <div>
        <h1>Session Management</h1>
        <p>
          It should have a list of session that uses
          components/ui/list-item-small.tsx with the following parameter:
        </p>
        <ul>
          <li>title: session.code</li>
          <li>
            subtitle: room.code | session.start-session.end (12 hour format)
          </li>
          <li>
            annotation: session.type(space)session duration in hours example:
            Lec 2h
          </li>
        </ul>
        <p>
          after the list of sessions, there should be a conditionally rendered
          /components/ui/add-tile.tsx with a tile of "Insert Session"
        </p>
        <p>
          when the user clicks Insert Session, it should render a form inline
          with cancel and insert buttons. This form consists of the following
          fields:
        </p>
        <ul>
          <li>
            Type: A radio button group for selecting session type. it has
            options for Lecture, and Laboratory
          </li>
          <li>
            Room (should show a dialog that is based on
            /components/ui/app-dialog the list of rooms that is within the
            campus where block is associated.)
          </li>
          <li>Day (show a dropdown of days from Monday to Sunday)</li>
          <li>
            Time (Show the /components/scheduler/scheduler-time-slot-picker.tsx
            component to get the available time slot. If time slot is selected,
            it should display in the format: TT:MMAM/PM-TT:MMAM/PM example:
            8:00AM-9:00AM){" "}
          </li>
        </ul>
      </div>
      <div>
        <h1>Class Information</h1>
        <p>
          This part is for showing the class information. It should show the following information:
        </p>
        <ul>
          <li>Class code (title)</li>
          <li>Course Information: Code + title, Total Unit</li>
          <li>Campus Info: name, address</li>
          <li>Faculty Info: Name, academic rank, degrees</li>
          <li>Block(s) Info: program name, major name, year level, section, student count</li>
        </ul>
      </div>
    </div>
  );
};

export default ClassSchedulerDialog;
