import { College } from "./college";
import { Schedule } from "./schedule";

export type ScheduleCollege = {
  id: string;
  schedule_id: string;
  college_id: string;
};

export type ExtendedScheduleCollege = ScheduleCollege & {
  college: College;
  schedule: Schedule;
};
