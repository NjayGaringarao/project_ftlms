import React from "react";

const SchedulerTimeSlotPicker = () => {
  return (
    <div>
      <h1>Scheduler Time Slot Picker</h1>
      <p>
        This component is resposible for picking time slot by allowing user to
        select multiple consecutive available time slots
      </p>
      <p>
        This component's dialog behaviour should reuse the
        component/ui/app-dialog.tsx
      </p>
      <p>
        The same as its parent component components/class-scheduler-dialog.tsx,
        it should have a mode for edit and create.
      </p>
      <p>
        This should show all the time slot from 7:00 AM to 10:00 PM with an
        interval of 30 minutes for each slot. example: 7:00 AM, 7:30 AM, 8:00
        AM, and so on until 10:00 PM.
      </p>
      <p>
        Each time slot will be displayed as a selectable option. It will become
        unselectable and the reason will be displayed if:
      </p>
      <ul className="list-disc list-inside mt-2 text-foreground/80">
        <li>the time slot is already occupied by another class</li>
        <li>the faculty has other schedule in the said time slot</li>
        <li>The block has other schedule in the said time slot</li>
        <li>The room is occupied in the said time slot</li>
      </ul>
      <p>
        When a user selects a time slot, the component should automatically
        select any consecutive available time slots that follows it until it
        reaches the end of expected selection. For example, the class lacks 2
        hours of lecture. if a user selects 9:00 AM and the next available time
        slots are 9:30 AM and 10:00 AM, those slots should also be selected
        automatically leaving 1 hours of lecture unscheduled and to be scheduled
        by creating another session.
      </p>
      <p>
        below there should have a cancel and okay button that is disabled
        conditionally.
      </p>
    </div>
  );
};

export default SchedulerTimeSlotPicker;
