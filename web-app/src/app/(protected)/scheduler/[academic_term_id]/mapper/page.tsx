import React from "react";



const MapperPage = () => {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-dashed p-4 text-sm text-foreground/70">
      <p>
        This section renders the scheduler grid. The class list is described in
        the layout component and should appear on the left side of the screen.
      </p>

      <p>
        The scheduler grid represents a weekly schedule with day tabs and a
        time-based table layout.
      </p>

      <p>The scheduler should support the following query parameters:</p>

      <pre>
        {`/schedule?facultyId={value}&blockId={value}&roomId={value}`}
      </pre>

      <p>
        These parameters control what schedules are rendered inside the grid.
        Only one context should normally be active at a time.
      </p>

      <ul>
        <li>
          <b>facultyId</b>: show schedules associated with the selected faculty
        </li>
        <li>
          <b>blockId</b>: show schedules associated with the selected block
        </li>
        <li>
          <b>roomId</b>: show schedules associated with the selected room
        </li>
      </ul>

      <p>
        The scheduler UI uses day tabs. Only one day is visible at a time to
        reduce horizontal space.
      </p>

      <pre>
        {`
[Mon] [Tue] [Wed] [Thu] [Fri] [Sat] [Sun]
`}
      </pre>

      <p>
        The grid itself is implemented using a table. The first column contains
        time slots. The remaining columns represent contextual information for
        the selected schedule view.
      </p>

      <p>Example grid structure:</p>

      <pre>
        {`
<table class="scheduler-grid">

  <thead>
    <tr>
      <th>Timeslot</th>
      <th>Faculty</th>
      <th>Block</th>
      <th>Room</th>
    </tr>
  </thead>

  <tbody>

    <tr>
      <td>06:00 AM - 06:30 AM</td>
      <td></td>
      <td></td>
      <td></td>
    </tr>

    <tr>
      <td>06:30 AM - 07:00 AM</td>
      <td></td>
      <td></td>
      <td></td>
    </tr>

    <tr>
      <td>07:00 AM - 07:30 AM</td>
      <td></td>
      <td></td>
      <td></td>
    </tr>

  </tbody>

</table>
`}
      </pre>

      <p>Each row represents a fixed time interval.</p>

      <p>
        Cells may render one of the following visual states depending on the
        current context and schedule data.
      </p>

      <ul>
        <li>
          <b>Empty cell</b>: No schedule exists for this timeslot.
        </li>
        <li>
          <b>Scheduled block</b>: A class schedule occupies the timeslot.
        </li>
        <li>
          <b>Occupied / conflict cell</b>: Another schedule exists that conflicts
          with the current context.
        </li>
      </ul>

      <p>A scheduled block should visually span multiple rows if needed.</p>

      <pre>
        {`
<tr>
  <td>07:30 AM - 08:00 AM</td>
  <td></td>
  <td rowspan="4">CC101 - BSCSWEB1A</td>
  <td></td>
</tr>
`}
      </pre>

      <p>
        The rendered block should represent a complete schedule event instead of
        separate faculty, block, and room entries.
      </p>

      <p>Example schedule block label:</p>

      <pre>
        {`
CC101 - BSCSWEB1A
`}
      </pre>

      <p>Click behavior inside the grid:</p>

      <ul>
        <li>
          Clicking a scheduled block opens{" "}
          <code>components/scheduler/class-schedule-dialog.tsx</code>.
        </li>

        <li>
          Clicking an empty timeslot while a class is selected should begin a
          scheduling action for that timeslot.
        </li>

        <li>
          Clicking a shaded conflict cell should update the query parameter to
          show the related context (faculty, block, or room).
        </li>
      </ul>

      <p>
        The scheduler grid should rerender automatically whenever query
        parameters change.
      </p>

    </div>
  );
};

export default MapperPage;