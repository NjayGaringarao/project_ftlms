import { Major } from "./major";

export type Curriculum = {
  id: string;
  major_id: string;
  title: string;
  series_year: number;
  revised_year: number | null;
};

export type ExtendedCurriculum = Curriculum & {
  major: Major;
};
