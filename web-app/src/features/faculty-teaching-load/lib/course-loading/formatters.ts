import type { FacultyClassBlock } from "./types";

export const formatFacultyBlockLabel = (block: FacultyClassBlock): string =>
  `${block.program_code} ${block.major_code} ${block.year_level}-${block.section}`;

export const formatFacultyBlockLabels = (
  blocks: FacultyClassBlock[],
): string =>
  blocks.length > 0
    ? blocks.map(formatFacultyBlockLabel).join(", ")
    : "Not assigned";
