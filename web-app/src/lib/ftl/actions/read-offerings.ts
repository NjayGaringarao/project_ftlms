"use server";

import { createClient } from "@/utils/supabase/server";
import { FTLOffering, FTLOfferingOption } from "../types";
import { ensureProgramChair } from "./auth";
import { asNumber, asObject, asString, formatName, RowObject } from "./shared";

export const getOfferedCoursesByTermCampus = async (
  termId: string,
  campusId: string,
): Promise<FTLOffering[]> => {
  await ensureProgramChair();
  const supabase = await createClient();

  const { data: blocksRaw, error: blocksError } = await supabase
    .from("block")
    .select(
      `
      id,
      curriculum_id,
      year_level,
      section,
      student_count,
      major_offering:major_offering!inner(
        program_offering:program_offering!inner(campus_id)
      )
    `,
    )
    .eq("major_offering.program_offering.campus_id", campusId);

  if (blocksError) {
    console.error(
      "lib.ftl.getOfferedCoursesByTermCampus blocks::",
      blocksError,
    );
    return [];
  }

  const blocksByCurriculum = new Map<
    string,
    {
      id: string;
      year_level: number;
      section: string;
      student_count: number | null;
    }[]
  >();

  for (const raw of blocksRaw ?? []) {
    const row = raw as RowObject;
    const curriculumId = asString(row.curriculum_id);
    if (!curriculumId) continue;

    const bucket = blocksByCurriculum.get(curriculumId) ?? [];
    bucket.push({
      id: asString(row.id) ?? "",
      year_level: asNumber(row.year_level) ?? 1,
      section: asString(row.section) ?? "",
      student_count: asNumber(row.student_count),
    });
    blocksByCurriculum.set(curriculumId, bucket);
  }

  const curriculumIds = Array.from(blocksByCurriculum.keys());
  if (curriculumIds.length === 0) return [];

  const { data: offeringsRaw, error: offeringsError } = await supabase
    .from("course_offering")
    .select(
      `
      id,
      course_id,
      course:course!inner(id, code, title, lecture_hour, laboratory_hour),
      curriculum_offering:curriculum_offering!inner(
        id,
        curriculum_id,
        academic_term_id,
        curriculum:curriculum!inner(
          id,
          title,
          series_year,
          revised_year,
          major:major!inner(
            id,
            code,
            name,
            program:program(id, code, name)
          )
        )
      )
    `,
    )
    .eq("curriculum_offering.academic_term_id", termId)
    .in("curriculum_offering.curriculum_id", curriculumIds);

  if (offeringsError) {
    console.error(
      "lib.ftl.getOfferedCoursesByTermCampus offerings::",
      offeringsError,
    );
    return [];
  }

  return (offeringsRaw ?? []).map((raw) => {
    const row = raw as RowObject;
    const course = asObject(row.course);
    const curriculumOffering = asObject(row.curriculum_offering);
    const curriculum = asObject(curriculumOffering?.curriculum);
    const major = asObject(curriculum?.major);
    const program = asObject(major?.program);
    const curriculumId = asString(curriculumOffering?.curriculum_id) ?? "";

    return {
      course_offering_id: asString(row.id) ?? "",
      course_id: asString(row.course_id) ?? "",
      course_code: asString(course?.code) ?? "",
      course_title: asString(course?.title) ?? "",
      lecture_hour: asNumber(course?.lecture_hour),
      laboratory_hour: asNumber(course?.laboratory_hour),
      curriculum_id: curriculumId,
      curriculum_title: asString(curriculum?.title) ?? "",
      curriculum_series_year: asNumber(curriculum?.series_year) ?? 0,
      curriculum_revised_year: asNumber(curriculum?.revised_year),
      major_code: asString(major?.code),
      major_name: asString(major?.name),
      program_code: asString(program?.code),
      program_name: asString(program?.name),
      available_blocks:
        blocksByCurriculum
          .get(curriculumId)
          ?.sort((a, b) =>
            a.year_level === b.year_level
              ? a.section.localeCompare(b.section)
              : a.year_level - b.year_level,
          ) ?? [],
    };
  });
};

export const getOfferedCourseOptionsByTermCampuses = async (
  termId: string,
  campusIds: string[],
): Promise<FTLOfferingOption[]> => {
  await ensureProgramChair();

  const dedupedCampusIds = Array.from(new Set(campusIds.filter(Boolean)));
  if (!termId || dedupedCampusIds.length === 0) return [];

  const supabase = await createClient();

  const { data: blocksRaw, error: blocksError } = await supabase
    .from("block")
    .select(
      `
      id,
      curriculum_id,
      year_level,
      section,
      major_offering:major_offering!inner(
        major:major!inner(
          code,
          name,
          program:program(code, name)
        ),
        program_offering:program_offering!inner(
          campus:campus!inner(id, name)
        )
      )
    `,
    )
    .in("major_offering.program_offering.campus_id", dedupedCampusIds);

  if (blocksError) {
    console.error(
      "lib.ftl.getOfferedCourseOptionsByTermCampuses blocks::",
      blocksError,
    );
    return [];
  }

  const blocks = (blocksRaw ?? []).map((raw) => {
    const row = raw as RowObject;
    const majorOffering = asObject(row.major_offering);
    const major = asObject(majorOffering?.major);
    const program = asObject(major?.program);
    const programCampus = asObject(majorOffering?.program_offering);
    const campus = asObject(programCampus?.campus);

    return {
      id: asString(row.id) ?? "",
      curriculum_id: asString(row.curriculum_id) ?? "",
      year_level: asNumber(row.year_level) ?? 1,
      section: asString(row.section) ?? "",
      campus_id: asString(campus?.id) ?? "",
      campus_name: asString(campus?.name) ?? "Unknown Campus",
      program_code: asString(program?.code),
      major_code: asString(major?.code),
      major_name: asString(major?.name),
    };
  });

  const curriculumIds = Array.from(
    new Set(blocks.map((item) => item.curriculum_id).filter(Boolean)),
  );
  const blockIds = Array.from(
    new Set(blocks.map((item) => item.id).filter(Boolean)),
  );

  if (curriculumIds.length === 0 || blockIds.length === 0) return [];

  const [offeringsResult, takenResult] = await Promise.all([
    supabase
      .from("course_offering")
      .select(
        `
        id,
        course_id,
        course:course!inner(id, code, title, lecture_hour, laboratory_hour),
        curriculum_offering:curriculum_offering!inner(
          id,
          curriculum_id,
          academic_term_id,
          curriculum:curriculum!inner(id, title)
        )
      `,
      )
      .eq("curriculum_offering.academic_term_id", termId)
      .in("curriculum_offering.curriculum_id", curriculumIds),
    supabase
      .from("class_delivery_block")
      .select(
        `
        block_id,
        class_delivery:class_delivery!inner(
          id,
          course_allocation:course_allocation!inner(
            id,
            schedule_id,
            course_offering_id,
            schedule:schedule!inner(
            id,
            academic_term_id,
            user:user!inner(
              identity(first_name, middle_name, last_name, extension)
            )
            )
          )
        )
      `,
      )
      .eq("class_delivery.course_allocation.schedule.academic_term_id", termId)
      .in("block_id", blockIds),
  ]);

  if (offeringsResult.error) {
    console.error(
      "lib.ftl.getOfferedCourseOptionsByTermCampuses offerings::",
      offeringsResult.error,
    );
    return [];
  }

  if (takenResult.error) {
    console.error(
      "lib.ftl.getOfferedCourseOptionsByTermCampuses taken::",
      takenResult.error,
    );
    return [];
  }

  const takenMap = new Map<string, string[]>();

  for (const raw of takenResult.data ?? []) {
    const row = raw as RowObject;
    const classDelivery = asObject(row.class_delivery);
    const courseAllocation = asObject(classDelivery?.course_allocation);
    const courseOfferingId = asString(courseAllocation?.course_offering_id);
    const blockId = asString(row.block_id);
    if (!courseOfferingId || !blockId) continue;

    const schedule = asObject(courseAllocation?.schedule);
    const user = asObject(schedule?.user);
    const identity = asObject(user?.identity);
    const facultyName = formatName(
      asString(identity?.first_name),
      asString(identity?.middle_name),
      asString(identity?.last_name),
      asString(identity?.extension),
    );

    const key = `${courseOfferingId}:${blockId}`;
    const existing = takenMap.get(key) ?? [];

    if (!existing.includes(facultyName)) {
      existing.push(facultyName);
    }

    takenMap.set(key, existing);
  }

  const options: FTLOfferingOption[] = [];

  for (const rawOffering of offeringsResult.data ?? []) {
    const offering = rawOffering as RowObject;
    const curriculumOffering = asObject(offering.curriculum_offering);
    const curriculumId = asString(curriculumOffering?.curriculum_id);
    if (!curriculumId) continue;

    const curriculum = asObject(curriculumOffering?.curriculum);
    const course = asObject(offering.course);
    const courseOfferingId = asString(offering.id) ?? "";

    for (const block of blocks.filter(
      (item) => item.curriculum_id === curriculumId,
    )) {
      const key = `${courseOfferingId}:${block.id}`;
      const assignedFaculty = takenMap.get(key) ?? [];

      options.push({
        key,
        campus_id: block.campus_id,
        campus_name: block.campus_name,
        course_offering_id: courseOfferingId,
        block_id: block.id,
        block_label: `Y${block.year_level}-${block.section}`,
        course_code: asString(course?.code) ?? "",
        course_title: asString(course?.title) ?? "",
        lecture_hour: asNumber(course?.lecture_hour),
        laboratory_hour: asNumber(course?.laboratory_hour),
        program_code: block.program_code,
        major_code: block.major_code,
        major_name: block.major_name,
        curriculum_title: asString(curriculum?.title) ?? "",
        is_taken: assignedFaculty.length > 0,
        assigned_faculty_name:
          assignedFaculty.length > 0 ? assignedFaculty.join(", ") : null,
      });
    }
  }

  return options.sort((a, b) => {
    if (a.campus_name !== b.campus_name)
      return a.campus_name.localeCompare(b.campus_name);
    if (a.course_code !== b.course_code)
      return a.course_code.localeCompare(b.course_code);
    if ((a.program_code ?? "") !== (b.program_code ?? "")) {
      return (a.program_code ?? "").localeCompare(b.program_code ?? "");
    }
    return a.block_label.localeCompare(b.block_label);
  });
};
